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
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{t(lang, "家庭成員", "Family Members")}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-ink">
          {t(lang, "全家人的健康檔案", "Profiles for the Whole Family")}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {t(
            lang,
            "每位家庭成員都有自己的資料頁，除了查看健康紀錄，也可以直接新增和修改資料。",
            "Each family member has a dedicated profile where you can review, add, and update health data."
          )}
        </p>
      </div>

      {errorMessage ? (
        <div className="glass-panel rounded-[28px] border border-blue/20 p-5 text-sm text-slate-700 shadow-glass">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} lang={lang} />
        ))}
      </div>
    </section>
  );
}
