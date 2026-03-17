"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGrowthMeasurement, updateGrowthMeasurement } from "../lib/api";
import { formatChineseDate } from "../lib/format";
import { t } from "../lib/i18n";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

function toDateTimeLocalValue(dateString) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

export function RecentGrowthRecords({ memberId, measurements, lang = "zh" }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      (measurements || []).map((item) => [
        item.id,
        {
          heightCm: String(item.heightCm ?? ""),
          weightKg: String(item.weightKg ?? ""),
          measuredAt: toDateTimeLocalValue(item.measuredAt)
        }
      ])
    )
  );

  function updateDraft(id, updates) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...updates
      }
    }));
  }

  async function handleSave(id) {
    const draft = drafts[id];
    setSavingId(id);
    setMessage("");
    setError("");

    try {
      await updateGrowthMeasurement(memberId, id, {
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        measuredAt: new Date(draft.measuredAt).toISOString()
      });
      setMessage(t(lang, "成長記錄已更新", "Growth record updated"));
      setEditingId("");
      router.refresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingId("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t(lang, "確定刪除這筆成長記錄？", "Delete this growth record?"))) {
      return;
    }

    setSavingId(id);
    setMessage("");
    setError("");

    try {
      await deleteGrowthMeasurement(memberId, id);
      setMessage(t(lang, "成長記錄已刪除", "Growth record deleted"));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSavingId("");
    }
  }

  if (!measurements?.length) {
    return null;
  }

  return (
    <div className="soft-card rounded-[28px] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">{t(lang, "最近成長記錄", "Recent Growth Records")}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "直接修改身高與體重", "Edit height and weight directly")}
          </h3>
        </div>
        <p className="text-sm text-slate-500">
          {t(lang, "每筆都可以即場編輯或刪除。", "Each record can be edited or deleted right here.")}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {measurements
          .slice()
          .sort((left, right) => new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime())
          .map((measurement) => {
            const isEditing = editingId === measurement.id;
            const draft = drafts[measurement.id];

            return (
              <div key={measurement.id} className="metric-band rounded-[22px] px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-ink">
                      {measurement.heightCm} cm / {measurement.weightKg} kg
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatChineseDate(measurement.measuredAt, false, lang)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button-secondary px-4 py-2 text-sm font-semibold"
                      onClick={() => setEditingId(isEditing ? "" : measurement.id)}
                    >
                      {isEditing ? t(lang, "收起", "Close") : t(lang, "修改", "Edit")}
                    </button>
                    <button
                      type="button"
                      disabled={savingId === measurement.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                      onClick={() => handleDelete(measurement.id)}
                    >
                      {t(lang, "刪除", "Delete")}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="text-sm font-medium text-slate-600">
                      {t(lang, "身高（cm）", "Height (cm)")}
                      <input
                        className={inputClass}
                        value={draft.heightCm}
                        onChange={(event) => updateDraft(measurement.id, { heightCm: event.target.value })}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-600">
                      {t(lang, "體重（kg）", "Weight (kg)")}
                      <input
                        className={inputClass}
                        value={draft.weightKg}
                        onChange={(event) => updateDraft(measurement.id, { weightKg: event.target.value })}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-600">
                      {t(lang, "測量時間", "Measured At")}
                      <input
                        type="datetime-local"
                        className={inputClass}
                        value={draft.measuredAt}
                        onChange={(event) => updateDraft(measurement.id, { measuredAt: event.target.value })}
                      />
                    </label>
                    <div className="md:col-span-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingId === measurement.id}
                        className="button-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                        onClick={() => handleSave(measurement.id)}
                      >
                        {savingId === measurement.id ? t(lang, "保存中...", "Saving...") : t(lang, "保存修改", "Save Changes")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
