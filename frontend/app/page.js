import Link from "next/link";
import { MetricHistoryChart } from "../components/metric-history-chart";
import { formatChineseDate } from "../lib/format";
import { getFamilyMember, getFamilyMembers, getGrowthTracking } from "../lib/api";

function formatMetric(metric, emptyLabel = "未有資料") {
  if (!metric || metric.value === null || metric.value === undefined) {
    return emptyLabel;
  }

  return `${metric.value} ${metric.unit || ""}`.trim();
}

function buildTrendInsight(items, label) {
  if (!items || items.length < 2) {
    return `${label}正在累積更多資料。`;
  }

  const firstValue = Number(items[0].value);
  const lastValue = Number(items[items.length - 1].value);
  const delta = Math.round((lastValue - firstValue) * 10) / 10;

  if (delta === 0) {
    return `${label}整體保持平穩。`;
  }

  return `${label}${delta > 0 ? "上升" : "下降"} ${Math.abs(delta)}。`;
}

export default async function HomePage() {
  let members = [];
  let alex = null;
  let amelie = null;
  let growth = null;

  try {
    [members, alex, amelie, growth] = await Promise.all([
      getFamilyMembers(),
      getFamilyMember("alex"),
      getFamilyMember("amelie"),
      getGrowthTracking("ryan")
    ]);
  } catch (_error) {
    members = [];
    alex = null;
    amelie = null;
    growth = null;
  }

  const alexWeightTrend = alex?.metricTrends?.weight || [];
  const amelieWeightTrend = amelie?.metricTrends?.weight || [];
  const alexSecondaryMetric =
    alex?.latestMetrics?.steps || alex?.latestMetrics?.resting_heart_rate || alex?.latestMetrics?.sleep;
  const amelieSecondaryMetric =
    amelie?.latestMetrics?.sleep || amelie?.latestMetrics?.steps || amelie?.latestMetrics?.resting_heart_rate;

  return (
    <section className="space-y-8">
      <div className="glass-panel overflow-hidden rounded-[40px] px-7 py-10 shadow-panel sm:px-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">家庭健康 Dashboard</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-ink">
              用摘要、趨勢和提醒去看健康，而不是被 raw data 淹沒。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              參考 Apple Health 常見的 Summary、Pinned、Highlights 和 Trends 思路，首頁現在只保留最值得注意的家庭健康訊號。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/family-members/alex"
                className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
              >
                查看 Alex 概覽
              </Link>
              <Link
                href="/family-members/ryan"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-glass"
              >
                查看 Ryan 成長追蹤
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">家庭成員</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{members.length}</p>
              <p className="mt-2 text-sm text-slate-500">每位成員用摘要卡而不是長列表查看健康狀態。</p>
            </div>
            <div className="rounded-[28px] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ryan 最新成長</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {growth?.summary?.latestMeasurement
                  ? `${growth.summary.latestMeasurement.heightCm} cm`
                  : "未有資料"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {growth?.summary?.latestMeasurement
                  ? `體重 ${growth.summary.latestMeasurement.weightKg} kg`
                  : "等待更多成長紀錄"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-[28px] p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Alex 最新體重</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{formatMetric(alex?.latestMetrics?.weight)}</p>
          <p className="mt-2 text-sm text-slate-500">{buildTrendInsight(alexWeightTrend, "體重")}</p>
        </div>
        <div className="glass-panel rounded-[28px] p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amelie 最新體重</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{formatMetric(amelie?.latestMetrics?.weight)}</p>
          <p className="mt-2 text-sm text-slate-500">{buildTrendInsight(amelieWeightTrend, "體重")}</p>
        </div>
        <div className="glass-panel rounded-[28px] p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Alex 今日重點</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatMetric(alexSecondaryMetric)}</p>
          <p className="mt-2 text-sm text-slate-500">常見用戶最關注步數、靜止心率和睡眠變化。</p>
        </div>
        <div className="glass-panel rounded-[28px] p-6 shadow-glass">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amelie 今日重點</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatMetric(amelieSecondaryMetric)}</p>
          <p className="mt-2 text-sm text-slate-500">以睡眠、步數或心率去看整體狀態會比 raw data 更直觀。</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MetricHistoryChart
          items={alexWeightTrend}
          color="#0071e3"
          label="Alex 體重趨勢"
          unit="kg"
        />
        <MetricHistoryChart
          items={amelieWeightTrend}
          color="#34a853"
          label="Amelie 體重趨勢"
          unit="kg"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-7 shadow-glass">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Highlights</p>
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
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{member.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{member.age} 歲</p>
                <p className="mt-1 text-sm text-slate-500">{formatChineseDate(member.dateOfBirth)}</p>
                <p className="mt-4 text-sm text-slate-700">
                  健康紀錄 {member.totalHealthRecordCount || 0} 筆
                </p>
                <p className="mt-1 text-sm text-slate-500">運動紀錄 {member.totalExerciseLogCount || 0} 筆</p>
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
                最新測量為 {growth.summary.latestMeasurement.heightCm} cm、
                {growth.summary.latestMeasurement.weightKg} kg。
              </p>
              <div className="mt-6 rounded-[24px] bg-white/80 p-5">
                <p className="text-sm font-semibold text-ink">{growth.insights[0]?.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{growth.insights[0]?.description}</p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">等待 Ryan 成長數據載入。</p>
          )}
        </div>
      </div>
    </section>
  );
}
