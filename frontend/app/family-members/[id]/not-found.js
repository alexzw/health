import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-panel">
      <p className="text-sm uppercase tracking-[0.2em] text-blue">找不到資料</p>
      <h1 className="mt-3 text-4xl font-semibold text-ink">找不到這位家庭成員。</h1>
      <p className="mt-4 max-w-xl text-sm text-slate-700">
        目前資料集中沒有這個檔案。
      </p>
      <Link
        href="/family-members"
        className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
      >
        返回家庭成員列表
      </Link>
    </section>
  );
}
