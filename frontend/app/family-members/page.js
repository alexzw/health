import { MemberCard } from "../../components/member-card";
import { getFamilyMembers } from "../../lib/api";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, normalizeLanguage, t } from "../../lib/i18n";

export const metadata = {
  title: "家庭成員 | 家庭健康追蹤"
};

export default async function FamilyMembersPage() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  let members = [];
  let errorMessage = "";

  try {
    members = await getFamilyMembers();
  } catch (error) {
        errorMessage = t(
          lang,
          "家庭資料服務暫時不可用，請先啟動後端 API。",
          "The family data service is temporarily unavailable. Please start the backend API first."
        );
  }

  return (
    <section className="space-y-8">
      <div className="panel-hero rounded-[40px] px-7 py-9 sm:px-10">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="section-kicker">{t(lang, "家庭成員", "Family Members")}</p>
            <h1 className="display-heading mt-3 text-5xl font-semibold text-ink sm:text-6xl">
              {t(lang, "全家人的健康檔案", "Profiles for the Whole Family")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {t(
                lang,
                "每張卡片會先顯示最重要的身體指標與最近同步狀態，再進一步進入完整檔案。",
                "Each card highlights the most important body metrics and sync status before you open the full profile."
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-band rounded-[26px] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "總成員數", "Total Members")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{members.length}</p>
              <p className="mt-2 text-sm text-slate-500">{t(lang, "家人概覽集中於同一頁。", "All family profiles in one place.")}</p>
            </div>
            <div className="metric-band rounded-[26px] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "快速操作", "Quick Actions")}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{t(lang, "可新增", "Ready")}</p>
              <p className="mt-2 text-sm text-slate-500">{t(lang, "由卡片直接進入查看或新增記錄。", "Jump from each card to review or add records.")}</p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="glass-panel rounded-[28px] border border-blue/20 p-5 text-sm text-slate-700 shadow-glass">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-kicker">{t(lang, "個人檔案卡片", "Profile Cards")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "選擇要管理的家庭成員", "Choose a Family Member")}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} lang={lang} />
        ))}
      </div>
    </section>
  );
}
