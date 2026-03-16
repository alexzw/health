import { formatChineseDate } from "../lib/format";

export function ExerciseLogList({ logs }) {
  if (!logs.length) {
    return (
      <div className="glass-panel rounded-[28px] p-6 shadow-glass">
        <p className="text-sm text-slate-500">暫時沒有運動紀錄。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {logs.map((log) => (
        <div key={log.id} className="glass-panel rounded-[24px] p-5 shadow-glass">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">運動紀錄</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                {log.workoutType}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{formatChineseDate(log.performedAt, true)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">時長</p>
                <p className="mt-1 font-semibold text-ink">{log.durationMinutes || 0} 分鐘</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">卡路里</p>
                <p className="mt-1 font-semibold text-ink">{log.caloriesBurned || 0} kcal</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{log.notes || "沒有備註"}</p>
        </div>
      ))}
    </div>
  );
}
