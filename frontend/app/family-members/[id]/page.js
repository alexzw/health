import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseLogList } from "../../../components/exercise-log-list";
import { GrowthChart } from "../../../components/growth-chart";
import { GrowthInsights } from "../../../components/growth-insights";
import { HealthRecordTable } from "../../../components/health-record-table";
import { MetricHistoryChart } from "../../../components/metric-history-chart";
import { ProfileManagementPanel } from "../../../components/profile-management-panel";
import { calculateBmi } from "../../../lib/bmi";
import { formatChineseDate } from "../../../lib/format";
import { getFamilyMember, getGrowthTracking } from "../../../lib/api";

function formatMetricValue(metric, emptyLabel = "未填寫") {
  if (!metric || metric.value === null || metric.value === undefined) {
    return emptyLabel;
  }

  return `${metric.value} ${metric.unit || ""}`.trim();
}

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

  const weightHistory = member.metricTrends?.weight || [];
  const secondaryTrend = pickSecondaryTrend(member.metricTrends);

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
              <p className="mt-2 text-3xl font-semibold text-ink">{formatMetricValue(member.latestMetrics?.weight)}</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新步數</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{formatMetricValue(member.latestMetrics?.steps)}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <MetricHistoryChart
              items={weightHistory}
              color="#0071e3"
              label="體重趨勢"
              unit="kg"
            />
            {secondaryTrend ? (
              <MetricHistoryChart
                items={secondaryTrend.items}
                color={secondaryTrend.color}
                label={secondaryTrend.label}
                unit={secondaryTrend.unit}
              />
            ) : (
              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <p className="text-sm text-slate-500">
                  Apple Health 匯入更多步數、心率或睡眠資料後，這裡會顯示第二張趨勢圖。
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">身體指標</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新身高</p>
                    <p className="mt-1 font-semibold text-ink">{formatMetricValue(member.latestMetrics?.height)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新靜止心率</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetricValue(member.latestMetrics?.resting_heart_rate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">最新睡眠</p>
                    <p className="mt-1 font-semibold text-ink">{formatMetricValue(member.latestMetrics?.sleep)}</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">近期健康紀錄</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                      只顯示最近 {member.healthDataRecords?.length || 0} 筆
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">總數 {member.totalHealthRecordCount || 0} 筆</p>
                </div>
                <div className="mt-5">
                  <HealthRecordTable records={member.healthDataRecords || []} />
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
