"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createExerciseLog, createGrowthMeasurement, createHealthRecord } from "../lib/api";
import { formatValueWithUnit } from "../lib/format";
import { t } from "../lib/i18n";

const ACTIONS = ["alex_weight", "amelie_weight", "ryan_height", "ryan_weight", "exercise"];

const EXERCISE_TYPES = [
  "Gym Workout",
  "Running",
  "Cardio",
  "Strength Training",
  "Walking",
  "Cycling",
  "Yoga"
];

function actionLabel(action, lang) {
  const labels = {
    alex_weight: t(lang, "Alex 體重", "Alex Weight"),
    amelie_weight: t(lang, "Amelie 體重", "Amelie Weight"),
    ryan_height: t(lang, "Ryan 身高", "Ryan Height"),
    ryan_weight: t(lang, "Ryan 體重", "Ryan Weight"),
    exercise: t(lang, "運動記錄", "Exercise Log")
  };

  return labels[action];
}

function fieldMeta(action, lang) {
  if (action === "alex_weight" || action === "amelie_weight") {
    return {
      unit: "kg",
      label: t(lang, "體重", "Weight"),
      step: "0.1"
    };
  }

  if (action === "ryan_height") {
    return {
      unit: "cm",
      label: t(lang, "身高", "Height"),
      step: "0.1"
    };
  }

  return {
    unit: "kg",
    label: t(lang, "體重", "Weight"),
    step: "0.1"
  };
}

function pillClass(active) {
  return active
    ? "rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white"
    : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm";
}

export function QuickLogSheet({ latestValues, lang = "zh" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState("alex_weight");
  const [selectedExerciseMember, setSelectedExerciseMember] = useState("amelie");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [weightDrafts, setWeightDrafts] = useState({
    alex_weight: latestValues.alexWeight ? String(latestValues.alexWeight) : "",
    amelie_weight: latestValues.amelieWeight ? String(latestValues.amelieWeight) : "",
    ryan_height: latestValues.ryanHeight ? String(latestValues.ryanHeight) : "",
    ryan_weight: latestValues.ryanWeight ? String(latestValues.ryanWeight) : ""
  });
  const [exerciseDraft, setExerciseDraft] = useState({
    type: "Gym Workout",
    durationMinutes: "30",
    note: ""
  });

  const activeMeta = useMemo(() => fieldMeta(activeAction, lang), [activeAction, lang]);
  const canSaveRyanQuickLog =
    activeAction === "ryan_height"
      ? Boolean(weightDrafts.ryan_height && (latestValues.ryanWeight || weightDrafts.ryan_weight))
      : activeAction === "ryan_weight"
        ? Boolean(weightDrafts.ryan_weight && (latestValues.ryanHeight || weightDrafts.ryan_height))
        : true;

  function openSheet(action = "alex_weight") {
    setActiveAction(action);
    setFeedback("");
    setOpen(true);
  }

  async function handleQuickSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      if (activeAction === "alex_weight" || activeAction === "amelie_weight") {
        const memberId = activeAction === "alex_weight" ? "alex" : "amelie";
        await createHealthRecord(memberId, {
          category: "weight",
          value: Number(weightDrafts[activeAction]),
          unit: "kg",
          recordedAt: new Date().toISOString(),
          notes: "Quick Log"
        });
      } else if (activeAction === "ryan_height" || activeAction === "ryan_weight") {
        const nextHeight = activeAction === "ryan_height" ? Number(weightDrafts.ryan_height) : Number(latestValues.ryanHeight || weightDrafts.ryan_height);
        const nextWeight = activeAction === "ryan_weight" ? Number(weightDrafts.ryan_weight) : Number(latestValues.ryanWeight || weightDrafts.ryan_weight);

        await createGrowthMeasurement("ryan", {
          heightCm: nextHeight,
          weightKg: nextWeight,
          measuredAt: new Date().toISOString()
        });
      } else {
        await createExerciseLog(selectedExerciseMember, {
          workoutType: exerciseDraft.type,
          durationMinutes: Number(exerciseDraft.durationMinutes),
          notes: exerciseDraft.note ? `Quick Log: ${exerciseDraft.note}` : "Quick Log",
          performedAt: new Date().toISOString()
        });
      }

      setFeedback(t(lang, "已快速記錄", "Saved"));
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setFeedback("");
      }, 500);
    } catch (error) {
      setFeedback(error.message || t(lang, "暫時未能儲存", "Unable to save right now"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="button-primary px-5 py-3 text-sm font-semibold" onClick={() => openSheet()}>
          + {t(lang, "Quick Log", "Quick Log")}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:hidden">
        <button
          type="button"
          className="button-primary w-full px-5 py-4 text-base font-semibold shadow-[0_18px_40px_rgba(15,108,189,0.28)]"
          onClick={() => openSheet()}
        >
          + {t(lang, "Quick Log", "Quick Log")}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-[32px] border border-white/70 bg-[#f8fbff] p-5 shadow-2xl sm:bottom-8 sm:rounded-[32px]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200 sm:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">{t(lang, "快速記錄", "Quick Log")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                  {t(lang, "用最少步驟記錄今天的健康數據", "Capture today's health data in seconds")}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm"
                onClick={() => setOpen(false)}
              >
                {t(lang, "關閉", "Close")}
              </button>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {ACTIONS.map((action) => (
                <button key={action} type="button" className={pillClass(activeAction === action)} onClick={() => setActiveAction(action)}>
                  {actionLabel(action, lang)}
                </button>
              ))}
            </div>

            {activeAction !== "exercise" ? (
              <div className="mt-5 rounded-[24px] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">{activeMeta.label}</p>
                <input
                  inputMode="decimal"
                  step={activeMeta.step}
                  value={weightDrafts[activeAction]}
                  onChange={(event) =>
                    setWeightDrafts((current) => ({
                      ...current,
                      [activeAction]: event.target.value
                    }))
                  }
                  className="mt-3 w-full rounded-[22px] border border-slate-200 px-4 py-4 text-3xl font-semibold text-ink outline-none focus:border-blue"
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                  <span>
                    {t(lang, "上次記錄", "Last value")}:
                    {" "}
                    {formatValueWithUnit(
                      activeAction === "alex_weight"
                        ? latestValues.alexWeight
                        : activeAction === "amelie_weight"
                          ? latestValues.amelieWeight
                          : activeAction === "ryan_height"
                            ? latestValues.ryanHeight
                            : latestValues.ryanWeight,
                      activeMeta.unit,
                      { lang, emptyLabel: t(lang, "未有資料", "No data yet") }
                    )}
                  </span>
                  <span>{activeMeta.unit}</span>
                </div>
                {(activeAction === "ryan_height" || activeAction === "ryan_weight") &&
                !(latestValues.ryanHeight && latestValues.ryanWeight) ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {t(
                      lang,
                      "Ryan 第一次快速記錄需要先有最近一次身高和體重配對；如果未齊，可以去 Ryan 頁新增完整成長記錄。",
                      "Ryan quick logging needs a recent paired height and weight value. If one is missing, add a full growth record on Ryan's page first."
                    )}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] bg-white p-5 shadow-sm">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{t(lang, "成員", "Member")}</p>
                    <div className="mt-3 flex gap-2">
                      {["alex", "amelie"].map((memberId) => (
                        <button
                          key={memberId}
                          type="button"
                          className={pillClass(selectedExerciseMember === memberId)}
                          onClick={() => setSelectedExerciseMember(memberId)}
                        >
                          {memberId === "alex" ? "Alex" : "Amelie"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-500">{t(lang, "類型", "Type")}</span>
                    <select
                      className="mt-3 w-full rounded-[20px] border border-slate-200 px-4 py-4 text-base text-ink outline-none focus:border-blue"
                      value={exerciseDraft.type}
                      onChange={(event) => setExerciseDraft((current) => ({ ...current, type: event.target.value }))}
                    >
                      {EXERCISE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-500">{t(lang, "時長（分鐘）", "Duration (minutes)")}</span>
                    <input
                      inputMode="numeric"
                      value={exerciseDraft.durationMinutes}
                      onChange={(event) => setExerciseDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                      className="mt-3 w-full rounded-[20px] border border-slate-200 px-4 py-4 text-2xl font-semibold text-ink outline-none focus:border-blue"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-500">{t(lang, "備註（可選）", "Optional note")}</span>
                    <input
                      value={exerciseDraft.note}
                      onChange={(event) => setExerciseDraft((current) => ({ ...current, note: event.target.value }))}
                      className="mt-3 w-full rounded-[20px] border border-slate-200 px-4 py-4 text-base text-ink outline-none focus:border-blue"
                      placeholder={t(lang, "例如：腿部訓練", "e.g. lower-body session")}
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {feedback || t(lang, "記錄後畫面會即時更新。", "The page will refresh right after saving.")}
              </p>
              <button
                type="button"
                className="button-primary px-6 py-3 text-sm font-semibold disabled:opacity-60"
                disabled={
                  isSaving ||
                  (activeAction !== "exercise" && !weightDrafts[activeAction]) ||
                  !canSaveRyanQuickLog ||
                  (activeAction === "exercise" && (!exerciseDraft.type || !exerciseDraft.durationMinutes))
                }
                onClick={handleQuickSave}
              >
                {isSaving ? t(lang, "儲存中...", "Saving...") : t(lang, "快速儲存", "Quick Save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
