import { formatChineseDate } from "../lib/format";
import Link from "next/link";
import { t } from "../lib/i18n";

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

export function MemberCard({ member, lang = "zh" }) {
  const avatar = getAvatarConfig(member);

  return (
    <Link
      href={`/family-members/${member.id}`}
      className="soft-card group rounded-[32px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-panel"
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
                ? t(lang, "爸爸", "Father")
                : member.familyRole === "Mother"
                  ? t(lang, "媽媽", "Mother")
                  : t(lang, "孩子", "Child")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
              {member.name}
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-blueSoft px-3 py-1 text-sm font-medium text-blue shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          {member.age} {t(lang, "歲", "yrs")}
        </span>
      </div>
      <div className="metric-band mt-5 rounded-[24px] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t(lang, "個人資料", "Profile")}</p>
        <p className="mt-3 text-sm text-slate-500">
          {member.gender === "Male" ? t(lang, "男", "Male") : member.gender === "Female" ? t(lang, "女", "Female") : member.gender}
        </p>
        <p className="mt-2 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth, false, lang)}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] bg-slate-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{t(lang, "健康紀錄", "Health Records")}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{member.totalHealthRecordCount || 0}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{t(lang, "運動紀錄", "Workout Records")}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{member.totalExerciseLogCount || 0}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">BMI</p>
          <p className="mt-1 text-lg font-semibold text-ink">{member.latestBmi || "—"}</p>
        </div>
      </div>
      <div className="mt-8 text-sm font-semibold text-blue transition group-hover:translate-x-1">
        {t(lang, "查看檔案", "View Profile")} →
      </div>
    </Link>
  );
}
