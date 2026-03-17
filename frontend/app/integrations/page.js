import Link from "next/link";
import { cookies } from "next/headers";
import { getFamilyMember } from "../../lib/api";
import { formatMetric, formatRelativeDate } from "../../lib/format";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../../lib/i18n";

export const metadata = {
  title: "Integrations | Family Health Tracker"
};

function IntegrationCard({ member, lang }) {
  const latestSyncMetric =
    member.dashboard?.cards?.latestSleep ||
    member.dashboard?.cards?.latestSteps ||
    member.latestMetrics?.weight ||
    member.latestMetrics?.heart_rate;

  const summaries = [
    { label: t(lang, "步數", "Steps"), value: formatMetric(member.dashboard?.cards?.latestSteps, { lang, emptyLabel: "—" }) },
    { label: t(lang, "睡眠", "Sleep"), value: formatMetric(member.dashboard?.cards?.latestSleep, { lang, emptyLabel: "—" }) },
    { label: t(lang, "靜止心率", "Resting HR"), value: formatMetric(member.dashboard?.cards?.latestRestingHeartRate, { lang, emptyLabel: "—" }) },
    { label: t(lang, "運動", "Workouts"), value: `${member.totalExerciseLogCount || 0}` }
  ];

  return (
    <div className="soft-card rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Apple Health</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{member.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {t(lang, "最近同步：", "Last sync:")}
            {formatRelativeDate(latestSyncMetric?.recordedAt, lang)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {t(lang, "已啟用", "Active")}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {summaries.map((summary) => (
          <div key={summary.label} className="rounded-[20px] bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{summary.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">{summary.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-white/75 px-4 py-4">
        <p className="text-sm text-slate-600">
          {t(
            lang,
            "系統會從 iCloud Drive/Apple Health/{姓名} 讀取最新匯出，解析步數、睡眠、心率與運動，再轉成可用摘要。",
            "The system reads the latest export from iCloud Drive/Apple Health/{member}, parses steps, sleep, heart rate, and workouts, then turns them into useful summaries."
          ).replace("{姓名}", member.name).replace("{member}", member.name)}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/family-members/${member.id}#apple-health`} className="button-primary px-4 py-2.5 text-sm font-semibold">
          {t(lang, "打開同步工作台", "Open Sync Workspace")}
        </Link>
        <Link href={`/family-members/${member.id}?range=30d`} className="button-secondary px-4 py-2.5 text-sm font-semibold">
          {t(lang, "查看最近 30 天摘要", "View Last 30 Days")}
        </Link>
      </div>
    </div>
  );
}

export default async function IntegrationsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  const [alex, amelie] = await Promise.all([getFamilyMember("alex"), getFamilyMember("amelie")]);

  return (
    <section className="space-y-8">
      <div className="panel-hero rounded-[40px] p-8 lg:p-10">
        <p className="section-kicker">{t(lang, "整合功能", "Integrations")}</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">
          {t(lang, "Apple Health 同步中心", "Apple Health Sync Hub")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
          {t(
            lang,
            "這裡不是只顯示原始匯出，而是把 Apple Health 資料轉成步數、睡眠、心率與運動摘要，方便每天查看。",
            "This page turns Apple Health exports into practical summaries for steps, sleep, heart rate, and workouts instead of dumping raw data."
          )}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <IntegrationCard member={alex} lang={lang} />
        <IntegrationCard member={amelie} lang={lang} />
      </div>
    </section>
  );
}
