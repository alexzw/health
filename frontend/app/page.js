import Link from "next/link";
import { cookies } from "next/headers";
import { GrowthChart } from "../components/growth-chart";
import { MetricHistoryChart } from "../components/metric-history-chart";
import { MiniMetricChart } from "../components/mini-metric-chart";
import { formatMetric, formatRelativeDate, formatValueWithUnit } from "../lib/format";
import { getFamilyMember, getFamilyMembers, getGrowthTracking } from "../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../lib/i18n";

function buildTrendChange(items, unit, lang) {
  if (!items || items.length < 2) {
    return t(lang, "仍在累積趨勢資料", "Trend data is still building");
  }

  const firstValue = Number(items[0].value);
  const lastValue = Number(items[items.length - 1].value);
  const delta = Math.round((lastValue - firstValue) * 10) / 10;

  if (delta === 0) {
    return t(lang, `與最近 30 天相若`, `Stable vs last 30 days`);
  }

  return t(
    lang,
    `${delta > 0 ? "↑" : "↓"} ${formatValueWithUnit(Math.abs(delta), unit, { lang })} 對比最近 30 天`,
    `${delta > 0 ? "↑" : "↓"} ${formatValueWithUnit(Math.abs(delta), unit, { lang })} vs last 30 days`
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

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
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
  const alexWeightTrend = alex?.metricTrends?.weight || [];
  const amelieWeightTrend = amelie?.metricTrends?.weight || [];
  const alexStepsTrend = alex?.metricTrends?.steps || [];
  const alexSleepTrend = alex?.metricTrends?.sleep || [];
  const alexHeartTrend = alex?.metricTrends?.resting_heart_rate || [];
  const amelieStepsTrend = amelie?.metricTrends?.steps || [];
  const amelieSleepTrend = amelie?.metricTrends?.sleep || [];
  const growthMeasurements = growth?.measurements || [];
  const latestGrowth = growth?.summary?.latestMeasurement || null;
  const growthGain = growth?.summary?.totalHeightGainCm ?? null;
  const homeInsights = [
    ...(alexDashboard?.insights || []).slice(0, 1),
    ...(amelieDashboard?.insights || []).slice(0, 1),
    ...(growth?.insights || []).slice(0, 1)
  ].filter(Boolean);

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
            <p className="section-kicker">{t(lang, "家庭總覽", "Family Overview")}</p>
          <h1 className="display-heading mt-4 text-5xl font-semibold text-ink sm:text-6xl">
            {t(lang, "Ryan 成長追蹤", "Ryan Growth Tracking")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {t(
              lang,
              "先看 Ryan 最新身高、體重與成長變化，再延伸查看大人的體重趨勢與今天活動。",
              "Start with Ryan's latest growth, then review adult weight trends and today's activity."
            )}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">{t(lang, "最新身高", "Latest Height")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {latestGrowth ? `${latestGrowth.heightCm} cm` : t(lang, "未有資料", "No data yet")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {latestGrowth
                  ? buildMetricStatus({ recordedAt: latestGrowth.measuredAt }, lang)
                  : t(lang, "先新增第一筆成長記錄", "Add the first growth record")}
              </p>
            </div>
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">{t(lang, "最新體重", "Latest Weight")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {latestGrowth ? `${latestGrowth.weightKg} kg` : t(lang, "未有資料", "No data yet")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {latestGrowth
                  ? t(lang, "與最新身高同日量度", "Measured together with the latest height")
                  : t(lang, "先新增第一筆成長記錄", "Add the first growth record")}
              </p>
            </div>
            <div className="metric-band rounded-[24px] p-5">
              <p className="eyebrow-label">{t(lang, "成長變化", "Growth Change")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {growthGain !== null
                  ? `+${formatValueWithUnit(growthGain, "cm", { lang })}`
                  : t(lang, "未有資料", "No data yet")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {growthGain !== null
                  ? t(lang, "對比第一筆記錄", "Since the first recorded measurement")
                  : t(lang, "需要至少兩筆成長記錄", "Needs at least two growth records")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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
            <p className="eyebrow-label">Alex</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {formatMetric(alexDashboard?.cards?.latestWeight || alex?.latestMetrics?.weight, {
                lang,
                emptyLabel: t(lang, "未有資料", "No data yet")
              })}
            </p>
            <p className="mt-3 text-sm text-slate-600">{buildTrendChange(alexWeightTrend, "kg", lang)}</p>
            <p className="mt-2 text-sm text-slate-500">
              {buildMetricStatus(alexDashboard?.cards?.latestWeight || alex?.latestMetrics?.weight, lang)}
            </p>
          </div>
          <div className="soft-card rounded-[30px] p-6">
            <p className="eyebrow-label">Amelie</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {formatMetric(amelieDashboard?.cards?.latestWeight || amelie?.latestMetrics?.weight, {
                lang,
                emptyLabel: t(lang, "未有資料", "No data yet")
              })}
            </p>
            <p className="mt-3 text-sm text-slate-600">{buildTrendChange(amelieWeightTrend, "kg", lang)}</p>
            <p className="mt-2 text-sm text-slate-500">
              {buildMetricStatus(amelieDashboard?.cards?.latestWeight || amelie?.latestMetrics?.weight, lang)}
            </p>
          </div>
          <div className="soft-card rounded-[30px] p-6 sm:col-span-2 xl:col-span-1">
            <p className="eyebrow-label">{t(lang, "今日活動", "Today Activity")}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{buildActivitySummary(alex, alexDashboard, lang)}</p>
            <p className="mt-3 text-sm text-slate-600">{buildActivitySummary(amelie, amelieDashboard, lang)}</p>
            <p className="mt-3 text-sm text-slate-500">
              {t(lang, "依 Apple Health 最新同步更新。", "Updated from the latest Apple Health sync.")}
            </p>
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
            <p className="text-sm text-slate-500">
              {t(lang, "顯示累積成長變化與最新量度。", "Track the latest measurement and total growth change.")}
            </p>
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
                label={t(lang, "Alex 最近 30 天體重", "Alex Weight - Last 30 Days")}
                unit="kg"
                lang={lang}
                timeframeLabel={t(lang, "時間範圍：最近 30 天", "Timeframe: last 30 days")}
                emptyActionLabel={t(lang, "新增體重記錄", "Add Weight Record")}
                emptyActionHref="/family-members/alex#manage"
              />
              <MetricHistoryChart
                items={amelieWeightTrend}
                color="#12805c"
                label={t(lang, "Amelie 最近 30 天體重", "Amelie Weight - Last 30 Days")}
                unit="kg"
                lang={lang}
                timeframeLabel={t(lang, "時間範圍：最近 30 天", "Timeframe: last 30 days")}
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
              timeframeLabel={t(lang, "最近 30 天", "Last 30 days")}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/family-members/alex#manage"
            />
            <MiniMetricChart
              items={alexSleepTrend}
              color="#5c6ac4"
              label={t(lang, "Alex 睡眠", "Alex Sleep")}
              unit="hours"
              compact
              lang={lang}
              timeframeLabel={t(lang, "最近 30 天", "Last 30 days")}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/family-members/alex#manage"
            />
            <MiniMetricChart
              items={amelieStepsTrend}
              color="#12805c"
              label={t(lang, "Amelie 步數", "Amelie Steps")}
              unit="steps"
              compact
              lang={lang}
              timeframeLabel={t(lang, "最近 30 天", "Last 30 days")}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/family-members/amelie#manage"
            />
            <MiniMetricChart
              items={alexHeartTrend}
              color="#ef6b5c"
              label={t(lang, "Alex 靜止心率", "Alex Resting Heart Rate")}
              unit="bpm"
              compact
              lang={lang}
              timeframeLabel={t(lang, "最近 30 天", "Last 30 days")}
              emptyActionLabel={t(lang, "同步 Apple Health", "Sync Apple Health")}
              emptyActionHref="/family-members/alex#manage"
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
            <p className="section-kicker">{t(lang, "重點提醒", "Insights")}</p>
            <div className="mt-5 grid gap-4">
              {homeInsights.length ? (
                homeInsights.map((insight) => (
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
    </section>
  );
}
