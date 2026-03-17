import Link from "next/link";
import { cookies } from "next/headers";
import { MetricHistoryChart } from "../components/metric-history-chart";
import { MiniMetricChart } from "../components/mini-metric-chart";
import { formatChineseDate, formatMetric, formatValueWithUnit } from "../lib/format";
import { getFamilyMember, getFamilyMembers, getGrowthTracking } from "../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../lib/i18n";

function buildTrendInsight(items, label, lang) {
  if (!items || items.length < 2) {
    return t(lang, `${label}正在累積更多資料。`, `More ${label.toLowerCase()} data is still being collected.`);
  }

  const firstValue = Number(items[0].value);
  const lastValue = Number(items[items.length - 1].value);
  const delta = Math.round((lastValue - firstValue) * 10) / 10;

  if (delta === 0) {
    return t(lang, `${label}整體保持平穩。`, `${label} is holding steady overall.`);
  }

  return t(
    lang,
    `${label}${delta > 0 ? "上升" : "下降"} ${Math.abs(delta)}。`,
    `${label} ${delta > 0 ? "increased" : "decreased"} by ${Math.abs(delta)}.`
  );
}

function formatDeltaLabel(trend) {
  if (!trend || trend.delta === null || trend.delta === undefined) {
    return "未有足夠資料";
  }

  if (trend.delta === 0) {
    return "與 30 天基準相若";
  }

  return `${trend.delta > 0 ? "+" : ""}${formatValueWithUnit(trend.delta, trend.unit)}`;
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

  const alexWeightTrend = alex?.metricTrends?.weight || [];
  const amelieWeightTrend = amelie?.metricTrends?.weight || [];
  const alexDashboard = alex?.dashboard || null;
  const amelieDashboard = amelie?.dashboard || null;
  const alexStepsTrend = alex?.metricTrends?.steps || [];
  const alexSleepTrend = alex?.metricTrends?.sleep || [];
  const alexRestingHeartRateTrend = alex?.metricTrends?.resting_heart_rate || [];
  const amelieStepsTrend = amelie?.metricTrends?.steps || [];
  const amelieSleepTrend = amelie?.metricTrends?.sleep || [];
  const amelieRestingHeartRateTrend = amelie?.metricTrends?.resting_heart_rate || [];
  const alexSecondaryMetric =
    alexDashboard?.cards?.latestSteps ||
    alexDashboard?.cards?.latestRestingHeartRate ||
    alexDashboard?.cards?.latestSleep ||
    alex?.latestMetrics?.steps;
  const amelieSecondaryMetric =
    amelieDashboard?.cards?.latestSleep ||
    amelieDashboard?.cards?.latestSteps ||
    amelieDashboard?.cards?.latestRestingHeartRate ||
    amelie?.latestMetrics?.sleep;

  return (
    <section className="space-y-8">
      <div className="panel-hero rounded-[44px] px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="section-kicker">Family Health Dashboard</p>
            <h1 className="display-heading mt-4 max-w-3xl text-5xl font-semibold text-ink sm:text-6xl">
              Family Overview
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {t(
                lang,
                "把每位家人的重要指標收斂成清晰概覽、趨勢與提醒，先看重點，再按需要深入。",
                "A calmer, summary-first view of each family member's key metrics, trends, and alerts."
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/family-members/alex"
                className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(0,113,227,0.24)]"
              >
                Alex Overview
              </Link>
              <Link
                href="/family-members/amelie"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-glass"
              >
                Amelie Overview
              </Link>
              <Link
                href="/family-members/ryan"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-glass"
              >
                Ryan Growth
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-band rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Family Members</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{members.length}</p>
              <p className="mt-2 text-sm text-slate-500">
                {t(lang, "每位成員用摘要卡而不是長列表查看健康狀態。", "Use concise summary cards instead of long raw-data lists.")}
              </p>
            </div>
            <div className="metric-band rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ryan Latest Growth</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {growth?.summary?.latestMeasurement
                  ? `${growth.summary.latestMeasurement.heightCm} cm`
                  : t(lang, "未有資料", "No data yet")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {growth?.summary?.latestMeasurement
                  ? t(lang, `體重 ${growth.summary.latestMeasurement.weightKg} kg`, `Weight ${growth.summary.latestMeasurement.weightKg} kg`)
                  : t(lang, "等待更多成長紀錄", "Waiting for more growth records")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-card rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Alex Latest Weight</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {formatMetric(alexDashboard?.cards?.latestWeight || alex?.latestMetrics?.weight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}
          </p>
          <p className="mt-2 text-sm text-slate-500">{buildTrendInsight(alexWeightTrend, t(lang, "體重", "Weight"), lang)}</p>
        </div>
        <div className="soft-card rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amelie Latest Weight</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {formatMetric(amelieDashboard?.cards?.latestWeight || amelie?.latestMetrics?.weight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}
          </p>
          <p className="mt-2 text-sm text-slate-500">{buildTrendInsight(amelieWeightTrend, t(lang, "體重", "Weight"), lang)}</p>
        </div>
        <div className="soft-card rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Alex Today</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatMetric(alexSecondaryMetric, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}</p>
          <p className="mt-2 text-sm text-slate-500">{t(lang, "常見用戶最關注步數、靜止心率和睡眠變化。", "Most people care first about steps, resting heart rate, and sleep trends.")}</p>
        </div>
        <div className="soft-card rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amelie Today</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatMetric(amelieSecondaryMetric, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}</p>
          <p className="mt-2 text-sm text-slate-500">{t(lang, "以睡眠、步數或心率去看整體狀態會比 raw data 更直觀。", "Sleep, steps, and heart rate are usually more useful than raw tables.")}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MetricHistoryChart
          items={alexWeightTrend}
          color="#0071e3"
          label="Alex Weight Trend"
          unit="kg"
          lang={lang}
        />
        <MetricHistoryChart
          items={amelieWeightTrend}
          color="#34a853"
          label="Amelie Weight Trend"
          unit="kg"
          lang={lang}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="soft-card rounded-[32px] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Alex Mini Charts</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">Daily Metrics</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MiniMetricChart items={alexStepsTrend} color="#34a853" label="Steps" unit="steps" compact lang={lang} />
            <MiniMetricChart items={alexSleepTrend} color="#5c6ac4" label="Sleep" unit="hours" compact lang={lang} />
            <MiniMetricChart
              items={alexRestingHeartRateTrend}
              color="#ff6b57"
              label="Resting Heart Rate"
              unit="bpm"
              compact
              lang={lang}
            />
            <MiniMetricChart
              items={alex?.metricTrends?.heart_rate || []}
              color="#ff8a65"
              label="Heart Rate"
              unit="bpm"
              compact
              lang={lang}
            />
            <MiniMetricChart items={alexWeightTrend} color="#0071e3" label="Weight" unit="kg" compact lang={lang} />
          </div>
        </div>

        <div className="soft-card rounded-[32px] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Amelie Mini Charts</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">Daily Metrics</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MiniMetricChart items={amelieStepsTrend} color="#34a853" label="Steps" unit="steps" compact lang={lang} />
            <MiniMetricChart items={amelieSleepTrend} color="#5c6ac4" label="Sleep" unit="hours" compact lang={lang} />
            <MiniMetricChart
              items={amelieRestingHeartRateTrend}
              color="#ff6b57"
              label="Resting Heart Rate"
              unit="bpm"
              compact
              lang={lang}
            />
            <MiniMetricChart
              items={amelie?.metricTrends?.heart_rate || []}
              color="#ff8a65"
              label="Heart Rate"
              unit="bpm"
              compact
              lang={lang}
            />
            <MiniMetricChart items={amelieWeightTrend} color="#0071e3" label="Weight" unit="kg" compact lang={lang} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MetricHistoryChart
          items={alexStepsTrend}
          color="#34a853"
          label="Alex Daily Steps"
          unit="steps"
          lang={lang}
        />
        <MetricHistoryChart
          items={amelieSleepTrend}
          color="#5c6ac4"
          label="Amelie Sleep Duration"
          unit="hours"
          lang={lang}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">Alex Trends</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="metric-band rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Steps vs 30 Days</p>
              <p className="mt-2 font-semibold text-ink">{formatDeltaLabel(alexDashboard?.trends?.steps)}</p>
            </div>
            <div className="metric-band rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sleep vs 30 Days</p>
              <p className="mt-2 font-semibold text-ink">{formatDeltaLabel(alexDashboard?.trends?.sleep)}</p>
            </div>
            <div className="metric-band rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resting HR vs 30 Days</p>
              <p className="mt-2 font-semibold text-ink">
                {formatDeltaLabel(alexDashboard?.trends?.restingHeartRate)}
              </p>
            </div>
            <div className="metric-band rounded-[22px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight vs 30 Days</p>
              <p className="mt-2 font-semibold text-ink">{formatDeltaLabel(alexDashboard?.trends?.weight)}</p>
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">Highlights</p>
          <div className="mt-5 space-y-3">
            {[...(alexDashboard?.insights || []).slice(0, 2), ...(amelieDashboard?.insights || []).slice(0, 2)].map((insight) => (
              <div key={`${insight.title}-${insight.description}`} className="metric-band rounded-[22px] p-4">
                <p className="text-sm font-semibold text-ink">{translateDynamicText(lang, insight.title)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{translateDynamicText(lang, insight.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">Family Profiles</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">At a Glance</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="metric-band rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {member.familyRole === "Father"
                    ? t(lang, "爸爸", "Father")
                    : member.familyRole === "Mother"
                      ? t(lang, "媽媽", "Mother")
                      : t(lang, "孩子", "Child")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{member.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{member.age} {t(lang, "歲", "yrs")}</p>
                <p className="mt-1 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth, false, lang)}</p>
                <p className="mt-4 text-sm text-slate-700">
                  {t(lang, "健康紀錄", "Health Records")} {member.totalHealthRecordCount || 0}
                </p>
                <p className="mt-1 text-sm text-slate-500">{t(lang, "運動紀錄", "Workout Records")} {member.totalExerciseLogCount || 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">Ryan Growth Summary</p>
          {growth?.summary ? (
            <>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                {t(lang, `相比第一筆紀錄，已長高 +${growth.summary.totalHeightGainCm} cm`, `Height change since first record: +${growth.summary.totalHeightGainCm} cm`)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t(
                  lang,
                  `最新測量為 ${growth.summary.latestMeasurement.heightCm} cm、${growth.summary.latestMeasurement.weightKg} kg。`,
                  `Latest measurement: ${growth.summary.latestMeasurement.heightCm} cm and ${growth.summary.latestMeasurement.weightKg} kg.`
                )}
              </p>
              <div className="metric-band mt-6 rounded-[24px] p-5">
                <p className="text-sm font-semibold text-ink">{translateDynamicText(lang, growth.insights[0]?.title)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {translateDynamicText(lang, growth.insights[0]?.description || growth.insights[0]?.detail)}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t(lang, "等待 Ryan 成長數據載入。", "Waiting for Ryan's growth data.")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
