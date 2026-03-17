import Link from "next/link";
import { cookies } from "next/headers";
import { getFamilyMember, getGrowthTracking } from "../../lib/api";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../../lib/i18n";
import { buildMilestones } from "../../lib/daily-engagement";
import { MilestoneTimeline } from "../../components/milestone-timeline";

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

      <MilestoneTimeline milestones={milestones} lang={lang} />

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
