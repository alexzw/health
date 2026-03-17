import Link from "next/link";
import { cookies } from "next/headers";
import { GrowthChart } from "../components/growth-chart";
import { MetricHistoryChart } from "../components/metric-history-chart";
import { MiniMetricChart } from "../components/mini-metric-chart";
import { TimeRangeCaption, TimeRangeFilter } from "../components/time-range-filter";
import { formatMetric, formatRelativeDate, formatValueWithUnit } from "../lib/format";
import { getFamilyMember, getFamilyMembers, getGrowthTracking } from "../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../lib/i18n";
import {
  buildFamilyHealthScore,
  buildMilestones,
  buildProactiveInsights,
  buildReminders,
  buildTodaySummary
} from "../lib/daily-engagement";
import {
  buildMetricSeriesFromRecords,
  filterItemsByRange,
  getTimeRangeLabel,
  normalizeTimeRange
} from "../lib/time-range";

function buildTrendChangeWithRange(items, unit, lang, rangeLabel) {
  if (!items || items.length < 2) {
    return t(lang, "仍在累積趨勢資料", "Trend data is still building");
  }

  const firstValue = Number(items[0].value);
  const lastValue = Number(items[items.length - 1].value);
  const delta = Math.round((lastValue - firstValue) * 10) / 10;

  if (delta === 0) {
    return t(lang, `與${rangeLabel}相若`, `Stable vs ${rangeLabel.toLowerCase()}`);
  }

  return t(
    lang,
    `${delta > 0 ? "↑" : "↓"} ${formatValueWithUnit(Math.abs(delta), unit, { lang })} 對比${rangeLabel}`,
    `${delta > 0 ? "↑" : "↓"} ${formatValueWithUnit(Math.abs(delta), unit, { lang })} vs ${rangeLabel.toLowerCase()}`
  );
}

function buildMetricStatus(metric, lang) {
  if (!metric?.recordedAt) {
    return t(lang, "尚未同步最近資料", "No recent sync yet");
  }

  return formatRelativeDate(metric.recordedAt, lang);
}

function buildActivitySummary(member, dashboard, lang) {
  const steps = dashboard?.cards?.latestSteps || member?.latestMetrics?.steps;
  const sleep = dashboard?.cards?.latestSleep || member?.latestMetrics?.sleep;

  if (!steps && !sleep) {
    return t(lang, "今日活動資料未同步", "Today's activity has not synced yet");
  }

  if (steps && sleep) {
    return t(
      lang,
      `${formatMetric(steps, { lang })}，睡眠 ${formatMetric(sleep, { lang })}`,
      `${formatMetric(steps, { lang })}, sleep ${formatMetric(sleep, { lang })}`
    );
  }

  return steps ? formatMetric(steps, { lang }) : formatMetric(sleep, { lang });
}

export default async function HomePage({ searchParams }) {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  const resolvedSearchParams = await searchParams;
  const range = normalizeTimeRange(resolvedSearchParams?.range);
  let members = [];
  let alex = null;
  let amelie = null;
  let growth = null;

  try {
    [members, alex, amelie, growth] = await Promise.all([
      getFamilyMembers(),
      getFamilyMember("alex"),
      getFamilyMember("amelie"),
      getGrowthTracking("ryan")
    ]);
  } catch (_error) {
    members = [];
    alex = null;
    amelie = null;
    growth = null;
  }

  const alexDashboard = alex?.dashboard || null;
  const amelieDashboard = amelie?.dashboard || null;
  const alexWeightTrend = buildMetricSeriesFromRecords(alex?.healthDataRecords || [], "weight", range);
  const amelieWeightTrend = buildMetricSeriesFromRecords(amelie?.healthDataRecords || [], "weight", range);
  const alexStepsTrend = buildMetricSeriesFromRecords(alex?.healthDataRecords || [], "steps", range, "sum");
  const alexSleepTrend = buildMetricSeriesFromRecords(alex?.healthDataRecords || [], "sleep", range, "sum");
  const alexHeartTrend = buildMetricSeriesFromRecords(
    alex?.healthDataRecords || [],
    "resting_heart_rate",
    range,
    "average"
  );
  const amelieStepsTrend = buildMetricSeriesFromRecords(amelie?.healthDataRecords || [], "steps", range, "sum");
  const amelieSleepTrend = buildMetricSeriesFromRecords(amelie?.healthDataRecords || [], "sleep", range, "sum");
  const growthMeasurements = filterItemsByRange(growth?.measurements || [], range, (item) => item.measuredAt);
  const rangeLabel = getTimeRangeLabel(range, lang);
  const latestGrowth = growth?.summary?.latestMeasurement || null;
  const growthGain = growth?.summary?.totalHeightGainCm ?? null;
  const homeInsights = [
    ...(alexDashboard?.insights || []).slice(0, 1),
    ...(amelieDashboard?.insights || []).slice(0, 1),
    ...(growth?.insights || []).slice(0, 1)
  ].filter(Boolean);
  const engagementContext = { alex, amelie, growth };
  const todaySummary = buildTodaySummary(engagementContext, lang);
  const proactiveInsights = buildProactiveInsights(engagementContext, lang);
  const reminders = buildReminders(engagementContext, lang);
  const milestones = buildMilestones(engagementContext, lang);
  const familyHealthScore = buildFamilyHealthScore(engagementContext);

  const profileCards = [
    {
      id: "alex",
      name: "Alex",
      role: t(lang, "父親", "Father"),
      summary: alexDashboard?.cards?.latestWeight,
      accent: "from-sky-400 to-cyan-300"
    },
    {
      id: "amelie",
      name: "Amelie",
      role: t(lang, "母親", "Mother"),
      summary: amelieDashboard?.cards?.latestWeight,
      accent: "from-rose-300 to-orange-200"
    },
    {
      id: "ryan",
      name: "Ryan",
      role: t(lang, "孩子", "Child"),
      summary: latestGrowth
        ? {
            value: latestGrowth.heightCm,
            unit: "cm"
          }
        : null,
      accent: "from-emerald-300 to-lime-200"
    }
  ];

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel-hero rounded-[40px] px-7 py-8 sm:px-10 sm:py-10">
            <p className="section-kicker">{t(lang, "Today Summary", "Today Summary")}</p>
          <h1 className="display-heading mt-4 text-5xl font-semibold text-ink sm:text-6xl">
            {t(lang, "每日家庭健康總結", "Your family health at a glance")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {t(
              lang,
              "每天先看 Ryan 的成長狀態、Alex 和 Amelie 今日活動，以及系統主動發現的重點提醒。",
              "Open each day to see Ryan's growth status, Alex and Amelie's activity, and the most important proactive insight."
            )}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">Ryan</p>
              <p className="mt-2 text-xl font-semibold text-ink">{todaySummary.ryan}</p>
              <p className="mt-2 text-sm text-slate-500">
                {growth?.summary?.heightVelocityCmPerMonth !== null && growth?.summary?.heightVelocityCmPerMonth !== undefined
                  ? t(lang, `成長速度 ${growth.summary.heightVelocityCmPerMonth} cm / 月`, `Growth velocity ${growth.summary.heightVelocityCmPerMonth} cm / month`)
                  : buildMetricStatus({ recordedAt: latestGrowth?.measuredAt }, lang)}
              </p>
            </div>
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">Alex</p>
              <p className="mt-2 text-xl font-semibold text-ink">{todaySummary.alex}</p>
              <p className="mt-2 text-sm text-slate-500">{buildMetricStatus(alexDashboard?.cards?.latestSteps || alex?.latestMetrics?.steps, lang)}</p>
            </div>
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">Amelie</p>
              <p className="mt-2 text-xl font-semibold text-ink">{todaySummary.amelie}</p>
              <p className="mt-2 text-sm text-slate-500">{buildMetricStatus(amelieDashboard?.cards?.latestSteps || amelie?.latestMetrics?.steps, lang)}</p>
            </div>
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">{t(lang, "今日重點", "Key Insight")}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{proactiveInsights[0]?.title || t(lang, "仍在累積資料", "Still collecting data")}</p>
              <p className="mt-2 text-sm text-slate-500">{proactiveInsights[0]?.detail || t(lang, "新增更多記錄後，系統會開始主動提醒。", "Add more data and the system will start surfacing proactive guidance.")}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <TimeRangeFilter currentRange={range} basePath="/" lang={lang} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/family-members/ryan" className="button-primary px-5 py-3 text-sm font-semibold">
              {t(lang, "查看 Ryan 檔案", "Open Ryan Profile")}
            </Link>
            <Link href="/family-members/ryan#manage" className="button-secondary px-5 py-3 text-sm font-semibold">
              {t(lang, "新增成長記錄", "Add Growth Record")}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="soft-card rounded-[30px] p-6">
            <p className="eyebrow-label">{t(lang, "Family Health Score", "Family Health Score")}</p>
            <p className="mt-2 text-4xl font-semibold text-ink">{familyHealthScore} / 100</p>
            <p className="mt-2 text-sm text-slate-500">
              {t(lang, "綜合活動、體重趨勢、記錄一致性與 Ryan 成長狀態。", "Based on activity, weight trends, consistency, and Ryan's growth status.")}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue" style={{ width: `${familyHealthScore}%` }} />
            </div>
          </div>
          <div className="soft-card rounded-[30px] p-6">
            <p className="eyebrow-label">{t(lang, "今日可做的事", "Today's Best Actions")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/family-members/alex#manage" className="button-secondary px-4 py-2 text-sm font-semibold">
                {t(lang, "+ 新增 Alex 體重", "+ Add Alex Weight")}
              </Link>
              <Link href="/family-members/amelie#manage" className="button-secondary px-4 py-2 text-sm font-semibold">
                {t(lang, "+ 新增 Amelie 運動", "+ Add Amelie Workout")}
              </Link>
              <Link href="/family-members/ryan#manage-growth" className="button-secondary px-4 py-2 text-sm font-semibold">
                {t(lang, "+ 新增 Ryan 成長記錄", "+ Add Ryan Growth")}
              </Link>
              <Link href="/integrations" className="button-secondary px-4 py-2 text-sm font-semibold">
                {t(lang, "同步 Apple Health", "Sync Apple Health")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="soft-card rounded-[34px] p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">{t(lang, "重點功能", "Hero Feature")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
                {t(lang, "Ryan 成長趨勢", "Ryan Growth Trend")}
              </h2>
            </div>
            <TimeRangeCaption range={range} lang={lang} />
          </div>
          <div className="mt-5">
            <GrowthChart
              measurements={growthMeasurements}
              metric="heightCm"
              color="#0f6cbd"
              label={t(lang, "身高對比時間", "Height Over Time")}
              unit="cm"
              lang={lang}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="soft-card rounded-[34px] p-6 sm:p-7">
            <p className="section-kicker">{t(lang, "成人趨勢", "Adult Trends")}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {t(lang, "體重變化", "Weight Trends")}
            </h2>
            <div className="mt-5 grid gap-5">
              <MetricHistoryChart
                items={alexWeightTrend}
                color="#0f6cbd"
                label={t(lang, "Alex 體重趨勢", "Alex Weight Trend")}
                unit="kg"
                lang={lang}
                timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
                emptyActionLabel={t(lang, "新增體重記錄", "Add Weight Record")}
                emptyActionHref="/family-members/alex#manage"
              />
              <MetricHistoryChart
                items={amelieWeightTrend}
                color="#12805c"
                label={t(lang, "Amelie 體重趨勢", "Amelie Weight Trend")}
                unit="kg"
                lang={lang}
                timeframeLabel={`${t(lang, "時間範圍：", "Timeframe: ")}${getTimeRangeLabel(range, lang)}`}
                emptyActionLabel={t(lang, "新增體重記錄", "Add Weight Record")}
                emptyActionHref="/family-members/amelie#manage"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="soft-card rounded-[34px] p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-kicker">{t(lang, "迷你圖表", "Mini Charts")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
                {t(lang, "最近 30 天活動", "Last 30 Days")}
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MiniMetricChart
              items={alexStepsTrend}
              color="#12805c"
              label={t(lang, "Alex 步數", "Alex Steps")}
              unit="steps"
              compact
              lang={lang}
              timeframeLabel={getTimeRangeLabel(range, lang)}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
            <MiniMetricChart
              items={alexSleepTrend}
              color="#5c6ac4"
              label={t(lang, "Alex 睡眠", "Alex Sleep")}
              unit="hours"
              compact
              lang={lang}
              timeframeLabel={getTimeRangeLabel(range, lang)}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
            <MiniMetricChart
              items={amelieStepsTrend}
              color="#12805c"
              label={t(lang, "Amelie 步數", "Amelie Steps")}
              unit="steps"
              compact
              lang={lang}
              timeframeLabel={getTimeRangeLabel(range, lang)}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
            <MiniMetricChart
              items={alexHeartTrend}
              color="#ef6b5c"
              label={t(lang, "Alex 靜止心率", "Alex Resting Heart Rate")}
              unit="bpm"
              compact
              lang={lang}
              timeframeLabel={getTimeRangeLabel(range, lang)}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/integrations"
            />
          </div>
        </div>

        <div className="grid gap-6">
          <div className="soft-card rounded-[34px] p-6 sm:p-7">
            <p className="section-kicker">{t(lang, "家庭檔案", "Family Profiles")}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {t(lang, "快速入口", "Quick Access")}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {profileCards.map((member) => (
                <Link
                  key={member.id}
                  href={`/family-members/${member.id}`}
                  className="metric-band rounded-[24px] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${member.accent} text-center text-xl font-semibold leading-[44px] text-white`}>
                      {member.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-xl font-semibold text-ink">
                    {member.summary
                      ? formatMetric(member.summary, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })
                      : t(lang, "未有資料", "No data yet")}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{t(lang, "開啟完整檔案", "Open full profile")}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="soft-card rounded-[34px] p-6 sm:p-7">
            <p className="section-kicker">{t(lang, "主動提醒", "Proactive Insights")}</p>
            <div className="mt-5 grid gap-4">
              {proactiveInsights.length ? (
                proactiveInsights.map((insight) => (
                  <div key={`${insight.title}-${insight.description || insight.detail}`} className="metric-band rounded-[24px] p-5">
                    <p className="text-base font-semibold text-ink">{translateDynamicText(lang, insight.title)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {translateDynamicText(lang, insight.description || insight.detail)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-semibold text-slate-700">
                    {t(lang, "仍未有足夠提醒資料", "No insights yet")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t(
                      lang,
                      "先同步 Apple Health 或新增更多手動資料，系統就會開始產生趨勢提醒。",
                      "Sync Apple Health or add more manual records and the app will start generating useful insights."
                    )}
                  </p>
                  <Link href="/family-members/alex#manage" className="button-secondary mt-4 px-4 py-2 text-sm font-semibold">
                    {t(lang, "同步 Apple Health", "Sync Apple Health")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="soft-card rounded-[34px] p-6 sm:p-7">
          <p className="section-kicker">{t(lang, "里程碑", "Milestones")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {t(lang, "值得記住的進展", "Progress Worth Celebrating")}
          </h2>
          <div className="mt-5 space-y-4">
            {milestones.length ? (
              milestones.map((milestone) => (
                <div key={milestone.title} className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5">
                  <p className="text-base font-semibold text-emerald-950">{milestone.title}</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-900/80">{milestone.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
                {t(lang, "當你們累積更多進步，這裡會開始出現值得慶祝的 milestone。", "As more progress builds up, this area will start highlighting milestones worth celebrating.")}
              </div>
            )}
          </div>
        </div>

        <div className="soft-card rounded-[34px] p-6 sm:p-7">
          <p className="section-kicker">{t(lang, "提醒", "Reminders")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {t(lang, "避免健康習慣中斷", "Keep the habit alive")}
          </h2>
          <div className="mt-5 space-y-4">
            {reminders.length ? (
              reminders.map((reminder) => (
                <div key={reminder.title} className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-5">
                  <p className="text-base font-semibold text-amber-950">{reminder.title}</p>
                  <p className="mt-2 text-sm leading-6 text-amber-900/80">{reminder.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
                {t(lang, "目前沒有需要特別追趕的提醒，節奏維持得不錯。", "There are no overdue reminders right now. Your family is keeping a healthy rhythm.")}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
