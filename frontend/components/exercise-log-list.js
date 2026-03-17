import { formatChineseDate, formatNumber, formatValueWithUnit } from "../lib/format";
import { t } from "../lib/i18n";

function isImportedLog(log) {
  return String(log?.notes || "").startsWith("由 ");
}

function ExerciseLogSection({ title, logs, emptyText, lang }) {
  if (!logs.length) {
    return (
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
      </div>
      <div className="grid gap-4">
        {logs.map((log) => (
          <div key={log.id} className="glass-panel rounded-[24px] p-5 shadow-glass">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t(lang, "運動", "Workout")}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                  {log.workoutType}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{formatChineseDate(log.performedAt, true, lang)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                  <p className="mt-1 font-semibold text-ink">{formatNumber(log.durationMinutes || 0, 1, lang)} {t(lang, "分鐘", "min")}</p>
                </div>
                <div className="rounded-2xl bg-white/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Calories</p>
                  <p className="mt-1 font-semibold text-ink">
                    {formatValueWithUnit(log.caloriesBurned || 0, "kcal", {
                      maximumFractionDigits: 1,
                      lang
                    })}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{log.notes || t(lang, "沒有備註", "No notes")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExerciseLogList({ logs, lang = "zh" }) {
  if (!logs.length) {
    return (
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-sm text-slate-500">{t(lang, "暫時沒有運動紀錄。", "No workout records yet.")}</p>
      </div>
    );
  }

  const manualLogs = logs.filter((log) => !isImportedLog(log));
  const importedLogs = logs.filter(isImportedLog);

  return (
    <div className="space-y-5">
      <ExerciseLogSection
        title="Manual Entries"
        logs={manualLogs}
        emptyText={t(lang, "暫時沒有手動輸入的運動紀錄。", "No manual workout records yet.")}
        lang={lang}
      />
      <ExerciseLogSection
        title="Apple Health Imports"
        logs={importedLogs}
        emptyText={t(lang, "暫時沒有 Apple Health 匯入的運動紀錄。", "No Apple Health workout imports yet.")}
        lang={lang}
      />
    </div>
  );
}
