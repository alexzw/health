import Link from "next/link";
import { formatChineseDate } from "../lib/format";
import { getFamilyMembers, getGrowthTracking } from "../lib/api";

export default async function HomePage() {
  let members = [];
  let growth = null;

  try {
    [members, growth] = await Promise.all([
      getFamilyMembers(),
      getGrowthTracking("ryan")
    ]);
  } catch (_error) {
    members = [];
    growth = null;
  }

  return (
    <section className="space-y-8">
      <div className="glass-panel overflow-hidden rounded-[40px] px-7 py-10 shadow-panel sm:px-10 lg:px-12">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">家庭健康追蹤</p>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
          家庭成員檔案、Ryan 成長曲線、手動新增與修改資料的功能都已經接上，下一步就可以把 Apple Health 的真實資料匯入進來。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/family-members"
            className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
          >
            進入家庭成員頁
          </Link>
          <Link
            href="/family-members/ryan"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-glass"
          >
            查看 Ryan 成長追蹤
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[32px] p-7 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">家庭概覽</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[24px] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {member.familyRole === "Father"
                    ? "爸爸"
                    : member.familyRole === "Mother"
                      ? "媽媽"
                      : "孩子"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{member.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{member.age} 歲</p>
                <p className="mt-1 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth)}</p>
                {member.latestBmi ? <p className="mt-1 text-sm text-slate-500">BMI {member.latestBmi}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-7 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ryan 成長摘要</p>
          {growth?.summary ? (
            <>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                相比第一筆紀錄，已長高 +{growth.summary.totalHeightGainCm} cm
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                最新測量為 {growth.summary.latestMeasurement.heightCm} cm 和{" "}
                {growth.summary.latestMeasurement.weightKg} kg。
              </p>
              <p className="mt-6 text-sm font-medium text-success">
                {growth.insights[0]?.title}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              啟動後端服務後，這裡會顯示最新成長資料。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
