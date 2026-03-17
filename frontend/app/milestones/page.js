import Link from "next/link";
import { cookies } from "next/headers";
import { getFamilyMember, getGrowthTracking } from "../../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../../lib/i18n";
import { buildMilestones } from "../../lib/daily-engagement";

export const metadata = {
  title: "Milestones | Family Health Tracker"
};

export default async function MilestonesPage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  const [alex, amelie, growth] = await Promise.all([
    getFamilyMember("alex"),
    getFamilyMember("amelie"),
    getGrowthTracking("ryan")
  ]);

  const milestones = buildMilestones({ alex, amelie, growth }, lang);

  return (
    <section className="space-y-8">
      <div className="panel-hero rounded-[40px] p-8 lg:p-10">
        <p className="section-kicker">{t(lang, "里程碑", "Milestones")}</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">
          {t(lang, "Family Milestone Timeline", "Family Milestone Timeline")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
          {t(
            lang,
            "把值得記住的成長、減重、運動一致性收在同一條 timeline，令健康進展有情感價值。",
            "Collect meaningful growth, weight, and consistency wins in one timeline so progress feels memorable."
          )}
        </p>
      </div>

      <div className="grid gap-6">
        {milestones.length ? (
          milestones.map((milestone, index) => (
            <div key={milestone.title} className="soft-card rounded-[30px] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t(lang, "Milestone", "Milestone")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{milestone.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{milestone.detail}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="soft-card rounded-[30px] p-6 text-sm text-slate-600">
            {t(lang, "當家庭累積更多進步，這裡會開始出現 milestone timeline。", "As your family builds more progress, a milestone timeline will start appearing here.")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className="button-primary px-5 py-3 text-sm font-semibold">
          {t(lang, "返回首頁", "Back to Home")}
        </Link>
        <Link href="/reports" className="button-secondary px-5 py-3 text-sm font-semibold">
          {t(lang, "查看每週報告", "View Weekly Report")}
        </Link>
      </div>
    </section>
  );
}
