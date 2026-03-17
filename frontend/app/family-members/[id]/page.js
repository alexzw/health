import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseLogList } from "../../../components/exercise-log-list";
import { GrowthChart } from "../../../components/growth-chart";
import { GrowthInsights } from "../../../components/growth-insights";
import { HealthRecordTable } from "../../../components/health-record-table";
import { MetricHistoryChart } from "../../../components/metric-history-chart";
import { MiniMetricChart } from "../../../components/mini-metric-chart";
import { ProfileManagementPanel } from "../../../components/profile-management-panel";
import { calculateBmi } from "../../../lib/bmi";
import { formatChineseDate, formatMetric, formatValueWithUnit } from "../../../lib/format";
import { getFamilyMember, getGrowthTracking } from "../../../lib/api";

function pickSecondaryTrend(metricTrends = {}) {
  const candidates = [
    ["steps", "步數趨勢", "steps", "#34a853"],
    ["resting_heart_rate", "靜止心率", "bpm", "#ff6b57"],
    ["heart_rate", "心率趨勢", "bpm", "#ff8a65"],
    ["sleep", "睡眠趨勢", "hours", "#5c6ac4"]
  ];

  return candidates
    .map(([key, label, unit, color]) => ({
      key,
      label,
      unit,
      color,
      items: metricTrends[key] || []
    }))
    .find((entry) => entry.items.length);
}

function formatDelta(trend) {
  if (!trend || trend.delta === null || trend.delta === undefined) {
    return "未有足夠資料";
  }

  if (trend.delta === 0) {
    return "與 30 天基準相若";
  }

  return `${trend.delta > 0 ? "+" : ""}${formatValueWithUnit(trend.delta, trend.unit)}`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  try {
    const member = await getFamilyMember(resolvedParams.id);
    return {
      title: `${member.name} | 家庭健康追蹤`
    };
  } catch (_error) {
    return {
      title: "家庭成員 | 家庭健康追蹤"
    };
  }
}

export default async function FamilyMemberDetailPage({ params }) {
  const resolvedParams = await params;
  let member;
  let growth = null;
  let bmi = null;

  try {
    member = await getFamilyMember(resolvedParams.id);
    bmi = member.latestBmi;

    if (resolvedParams.id === "ryan") {
      growth = await getGrowthTracking(resolvedParams.id);
      bmi = calculateBmi(
        growth?.summary?.latestMeasurement?.weightKg || null,
        growth?.summary?.latestMeasurement?.heightCm || null
      );
    }
  } catch (error) {
    if (String(error.message).includes("404")) {
      notFound();
    }

    throw error;
  }

  const stepsHistory = member.metricTrends?.steps || [];
  const sleepHistory = member.metricTrends?.sleep || [];
  const restingHeartRateHistory = member.metricTrends?.resting_heart_rate || [];
  const heartRateHistory = member.metricTrends?.heart_rate || [];
  const secondaryTrend = pickSecondaryTrend(member.metricTrends);
  const dashboard = member.dashboard || null;
  const manualHealthRecords = (member.healthDataRecords || []).filter(
    (record) => !String(record.notes || "").startsWith("由 ")
  );

  return (
    <section className="space-y-8">
      <Link href="/family-members" className="inline-flex text-sm font-semibold text-blue">
        ← 返回家庭成員列表
      </Link>

      <div className="glass-panel rounded-[36px] p-8 shadow-panel">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {member.familyRole === "Father"
                ? "爸爸"
                : member.familyRole === "Mother"
                  ? "媽媽"
                  : "孩子"}
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-ink">
              {member.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">年齡</span>
              <span className="mt-1 block font-semibold">{member.age} 歲</span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">性別</span>
              <span className="mt-1 block font-semibold">
                {member.gender === "Male" ? "男" : member.gender === "Female" ? "女" : member.gender}
              </span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">生日</span>
              <span className="mt-1 block font-semibold">{formatChineseDate(member.dateOfBirth)}</span>
            </div>
            {bmi ? (
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
                <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">BMI</span>
                <span className="mt-1 block font-semibold">{bmi}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {growth ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ryan 成長追蹤</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              成長摘要與圖表
            </h2>
          </div>
          <GrowthInsights growth={growth} />
          <div className="grid gap-5 lg:grid-cols-2">
            <GrowthChart
              measurements={growth.measurements}
              metric="heightCm"
              color="#0071e3"
              label="身高趨勢"
              unit="cm"
            />
            <GrowthChart
              measurements={growth.measurements}
              metric="weightKg"
              color="#34a853"
              label="體重趨勢"
              unit="kg"
            />
          </div>
        </div>
      ) : null}

      {member.familyRole !== "Child" ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">成人健康追蹤</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              健康摘要與趨勢
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">健康紀錄總數</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{member.totalHealthRecordCount || 0}</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">運動紀錄總數</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{member.totalExerciseLogCount || 0}</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新體重</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestWeight || member.latestMetrics?.weight, {
                  emptyLabel: "未填寫"
                })}
              </p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新步數</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestSteps || member.latestMetrics?.steps, {
                  emptyLabel: "未填寫"
                })}
              </p>
            </div>
          </div>

          {dashboard?.insights?.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {dashboard.insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.title}
                  className={`rounded-[24px] p-5 ${
                    insight.severity === "warning"
                      ? "border border-amber-200 bg-amber-50"
                      : insight.severity === "positive"
                        ? "border border-emerald-200 bg-emerald-50"
                        : "glass-panel shadow-glass"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          ) : null}

          {secondaryTrend ? (
            <div className="grid gap-5 lg:grid-cols-1">
              <MetricHistoryChart
                items={secondaryTrend.items}
                color={secondaryTrend.color}
                label={secondaryTrend.label}
                unit={secondaryTrend.unit}
              />
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <MetricHistoryChart
              items={stepsHistory}
              color="#34a853"
              label="每日步數"
              unit="steps"
            />
            <MetricHistoryChart
              items={sleepHistory}
              color="#5c6ac4"
              label="每日睡眠"
              unit="hours"
            />
          </div>

          <div className="glass-panel rounded-[28px] p-6 shadow-glass">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">更多圖表</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Apple Health Mini Charts</h3>
              </div>
              <p className="text-sm text-slate-500">看更多日常變化</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetricChart items={stepsHistory} color="#34a853" label="步數" unit="steps" compact />
              <MiniMetricChart items={sleepHistory} color="#5c6ac4" label="睡眠" unit="hours" compact />
              <MiniMetricChart
                items={restingHeartRateHistory}
                color="#ff6b57"
                label="靜止心率"
                unit="bpm"
                compact
              />
              <MiniMetricChart items={heartRateHistory} color="#ff8a65" label="心率" unit="bpm" compact />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">身體指標</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新身高</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(member.latestMetrics?.height, {
                        emptyLabel: "未填寫"
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新靜止心率</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(
                        dashboard?.cards?.latestRestingHeartRate || member.latestMetrics?.resting_heart_rate,
                        {
                          emptyLabel: "未填寫"
                        }
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新睡眠</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestSleep || member.latestMetrics?.sleep, {
                        emptyLabel: "未填寫"
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {dashboard?.trends ? (
                <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">7 天 vs 30 天</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">步數變化</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.steps)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">睡眠變化</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.sleep)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">靜止心率變化</p>
                      <p className="mt-1 font-semibold text-ink">
                        {formatDelta(dashboard.trends.restingHeartRate)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">體重變化</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.weight)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">近期健康紀錄</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                      只顯示最近 {manualHealthRecords.length || 0} 筆手動紀錄
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">Apple Health 匯入資料不會在這裡顯示</p>
                </div>
                <div className="mt-5">
                  <HealthRecordTable records={manualHealthRecords} />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <ExerciseLogList logs={member.exerciseLogs || []} />
            </div>
          </div>
        </div>
      ) : null}

      <ProfileManagementPanel member={member} growth={growth} />
    </section>
  );
}
