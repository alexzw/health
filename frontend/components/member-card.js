import { formatChineseDate } from "../lib/format";
import Link from "next/link";

function getAvatarConfig(member) {
  const configs = {
    alex: {
      initials: "A",
      gradient: "from-sky-400 via-blue-500 to-cyan-300"
    },
    amelie: {
      initials: "A",
      gradient: "from-rose-300 via-pink-400 to-orange-200"
    },
    ryan: {
      initials: "R",
      gradient: "from-emerald-300 via-teal-400 to-lime-200"
    }
  };

  return (
    configs[member.id] || {
      initials: member.name?.charAt(0)?.toUpperCase() || "?",
      gradient: "from-slate-300 via-slate-400 to-slate-200"
    }
  );
}

export function MemberCard({ member }) {
  const avatar = getAvatarConfig(member);

  return (
    <Link
      href={`/family-members/${member.id}`}
      className="glass-panel group rounded-[30px] p-6 shadow-glass transition duration-300 hover:-translate-y-1 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br ${avatar.gradient} text-2xl font-semibold tracking-[-0.04em] text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)]`}
          >
            {avatar.initials}
          </div>
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
        </div>
        <span className="rounded-full bg-blueSoft px-3 py-1 text-sm font-medium text-blue">
          {member.age} 歲
        </span>
      </div>
      <div className="mt-5 rounded-[24px] bg-white/70 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Profile
          </p>
        <p className="mt-3 text-sm text-slate-500">
          {member.gender === "Male" ? "男" : member.gender === "Female" ? "女" : member.gender}
        </p>
        <p className="mt-2 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth)}</p>
      </div>
      <p className="mt-6 text-sm text-slate-700">健康紀錄共 {member.totalHealthRecordCount || 0} 筆</p>
      <p className="mt-2 text-sm text-slate-500">運動紀錄共 {member.totalExerciseLogCount || 0} 筆</p>
      {member.latestBmi ? <p className="mt-2 text-sm text-slate-500">BMI {member.latestBmi}</p> : null}
      <div className="mt-8 text-sm font-semibold text-blue transition group-hover:translate-x-1">
        查看檔案 →
      </div>
    </Link>
  );
}
