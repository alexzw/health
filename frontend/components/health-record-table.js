import { formatCategoryLabel, formatChineseDate } from "../lib/format";

function formatValue(record) {
  if (record.value === null || record.value === undefined) {
    return "未填寫";
  }

  return `${record.value} ${record.unit || ""}`.trim();
}

export function HealthRecordTable({ records }) {
  if (!records.length) {
    return (
      <div className="glass-panel rounded-[28px] border border-dashed border-line p-6 text-sm text-slate-500">
        這個家庭成員暫時還沒有健康紀錄。
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[28px] shadow-glass">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/60 text-ink">
          <tr>
            <th className="px-5 py-4 font-semibold">類型</th>
            <th className="px-5 py-4 font-semibold">數值</th>
            <th className="px-5 py-4 font-semibold">記錄時間</th>
            <th className="px-5 py-4 font-semibold">備註</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-slate-100/90">
              <td className="px-5 py-4">{formatCategoryLabel(record.category)}</td>
              <td className="px-5 py-4">{formatValue(record)}</td>
              <td className="px-5 py-4">{formatChineseDate(record.recordedAt)}</td>
              <td className="px-5 py-4 text-slate-600">{record.notes || "無"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
