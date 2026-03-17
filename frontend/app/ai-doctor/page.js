import { cookies } from "next/headers";
import { AiDoctorWorkspace } from "../../components/ai-doctor-workspace";
import { calculateBmi } from "../../lib/bmi";
import { getCoachInsights, getFamilyMember, getGrowthTracking } from "../../lib/api";
import { formatMetric } from "../../lib/format";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../../lib/i18n";

export const metadata = {
  title: "AI Doctor | Family Health Tracker"
};

export default async function AiDoctorPage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  const [alex, amelie, ryanCoach, alexCoach, amelieCoach, growth] = await Promise.all([
    getFamilyMember("alex"),
    getFamilyMember("amelie"),
    getCoachInsights("ryan", lang),
    getCoachInsights("alex", lang),
    getCoachInsights("amelie", lang),
    getGrowthTracking("ryan")
  ]);

  const latestGrowth = growth?.summary?.latestMeasurement || null;
  const ryanBmi = calculateBmi(latestGrowth?.weightKg, latestGrowth?.heightCm);

  const members = [
    {
      id: "alex",
      name: "Alex",
      role: t(lang, "減重目標", "Weight-loss goal"),
      summary: t(
        lang,
        `最新體重 ${formatMetric(alex.latestMetrics?.weight, { lang, emptyLabel: "未填寫" })}，${alexCoach.weeklyFocus}`,
        `Latest weight ${formatMetric(alex.latestMetrics?.weight, { lang, emptyLabel: "Not set" })}. ${alexCoach.weeklyFocus}`
      ),
      quickQuestions: [
        t(lang, "Alex 最近減重趨勢如何？", "How is Alex's recent weight trend?"),
        t(lang, "Alex 現在最需要改善的是什麼？", "What should Alex improve most right now?"),
        t(lang, "Alex 的睡眠和活動是否支持減重？", "Do Alex's sleep and activity levels support weight loss?")
      ]
    },
    {
      id: "amelie",
      name: "Amelie",
      role: t(lang, "塑形與健身", "Shaping and fitness"),
      summary: t(
        lang,
        `最新體重 ${formatMetric(amelie.latestMetrics?.weight, { lang, emptyLabel: "未填寫" })}，${amelieCoach.weeklyFocus}`,
        `Latest weight ${formatMetric(amelie.latestMetrics?.weight, { lang, emptyLabel: "Not set" })}. ${amelieCoach.weeklyFocus}`
      ),
      quickQuestions: [
        t(lang, "Amelie 的健身狀態如何？", "How is Amelie's fitness trend?"),
        t(lang, "Amelie 應該先提升什麼習慣？", "Which habit should Amelie improve first?"),
        t(lang, "Amelie 的運動頻率足夠嗎？", "Is Amelie's workout frequency enough?")
      ]
    },
    {
      id: "ryan",
      name: "Ryan",
      role: t(lang, "兒童成長", "Child growth"),
      summary: t(
        lang,
        `最新身高 ${latestGrowth?.heightCm || "—"} cm、體重 ${latestGrowth?.weightKg || "—"} kg、BMI ${ryanBmi || "—"}。${ryanCoach.weeklyFocus}`,
        `Latest height ${latestGrowth?.heightCm || "—"} cm, weight ${latestGrowth?.weightKg || "—"} kg, BMI ${ryanBmi || "—"}. ${ryanCoach.weeklyFocus}`
      ),
      quickQuestions: [
        t(lang, "Ryan 成長是否正常？", "Is Ryan growing normally?"),
        t(lang, "Ryan 最近身高變化如何？", "How is Ryan's recent height trend?"),
        t(lang, "Ryan 現在需要特別注意什麼？", "What should we watch for with Ryan right now?")
      ]
    }
  ];

  return <AiDoctorWorkspace members={members} lang={lang} />;
}
