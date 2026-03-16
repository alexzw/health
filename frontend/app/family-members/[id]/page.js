import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseLogList } from "../../../components/exercise-log-list";
import { GrowthChart } from "../../../components/growth-chart";
import { GrowthInsights } from "../../../components/growth-insights";
import { HealthRecordTable } from "../../../components/health-record-table";
import { MetricHistoryChart } from "../../../components/metric-history-chart";
import { ProfileManagementPanel } from "../../../components/profile-management-panel";
import { getFamilyMember, getGrowthTracking } from "../../../lib/api";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  try {
    const member = await getFamilyMember(resolvedParams.id);
    return {
      title: `${member.name} | 家庭健康追蹤`
    };
  } catch (_error) {
    return {
      title: "家庭成員 | 家庭健康追蹤"
    };
  }
}

export default async function FamilyMemberDetailPage({ params }) {
  const resolvedParams = await params;
  let member;
  let growth = null;
  let weightHistory = [];

  try {
    member = await getFamilyMember(resolvedParams.id);
    weightHistory = (member.healthDataRecords || [])
      .filter((record) => record.category === "weight" && record.value !== null)
      .map((record) => ({ value: Number(record.value), date: record.recordedAt }))
      .sort((left, right) => new Date(left.date) - new Date(right.date));

    if (resolvedParams.id === "ryan") {
      growth = await getGrowthTracking(resolvedParams.id);
    }
  } catch (error) {
    if (String(error.message).includes("404")) {
      notFound();
    }

    throw error;
  }

  return (
    <section className="space-y-8">
      <Link href="/family-members" className="inline-flex text-sm font-semibold text-blue">
        ← 返回家庭成員列表
      </Link>

      <div className="glass-panel rounded-[36px] p-8 shadow-panel">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {member.familyRole === "Father"
                ? "爸爸"
                : member.familyRole === "Mother"
                  ? "媽媽"
                  : "孩子"}
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-ink">
              {member.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">年齡</span>
              <span className="mt-1 block font-semibold">{member.age} 歲</span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">性別</span>
              <span className="mt-1 block font-semibold">
                {member.gender === "Male" ? "男" : member.gender === "Female" ? "女" : member.gender}
              </span>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">
              <span className="block text-xs uppercase tracking-[0.15em] text-slate-500">
                生日
              </span>
              <span className="mt-1 block font-semibold">{member.dateOfBirthDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {growth ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">功能 2</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              Ryan 成長追蹤
            </h2>
          </div>
          <GrowthInsights growth={growth} />
          <div className="grid gap-5 lg:grid-cols-2">
            <GrowthChart
              measurements={growth.measurements}
              metric="heightCm"
              color="#0071e3"
              label="身高趨勢"
              unit="cm"
            />
            <GrowthChart
              measurements={growth.measurements}
              metric="weightKg"
              color="#34a853"
              label="體重趨勢"
              unit="kg"
            />
          </div>
        </div>
      ) : null}

      {member.familyRole !== "Child" ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">成人健康追蹤</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              體重與運動紀錄
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <MetricHistoryChart
              items={weightHistory}
              color="#0071e3"
              label="體重趨勢"
              unit="kg"
            />
            <ExerciseLogList logs={member.exerciseLogs || []} />
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">近期紀錄</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            健康資料歷史
          </h2>
        </div>
        <HealthRecordTable records={member.healthDataRecords} />
      </div>

      <ProfileManagementPanel member={member} growth={growth} />
    </section>
  );
}
