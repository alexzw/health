import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ExerciseLogList } from "../../../components/exercise-log-list";
import { GrowthChart } from "../../../components/growth-chart";
import { GrowthInsights } from "../../../components/growth-insights";
import { HealthRecordTable } from "../../../components/health-record-table";
import { MetricHistoryChart } from "../../../components/metric-history-chart";
import { MiniMetricChart } from "../../../components/mini-metric-chart";
import { RecentGrowthRecords } from "../../../components/recent-growth-records";
import { CoachActionsPanel } from "../../../components/coach-actions-panel";
import { ProfileManagementPanel } from "../../../components/profile-management-panel";
import { SmartHealthCoach } from "../../../components/smart-health-coach";
import { TimeRangeCaption, TimeRangeFilter } from "../../../components/time-range-filter";
import { calculateBmi } from "../../../lib/bmi";
import { formatChineseDate, formatMetric, formatRelativeDate, formatValueWithUnit } from "../../../lib/format";
import { getCoachInsights, getFamilyMember, getGrowthTracking, getWeeklyGoals } from "../../../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../../../lib/i18n";
import { enrichGoalsWithProgress } from "../../../lib/goal-progress";
import { buildMemberHealthScores } from "../../../lib/daily-engagement";
import {
  buildMetricSeriesFromRecords,
  filterItemsByRange,
  getTimeRangeLabel,
  normalizeTimeRange
} from "../../../lib/time-range";

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

function getRoleLabel(member, lang) {
  return member.familyRole === "Father"
    ? t(lang, "父親", "Father")
    : member.familyRole === "Mother"
      ? t(lang, "母親", "Mother")
      : t(lang, "孩子", "Child");
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

export default async function FamilyMemberDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  const range = normalizeTimeRange(resolvedSearchParams?.range);
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

  const stepsHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "steps", range, "sum");
  const sleepHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "sleep", range, "sum");
  const waistHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "waist", range);
  const hipHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "hip", range);
  const chestHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "chest", range);
  const restingHeartRateHistory = buildMetricSeriesFromRecords(
    member.healthDataRecords || [],
    "resting_heart_rate",
    range,
    "average"
  );
  const heartRateHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "heart_rate", range, "average");
  const weightHistory = buildMetricSeriesFromRecords(member.healthDataRecords || [], "weight", range);
  const secondaryTrend = pickSecondaryTrend(member.metricTrends);
  const dashboard = member.dashboard || null;
  const manualHealthRecords = filterItemsByRange((member.healthDataRecords || []).filter(
    (record) => !String(record.notes || "").startsWith("由 ")
  ), range, (record) => record.recordedAt);
  const filteredGrowthMeasurements = filterItemsByRange(growth?.measurements || [], range, (item) => item.measuredAt);
  const hasGrowthMeasurements = Boolean(filteredGrowthMeasurements.length);
  const latestSyncMetric =
    dashboard?.cards?.latestSleep ||
    dashboard?.cards?.latestSteps ||
    member.latestMetrics?.weight ||
    member.latestMetrics?.height;
  const heroSubtitle = growth
    ? t(
        lang,
        "將 Ryan 的身高、體重與成長提醒集中喺同一頁面。",
        "A focused view of Ryan's height, weight, and growth insights."
      )
    : t(
        lang,
        "先看最新身體指標，再往下查看趨勢、教練建議與記錄管理。",
        "Start with the latest health signals, then review trends, coaching, and record management."
      );
  const goalsWithProgress = enrichGoalsWithProgress(weeklyGoals, member, growth);
  const currentMemberScore = buildMemberHealthScores(
    {
      alex: member.id === "alex" ? member : null,
      amelie: member.id === "amelie" ? member : null,
      growth: member.id === "ryan" ? growth : null
    },
    lang
  ).find((item) => item.id === member.id);

  return (
    <section className="space-y-8">
      <Link href="/family-members" className="inline-flex text-sm font-semibold text-blue">
        ← {t(lang, "返回家庭成員列表", "Back to family members")}
      </Link>

      <div className="panel-hero rounded-[40px] p-8 lg:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{getRoleLabel(member, lang)}</p>
            <h1 className="display-heading mt-3 text-5xl font-semibold text-ink sm:text-6xl">
              {member.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{heroSubtitle}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-band rounded-2xl px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "年齡", "Age")}</span>
              <span className="mt-1 block font-semibold">{member.age} {t(lang, "歲", "yrs")}</span>
            </div>
            <div className="metric-band rounded-2xl px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "性別", "Gender")}</span>
              <span className="mt-1 block font-semibold">
                {member.gender === "Male" ? t(lang, "男", "Male") : member.gender === "Female" ? t(lang, "女", "Female") : member.gender}
              </span>
            </div>
            <div className="metric-band rounded-2xl px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">{t(lang, "生日", "Birthday")}</span>
              <span className="mt-1 block font-semibold">{formatChineseDate(member.dateOfBirth, false, lang)}</span>
            </div>
            {bmi ? (
              <div className="metric-band rounded-2xl px-4 py-3 text-sm text-ink">
                <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">BMI</span>
                <span className="mt-1 block font-semibold">{bmi}</span>
              </div>
            ) : null}
          </div>
        </div>
        {currentMemberScore ? (
          <div className="mt-6 rounded-[26px] border border-white/70 bg-white/75 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-kicker">{t(lang, "個人健康分數", "Personal Health Score")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                  {currentMemberScore.score} / 100
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{currentMemberScore.status}</p>
              </div>
              <div className="w-full max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue" style={{ width: `${currentMemberScore.score}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-500">{currentMemberScore.detail}</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TimeRangeFilter currentRange={range} basePath={`/family-members/${member.id}`} lang={lang} />
        </div>
      </div>

      {growth ? (
        <div className="space-y-5">
          <div>
            <p className="section-kicker">{t(lang, "Ryan 成長追蹤", "Ryan Growth Tracking")}</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              {t(lang, "成長摘要與圖表", "Growth Summary and Charts")}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="#manage-growth" className="button-primary px-4 py-2.5 text-sm font-semibold">
                {t(lang, "編輯身高體重", "Edit Height & Weight")}
              </Link>
              <Link href="#manage-growth" className="button-secondary px-4 py-2.5 text-sm font-semibold">
                {t(lang, "新增成長記錄", "Add Growth Record")}
              </Link>
            </div>
            <div className="mt-4">
              <TimeRangeCaption range={range} lang={lang} />
            </div>
          </div>
          <GrowthInsights growth={growth} lang={lang} />
          {hasGrowthMeasurements ? (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <GrowthChart
                  measurements={filteredGrowthMeasurements}
                  metric="heightCm"
                  color="#0071e3"
                  label={t(lang, "身高趨勢", "Height Trend")}
                  unit="cm"
                  lang={lang}
                />
                <GrowthChart
                  measurements={filteredGrowthMeasurements}
                  metric="weightKg"
                  color="#34a853"
                  label={t(lang, "體重趨勢", "Weight Trend")}
                  unit="kg"
                  lang={lang}
                />
              </div>
              <RecentGrowthRecords memberId={member.id} measurements={filteredGrowthMeasurements} lang={lang} />
            </div>
          ) : (
            <div className="soft-card rounded-[28px] p-6">
              <p className="section-kicker">{t(lang, "成長圖表", "Growth Charts")}</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
                {t(lang, "Ryan 仍未有足夠成長資料", "Ryan needs more growth data")}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {t(
                  lang,
                  "先新增身高或體重記錄，之後就可以在這裡看到成長趨勢圖。",
                  "Add height or weight measurements to unlock Ryan's growth charts here."
                )}
              </p>
              <Link href="#manage-growth" className="button-secondary mt-4 px-4 py-2 text-sm font-semibold">
                {t(lang, "新增成長記錄", "Add Growth Record")}
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {coach ? <SmartHealthCoach coach={coach} lang={lang} /> : null}
      {coach ? <CoachActionsPanel memberId={member.id} lang={lang} goals={goalsWithProgress} /> : null}

      {member.familyRole !== "Child" ? (
        <div className="space-y-5">
          <div>
            <p className="section-kicker">{t(lang, "成人健康追蹤", "Adult Health Tracking")}</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              {t(lang, "健康摘要與趨勢", "Health Summary and Trends")}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="soft-card rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新體重", "Latest Weight")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestWeight || member.latestMetrics?.weight, {
                  emptyLabel: t(lang, "未填寫", "Not set"),
                  lang
                })}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t(lang, "時間範圍：最近 30 天", "Timeframe: last 30 days")}
              </p>
            </div>
            <div className="soft-card rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "今日活動", "Today Activity")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {formatMetric(dashboard?.cards?.latestSteps || member.latestMetrics?.steps, {
                  emptyLabel: t(lang, "未填寫", "Not set"),
                  lang
                })}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t(lang, "依最新同步資料顯示", "Based on the latest synced data")}
              </p>
            </div>
            <div className="soft-card rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "每週運動", "Weekly Workouts")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{member.totalExerciseLogCount || 0}</p>
              <p className="mt-2 text-sm text-slate-500">
                {t(lang, "已包含手動與 Apple Health 匯入紀錄", "Includes manual and Apple Health workout logs")}
              </p>
            </div>
            <div className="soft-card rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最近同步", "Latest Sync")}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{formatRelativeDate(latestSyncMetric?.recordedAt, lang)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {t(lang, "已同步最近 30 天資料", "Synced data from the last 30 days")}
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
                items={
                  secondaryTrend.key === "steps"
                    ? stepsHistory
                    : secondaryTrend.key === "resting_heart_rate"
                      ? restingHeartRateHistory
                      : secondaryTrend.key === "heart_rate"
                        ? heartRateHistory
                        : sleepHistory
                }
                color={secondaryTrend.color}
                label={
                  secondaryTrend.key === "steps"
                    ? t(lang, "每日步數", "Daily Steps")
                    : secondaryTrend.key === "resting_heart_rate"
                      ? t(lang, "靜止心率", "Resting Heart Rate")
                      : secondaryTrend.key === "heart_rate"
                        ? t(lang, "心率", "Heart Rate")
                        : t(lang, "睡眠", "Sleep")
                }
                unit={secondaryTrend.unit}
                lang={lang}
                timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
                emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
                emptyActionHref="/integrations"
              />
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <MetricHistoryChart
              items={weightHistory}
              color="#0f6cbd"
              label={t(lang, "體重趨勢", "Weight Trend")}
              unit="kg"
              lang={lang}
              timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
              emptyActionLabel={t(lang, "新增體重記錄", "Add Weight Record")}
              emptyActionHref="#manage"
            />
            <MetricHistoryChart
              items={stepsHistory}
              color="#34a853"
              label={t(lang, "每日步數", "Daily Steps")}
              unit="steps"
              lang={lang}
              timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <MetricHistoryChart
              items={sleepHistory}
              color="#5c6ac4"
              label={t(lang, "每日睡眠", "Daily Sleep")}
              unit="hours"
              lang={lang}
              timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
          </div>

          <div className="soft-card rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">{t(lang, "圍度變化", "Body Measurement Trends")}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
                  {t(lang, "腰圍、臀圍與胸圍", "Waist, Hip and Chest")}
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                {t(lang, "比單看體重更適合觀察塑形變化", "Useful for shaping progress beyond scale weight")}
              </p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <MetricHistoryChart items={waistHistory} color="#ff8a65" label={t(lang, "腰圍趨勢", "Waist Trend")} unit="cm" lang={lang} timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
              <MetricHistoryChart items={hipHistory} color="#7c4dff" label={t(lang, "臀圍趨勢", "Hip Trend")} unit="cm" lang={lang} timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
              <MetricHistoryChart items={chestHistory} color="#00a3a3" label={t(lang, "胸圍趨勢", "Chest Trend")} unit="cm" lang={lang} timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
            </div>
          </div>

          <div className="soft-card rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">{t(lang, "更多圖表", "More Charts")}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{t(lang, "Apple Health 迷你圖表", "Apple Health Mini Charts")}</h3>
              </div>
              <p className="text-sm text-slate-500">{t(lang, "看更多日常變化", "See more day-to-day changes")}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetricChart items={stepsHistory} color="#34a853" label={t(lang, "步數", "Steps")} unit="steps" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")} emptyActionHref="/integrations" />
              <MiniMetricChart items={sleepHistory} color="#5c6ac4" label={t(lang, "睡眠", "Sleep")} unit="hours" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")} emptyActionHref="/integrations" />
              <MiniMetricChart
                items={restingHeartRateHistory}
                color="#ff6b57"
                label={t(lang, "靜止心率", "Resting Heart Rate")}
                unit="bpm"
                compact
                lang={lang}
                timeframeLabel={getTimeRangeLabel(range, lang)}
                emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
                emptyActionHref="/integrations"
              />
              <MiniMetricChart items={heartRateHistory} color="#ff8a65" label={t(lang, "心率", "Heart Rate")} unit="bpm" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")} emptyActionHref="/integrations" />
              <MiniMetricChart items={waistHistory} color="#ff8a65" label={t(lang, "腰圍", "Waist")} unit="cm" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
              <MiniMetricChart items={hipHistory} color="#7c4dff" label={t(lang, "臀圍", "Hip")} unit="cm" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
              <MiniMetricChart items={chestHistory} color="#00a3a3" label={t(lang, "胸圍", "Chest")} unit="cm" compact lang={lang} timeframeLabel={getTimeRangeLabel(range, lang)} emptyActionLabel={t(lang, "新增身體圍度", "Add Body Measurement")} emptyActionHref="#manage" />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="soft-card rounded-[28px] p-6">
                <p className="section-kicker">{t(lang, "身體指標", "Body Metrics")}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新身高", "Latest Height")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(member.latestMetrics?.height, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新靜止心率", "Latest Resting HR")}</p>
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
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新睡眠", "Latest Sleep")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestSleep || member.latestMetrics?.sleep, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新腰圍", "Latest Waist")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestWaist || member.latestMetrics?.waist, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新臀圍", "Latest Hip")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatMetric(dashboard?.cards?.latestHip || member.latestMetrics?.hip, {
                        emptyLabel: t(lang, "未填寫", "Not set"),
                        lang
                      })}
                    </p>
                  </div>
                  <div className="metric-band rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "最新胸圍", "Latest Chest")}</p>
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
                <div className="soft-card rounded-[28px] p-6">
                  <p className="section-kicker">{t(lang, "7 天對比 30 天", "7 Days vs 30 Days")}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="metric-band rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "步數變化", "Steps Change")}</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.steps, lang)}</p>
                    </div>
                    <div className="metric-band rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "睡眠變化", "Sleep Change")}</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.sleep, lang)}</p>
                    </div>
                    <div className="metric-band rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "靜止心率變化", "Resting HR Change")}</p>
                      <p className="mt-1 font-semibold text-ink">
                        {formatDelta(dashboard.trends.restingHeartRate, lang)}
                      </p>
                    </div>
                    <div className="metric-band rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "體重變化", "Weight Change")}</p>
                      <p className="mt-1 font-semibold text-ink">{formatDelta(dashboard.trends.weight, lang)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="soft-card rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-kicker">{t(lang, "近期健康紀錄", "Recent Health Records")}</p>
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

      <div id={member.familyRole === "Child" ? "manage-growth" : "manage"}>
        <ProfileManagementPanel member={member} growth={growth} lang={lang} />
      </div>
    </section>
  );
}
