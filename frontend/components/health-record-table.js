import { formatCategoryLabel, formatChineseDate, formatValueWithUnit } from "../lib/format";
import { t } from "../lib/i18n";

function formatValue(record, lang) {
  if (record.value === null || record.value === undefined) {
    return t(lang, "未填寫", "Not set");
  }

  return formatValueWithUnit(record.value, record.unit, {
    emptyLabel: t(lang, "未填寫", "Not set"),
    lang
  });
}

export function HealthRecordTable({ records, lang = "zh" }) {
  if (!records.length) {
    return (
      <div className="glass-panel rounded-[28px] border border-dashed border-line p-6 text-sm text-slate-500">
        {t(lang, "這個家庭成員暫時還沒有健康紀錄。", "This family member has no health records yet.")}
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[28px] shadow-glass">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/60 text-ink">
          <tr>
            <th className="px-5 py-4 font-semibold">{t(lang, "類型", "Type")}</th>
            <th className="px-5 py-4 font-semibold">{t(lang, "數值", "Value")}</th>
            <th className="px-5 py-4 font-semibold">{t(lang, "記錄時間", "Recorded At")}</th>
            <th className="px-5 py-4 font-semibold">{t(lang, "備註", "Notes")}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-slate-100/90">
              <td className="px-5 py-4">{formatCategoryLabel(record.category, lang)}</td>
              <td className="px-5 py-4">{formatValue(record, lang)}</td>
              <td className="px-5 py-4">{formatChineseDate(record.recordedAt, false, lang)}</td>
              <td className="px-5 py-4 text-slate-600">{record.notes || t(lang, "無", "None")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
