"use client";

import Link from "next/link";

export default function Error({ reset }) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-panel">
      <p className="text-sm uppercase tracking-[0.2em] text-blue">資料載入失敗</p>
      <h1 className="mt-3 text-4xl font-semibold text-ink">這個成員頁面暫時無法載入。</h1>
      <p className="mt-4 max-w-xl text-sm text-slate-700">
        可能是後端 API 沒有啟動，或請求暫時失敗。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
        >
          重新載入
        </button>
        <Link
          href="/family-members"
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          返回列表
        </Link>
      </div>
    </section>
  );
}
