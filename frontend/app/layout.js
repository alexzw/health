import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { LanguageSwitcher } from "../components/language-switcher";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../lib/i18n";

export const metadata = {
  title: "家庭健康追蹤",
  description: "Alex、Amelie 和 Ryan 的家庭健康追蹤網站"
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  return (
    <html lang={lang === "en" ? "en" : "zh-HK"}>
      <body className="font-sans text-ink">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="glass-panel flex flex-col gap-6 rounded-[30px] px-6 py-5 shadow-glass sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="text-3xl font-semibold tracking-[-0.04em]">
                {t(lang, "家庭健康追蹤", "Family Health Tracker")}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {t(
                  lang,
                  "Alex、Amelie 和 Ryan 的私人健康儀表板",
                  "A private family dashboard for Alex, Amelie, and Ryan"
                )}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              <LanguageSwitcher lang={lang} />
              <nav className="flex flex-wrap gap-5 text-sm font-medium text-slate-600">
                <Link href="/">{t(lang, "總覽", "Overview")}</Link>
                <Link href="/family-members">{t(lang, "家庭成員", "Family Members")}</Link>
                <Link href="/integrations">{t(lang, "整合功能", "Integrations")}</Link>
                <Link href="/ai-doctor">{t(lang, "AI 醫生", "AI Doctor")}</Link>
                <Link href="/reports">{t(lang, "每週報告", "Reports")}</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 py-8 lg:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
