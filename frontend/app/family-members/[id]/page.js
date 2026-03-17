import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ExerciseLogList } from "../../../components/exercise-log-list";
import { GrowthChart } from "../../../components/growth-chart";
import { GrowthInsights } from "../../../components/growth-insights";
import { HealthRecordTable } from "../../../components/health-record-table";
import { MetricHistoryChart } from "../../../components/metric-history-chart";
import { MiniMetricChart } from "../../../components/mini-metric-chart";
import { CoachActionsPanel } from "../../../components/coach-actions-panel";
import { ProfileManagementPanel } from "../../../components/profile-management-panel";
import { SmartHealthCoach } from "../../../components/smart-health-coach";
import { calculateBmi } from "../../../lib/bmi";
import { formatChineseDate, formatMetric, formatValueWithUnit } from "../../../lib/format";
import { getCoachInsights, getFamilyMember, getGrowthTracking, getWeeklyGoals } from "../../../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../../../lib/i18n";

function pickSecondaryTrend(metricTrends = {}) {
  const candidates = [
    ["steps", "Steps Trend", "steps", "#34a853"],
    ["resting_heart_rate", "Resting Heart Rate", "bpm", "#ff6b57"],
    ["heart_rate", "Heart Rate Trend", "bpm", "#ff8a65"],
    ["sleep", "Sleep Trend", "hours", "#5c6ac4"]
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

function formatDelta(trend, lang) {
  if (!trend || trend.delta === null || trend.delta === undefined) {
    return t(lang, "未有足夠資料", "Not enough data");
  }

  if (trend.delta === 0) {
    return t(lang, "與 30 天基準相若", "Similar to the 30-day baseline");
  }

  return `${trend.delta > 0 ? "+" : ""}${formatValueWithUnit(trend.delta, trend.unit, { lang })}`;
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
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  let member;
  let growth = null;
  let bmi = null;
  let coach = null;
  let weeklyGoals = [];

  try {
    member = await getFamilyMember(resolvedParams.id);
    coach = await getCoachInsights(resolvedParams.id, lang);
    weeklyGoals = await getWeeklyGoals(resolvedParams.id);
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
  const hasGrowthMeasurements = Boolean(growth?.measurements?.length);

  return (
    <section className="space-y-8">
      <Link href="/family-members" className="inline-flex text-sm font-semibold text-blue">
        ← {t(lang, "返回家庭成員列表", "Back to family members")}
      </Link>

      <div className="glass-panel rounded-[36px] p-8 shadow-panel">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {member.familyRole === "Father"
                ? t(lang, "爸爸", "Father")
                : member.familyRole === "Mother"
                  ? t(lang, "媽媽", "Mother")
                  : t(lang, "孩子", "Child")}
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-ink">
              {member.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "年齡", "Age")}</span>
              <span className="mt-1 block font-semibold">{member.age} {t(lang, "歲", "yrs")}</span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "性別", "Gender")}</span>
              <span className="mt-1 block font-semibold">
                {member.gender === "Male" ? t(lang, "男", "Male") : member.gender === "Female" ? t(lang, "女", "Female") : member.gender}
              </span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "生日", "Birthday")}</span>
              <span className="mt-1 block font-semibold">{formatChineseDate(member.dateOfBirth, false, lang)}</span>
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
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ryan Growth Tracking</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              Growth Summary and Charts
            </h2>
          </div>
          <GrowthInsights growth={growth} lang={lang} />
          {hasGrowthMeasurements ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <GrowthChart
                measurements={growth.measurements}
                metric="heightCm"
                color="#0071e3"
                label={t(lang, "身高趨勢", "Height Trend")}
                unit="cm"
                lang={lang}
              />
              <GrowthChart
                measurements={growth.measurements}
                metric="weightKg"
                color="#34a853"
                label={t(lang, "體重趨勢", "Weight Trend")}
                unit="kg"
                lang={lang}
              />
            </div>
          ) : (
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t(lang, "成長圖表", "Growth Charts")}</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{t(lang, "暫時未有圖表資料", "No chart data yet")}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {t(lang, "Ryan 的身高或體重有可用測量後，這裡就會顯示圖表。", "Ryan's chart will appear once at least one usable height or weight measurement is available.")}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {coach ? <SmartHealthCoach coach={coach} lang={lang} /> : null}
      {coach ? <CoachActionsPanel memberId={member.id} lang={lang} goals={weeklyGoals} /> : null}

      {member.familyRole !== "Child" ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Adult Health Tracking</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              Health Summary and Trends
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Health Records</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{member.totalHealthRecordCount || 0}</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Workout Records</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{member.totalExerciseLogCount || 0}</p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Weight</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestWeight || member.latestMetrics?.weight, {
                  emptyLabel: t(lang, "未填寫", "Not set"),
                  lang
                })}
              </p>
            </div>
            <div className="glass-panel rounded-[28px] p-6 shadow-glass">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Steps</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestSteps || member.latestMetrics?.steps, {
                  emptyLabel: t(lang, "未填寫", "Not set"),
                  lang
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
                  <p className="text-sm font-semibold text-ink">{translateDynamicText(lang, insight.title)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{translateDynamicText(lang, insight.description)}</p>
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
                lang={lang}
              />
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <MetricHistoryChart
              items={stepsHistory}
              color="#34a853"
              label="Daily Steps"
              unit="steps"
              lang={lang}
            />
            <MetricHistoryChart
              items={sleepHistory}
              color="#5c6ac4"
              label="Daily Sleep"
              unit="hours"
              lang={lang}
            />
          </div>

          <div className="glass-panel rounded-[28px] p-6 shadow-glass">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">More Charts</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Apple Health Mini Charts</h3>
              </div>
              <p className="text-sm text-slate-500">{t(lang, "看更多日常變化", "See more day-to-day changes")}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetricChart items={stepsHistory} color="#34a853" label="Steps" unit="steps" compact lang={lang} />
              <MiniMetricChart items={sleepHistory} color="#5c6ac4" label="Sleep" unit="hours" compact lang={lang} />
              <MiniMetricChart
                items={restingHeartRateHistory}
                color="#ff6b57"
                label="Resting Heart Rate"
                unit="bpm"
                compact
                lang={lang}
              />
              <MiniMetricChart items={heartRateHistory} color="#ff8a65" label="Heart Rate" unit="bpm" compact lang={lang} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Body Metrics</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Height</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(member.latestMetrics?.height, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Resting HR</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(
                        dashboard?.cards?.latestRestingHeartRate || member.latestMetrics?.resting_heart_rate,
                        {
                          emptyLabel: t(lang, "未填寫", "Not set"),
                          lang
                        }
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Sleep</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestSleep || member.latestMetrics?.sleep, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Waist</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestWaist || member.latestMetrics?.waist, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Hip</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestHip || member.latestMetrics?.hip, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest Chest</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestChest || member.latestMetrics?.chest, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {dashboard?.trends ? (
                <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">7 Days vs 30 Days</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Steps Change</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.steps, lang)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sleep Change</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.sleep, lang)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resting HR Change</p>
                      <p className="mt-1 font-semibold text-ink">
                        {formatDelta(dashboard.trends.restingHeartRate, lang)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight Change</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.weight, lang)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="glass-panel rounded-[28px] p-6 shadow-glass">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t(lang, "近期健康紀錄", "Recent Health Records")}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                      {t(
                        lang,
                        `只顯示最近 ${manualHealthRecords.length || 0} 筆手動紀錄`,
                        `Showing the latest ${manualHealthRecords.length || 0} manual records only`
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">{t(lang, "Apple Health 匯入資料不會在這裡顯示", "Apple Health imports are hidden here")}</p>
                </div>
                <div className="mt-5">
                  <HealthRecordTable records={manualHealthRecords} lang={lang} />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <ExerciseLogList logs={member.exerciseLogs || []} lang={lang} />
            </div>
          </div>
        </div>
      ) : null}

      <ProfileManagementPanel member={member} growth={growth} lang={lang} />
    </section>
  );
}
