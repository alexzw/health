import { formatChineseDate, formatMetric, formatRelativeDate } from "../lib/format";
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
  const latestWeight = member.latestMetrics?.weight || null;
  const latestHeight = member.latestMetrics?.height || null;
  const primaryStat =
    member.familyRole === "Child"
      ? {
          label: t(lang, "最新身高", "Latest Height"),
          value: latestHeight
            ? formatMetric(latestHeight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })
            : t(lang, "未有資料", "No data yet")
        }
      : {
          label: t(lang, "最新體重", "Latest Weight"),
          value: latestWeight
            ? formatMetric(latestWeight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })
            : t(lang, "未有資料", "No data yet")
        };
  const secondaryStat =
    member.familyRole === "Child"
      ? {
          label: t(lang, "最新體重", "Latest Weight"),
          value: latestWeight
            ? formatMetric(latestWeight, { lang, emptyLabel: t(lang, "未有資料", "No data yet") })
            : t(lang, "未有資料", "No data yet")
        }
      : {
          label: "BMI",
          value: member.latestBmi || "—"
        };
  const recentUpdate = formatRelativeDate(
    latestWeight?.recordedAt || latestHeight?.recordedAt,
    lang
  );

  return (
    <div className="soft-card group rounded-[32px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br ${avatar.gradient} text-2xl font-semibold tracking-[-0.04em] text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)]`}
          >
            {avatar.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {member.familyRole === "Father"
                  ? t(lang, "爸爸", "Father")
                  : member.familyRole === "Mother"
                    ? t(lang, "媽媽", "Mother")
                    : t(lang, "孩子", "Child")}
              </p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {member.familyRole === "Father"
                  ? t(lang, "父親", "Father")
                  : member.familyRole === "Mother"
                    ? t(lang, "母親", "Mother")
                    : t(lang, "兒童成長", "Growth")}
              </span>
            </div>
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] bg-slate-50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{primaryStat.label}</p>
          <p className="mt-2 text-xl font-semibold text-ink">{primaryStat.value}</p>
        </div>
        <div className="rounded-[20px] bg-slate-50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{secondaryStat.label}</p>
          <p className="mt-2 text-xl font-semibold text-ink">{secondaryStat.value}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-white/75 px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {t(lang, "資料狀態", "Data Status")}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">{recentUpdate}</p>
        <p className="mt-1 text-sm text-slate-500">
          {t(lang, "已同步最近 30 天資料", "Synced data from the last 30 days")}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/family-members/${member.id}`}
          className="button-primary px-4 py-2.5 text-sm font-semibold"
        >
          {t(lang, "查看檔案", "View Profile")}
        </Link>
        <Link
          href={`/family-members/${member.id}#manage`}
          className="button-secondary px-4 py-2.5 text-sm font-semibold"
        >
          {t(lang, "新增記錄", "Add Record")}
        </Link>
      </div>
    </div>
  );
}
