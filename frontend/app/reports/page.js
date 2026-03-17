import Link from "next/link";
import { cookies } from "next/headers";
import { getFamilyMember, getGrowthTracking } from "../../lib/api";
import { formatMetric, formatValueWithUnit } from "../../lib/format";
import { LANGUAGE_COOKIE, normalizeLanguage, t, translateDynamicText } from "../../lib/i18n";
import { buildWeeklyAiSummary } from "../../lib/daily-engagement";
import { buildMetricSeriesFromRecords } from "../../lib/time-range";
import { ReportActions } from "../../components/report-actions";

export const metadata = {
  title: "Family Health Report | Family Health Tracker"
};

function buildChangeText(series, unit, lang) {
  if (!series.length || series.length < 2) {
    return t(lang, "本週仍在累積資料", "Still collecting enough weekly data");
  }

  const first = Number(series[0].value || 0);
  const last = Number(series[series.length - 1].value || 0);
  const delta = Math.round((last - first) * 10) / 10;

  if (delta === 0) {
    return t(lang, "與一週前相若", "Stable vs one week ago");
  }

  return t(
    lang,
    `${delta > 0 ? "+" : ""}${formatValueWithUnit(delta, unit, { lang })} 對比 7 天前`,
    `${delta > 0 ? "+" : ""}${formatValueWithUnit(delta, unit, { lang })} vs 7 days ago`
  );
}

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  const [alex, amelie, growth] = await Promise.all([
    getFamilyMember("alex"),
    getFamilyMember("amelie"),
    getGrowthTracking("ryan")
  ]);

  const alexWeightWeek = buildMetricSeriesFromRecords(alex.healthDataRecords || [], "weight", "7d");
  const amelieWeightWeek = buildMetricSeriesFromRecords(amelie.healthDataRecords || [], "weight", "7d");
  const alexStepsWeek = buildMetricSeriesFromRecords(alex.healthDataRecords || [], "steps", "7d", "sum");
  const amelieStepsWeek = buildMetricSeriesFromRecords(amelie.healthDataRecords || [], "steps", "7d", "sum");
  const growthWeek = (growth?.measurements || []).filter(
    (item) => new Date(item.measuredAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const weeklyAiSummary = buildWeeklyAiSummary({ alex, amelie, growth }, lang);

  return (
    <section className="report-print-shell space-y-8">
      <div className="panel-hero rounded-[40px] p-8 lg:p-10">
        <p className="section-kicker">{t(lang, "每週報告", "Weekly Report")}</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">
          {t(lang, "Family Health Report", "Family Health Report")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
          {t(
            lang,
            "用一頁看完 Ryan 的成長、Alex 與 Amelie 的體重變化、本週活動摘要，以及最值得留意的健康提醒。",
            "See Ryan's growth, Alex and Amelie's weight changes, this week's activity summary, and the most important health insights in one place."
          )}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          {t(lang, "報告日期：今天", "Report date: today")}
        </p>
      </div>

      <div className="soft-card report-card rounded-[30px] p-6 sm:p-7">
        <p className="section-kicker">{t(lang, "AI Summary", "AI Summary")}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
          {t(lang, "可分享的每週解讀", "Shareable Weekly Narrative")}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-700">{weeklyAiSummary.headline}</p>
        <div className="no-print mt-5">
          <ReportActions shareText={weeklyAiSummary.shareText} lang={lang} />
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {weeklyAiSummary.memberSummaries.map((item) => (
            <div key={item.member} className="rounded-[22px] bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-ink">{item.member}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[22px] border border-white/80 bg-white/70 px-5 py-5">
          <p className="text-sm font-semibold text-ink">{t(lang, "本週建議", "Recommended Focus")}</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {weeklyAiSummary.recommendations.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="soft-card rounded-[30px] p-6">
          <p className="section-kicker">Ryan</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "成長摘要", "Growth Summary")}
          </h2>
          <p className="mt-4 text-lg font-semibold text-ink">
            {growth?.summary?.latestMeasurement
              ? `${growth.summary.latestMeasurement.heightCm} cm / ${growth.summary.latestMeasurement.weightKg} kg`
              : t(lang, "未有資料", "No data yet")}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {growth?.summary?.totalHeightGainCm !== null && growth?.summary?.totalHeightGainCm !== undefined
              ? t(
                  lang,
                  `自第一筆記錄起已長高 +${growth.summary.totalHeightGainCm} cm`,
                  `Height is up +${growth.summary.totalHeightGainCm} cm since the first record`
                )
              : t(lang, "需要更多成長記錄才能生成趨勢。", "More growth records are needed for a trend summary.")}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {growthWeek.length
              ? t(lang, `本週新增 ${growthWeek.length} 筆成長記錄`, `${growthWeek.length} growth records added this week`)
              : t(lang, "本週未新增成長記錄", "No new growth records this week")}
          </p>
        </div>

        <div className="soft-card rounded-[30px] p-6">
          <p className="section-kicker">Alex</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "體重與活動", "Weight & Activity")}
          </h2>
          <p className="mt-4 text-lg font-semibold text-ink">
            {formatMetric(alex.latestMetrics?.weight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{buildChangeText(alexWeightWeek, "kg", lang)}</p>
          <p className="mt-3 text-sm text-slate-500">
            {alexStepsWeek.length
              ? t(lang, `最近 7 天共 ${formatValueWithUnit(alexStepsWeek.reduce((sum, item) => sum + Number(item.value || 0), 0), "steps", { lang })}`, `Total ${formatValueWithUnit(alexStepsWeek.reduce((sum, item) => sum + Number(item.value || 0), 0), "steps", { lang })} in the last 7 days`)
              : t(lang, "本週未同步步數資料", "No step data synced this week")}
          </p>
        </div>

        <div className="soft-card rounded-[30px] p-6">
          <p className="section-kicker">Amelie</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "體重與活動", "Weight & Activity")}
          </h2>
          <p className="mt-4 text-lg font-semibold text-ink">
            {formatMetric(amelie.latestMetrics?.weight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{buildChangeText(amelieWeightWeek, "kg", lang)}</p>
          <p className="mt-3 text-sm text-slate-500">
            {amelieStepsWeek.length
              ? t(lang, `最近 7 天共 ${formatValueWithUnit(amelieStepsWeek.reduce((sum, item) => sum + Number(item.value || 0), 0), "steps", { lang })}`, `Total ${formatValueWithUnit(amelieStepsWeek.reduce((sum, item) => sum + Number(item.value || 0), 0), "steps", { lang })} in the last 7 days`)
              : t(lang, "本週未同步步數資料", "No step data synced this week")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="soft-card rounded-[30px] p-6">
          <p className="section-kicker">{t(lang, "本週提醒", "Key Insights")}</p>
          <div className="mt-4 space-y-4">
            {[...(alex.dashboard?.insights || []), ...(amelie.dashboard?.insights || []), ...(growth?.insights || [])]
              .slice(0, 5)
              .map((insight) => (
                <div key={`${insight.title}-${insight.description}`} className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-ink">{translateDynamicText(lang, insight.title)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{translateDynamicText(lang, insight.description)}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="soft-card rounded-[30px] p-6">
          <p className="section-kicker">{t(lang, "下一步", "Next Steps")}</p>
          <div className="mt-4 grid gap-4">
            <Link href="/ai-doctor" className="button-primary px-5 py-3 text-sm font-semibold text-center">
              {t(lang, "打開 AI 醫生助理", "Open AI Health Assistant")}
            </Link>
            <Link href="/integrations" className="button-secondary px-5 py-3 text-sm font-semibold text-center">
              {t(lang, "查看 Apple Health 同步", "Review Apple Health Sync")}
            </Link>
            <Link href="/family-members" className="button-secondary px-5 py-3 text-sm font-semibold text-center">
              {t(lang, "回到家庭成員", "Back to Family Members")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
