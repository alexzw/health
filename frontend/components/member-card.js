import { formatChineseDate } from "../lib/format";
import Link from "next/link";

export function MemberCard({ member }) {
  return (
    <Link
      href={`/family-members/${member.id}`}
      className="glass-panel group rounded-[30px] p-6 shadow-glass transition duration-300 hover:-translate-y-1 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {member.familyRole === "Father"
              ? "爸爸"
              : member.familyRole === "Mother"
                ? "媽媽"
                : "孩子"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {member.name}
          </h2>
        </div>
        <span className="rounded-full bg-blueSoft px-3 py-1 text-sm font-medium text-blue">
          {member.age} 歲
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        {member.gender === "Male" ? "男" : member.gender === "Female" ? "女" : member.gender}
      </p>
      <p className="mt-2 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth)}</p>
      <p className="mt-6 text-sm text-slate-700">健康紀錄共 {member.totalHealthRecordCount || 0} 筆</p>
      <p className="mt-2 text-sm text-slate-500">運動紀錄共 {member.totalExerciseLogCount || 0} 筆</p>
      {member.latestBmi ? <p className="mt-2 text-sm text-slate-500">BMI {member.latestBmi}</p> : null}
      <div className="mt-8 text-sm font-semibold text-blue transition group-hover:translate-x-1">
        查看檔案 →
      </div>
    </Link>
  );
}
