import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "家庭健康追蹤",
  description: "Alex、Amelie 和 Ryan 的家庭健康追蹤網站"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-HK">
      <body className="font-sans text-ink">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="glass-panel flex flex-col gap-6 rounded-[30px] px-6 py-5 shadow-glass sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="text-3xl font-semibold tracking-[-0.04em]">
                家庭健康追蹤
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                Alex、Amelie 和 Ryan 的私人健康儀表板
              </p>
            </div>
            <nav className="flex gap-5 text-sm font-medium text-slate-600">
              <Link href="/">總覽</Link>
              <Link href="/family-members">家庭成員</Link>
            </nav>
          </header>
          <main className="flex-1 py-8 lg:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
