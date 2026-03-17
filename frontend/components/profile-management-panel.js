"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createExerciseLog,
  createGrowthMeasurement,
  createHealthRecord,
  deleteExerciseLog,
  deleteGrowthMeasurement,
  deleteHealthRecord,
  importAppleHealth,
  importLatestAppleHealth,
  previewAppleHealthImport,
  previewLatestAppleHealthImport,
  updateExerciseLog,
  updateFamilyMember,
  updateGrowthMeasurement,
  updateHealthRecord
} from "../lib/api";
import { formatCategoryLabel, formatChineseDate } from "../lib/format";
import { t } from "../lib/i18n";

const baseInputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

const deleteButtonClass =
  "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60";

function tabButtonClass(isActive) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? "bg-blue text-white" : "bg-white/70 text-slate-600"
  }`;
}

function toDateInputValue(dateString) {
  return dateString ? dateString.slice(0, 10) : "";
}

function toDateTimeLocalValue(dateString) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function FieldLabel({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

function SectionCard({ title, description, children, eyebrow, tone = "default" }) {
  const toneClass =
    tone === "accent"
      ? "border-blue/15 bg-[linear-gradient(180deg,rgba(245,250,255,0.95),rgba(255,255,255,0.9))]"
      : "border-white/70 bg-white/80";

  return (
    <div className={`glass-panel rounded-[28px] border p-6 shadow-glass ${toneClass}`}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p> : null}
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SubmitButton({ children, disabled, className = "", type = "submit" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function normalizeRecordCategory(category) {
  return (category || "").trim().toLowerCase();
}

const HEALTH_RECORD_PRESETS = [
  { value: "weight", label: "體重", unit: "kg" },
  { value: "height", label: "身高", unit: "cm" },
  { value: "waist", label: "腰圍", unit: "cm" },
  { value: "hip", label: "臀圍", unit: "cm" },
  { value: "chest", label: "胸圍", unit: "cm" },
  { value: "heart_rate", label: "心率", unit: "bpm" },
  { value: "resting_heart_rate", label: "靜止心率", unit: "bpm" },
  { value: "steps", label: "步數", unit: "steps" },
  { value: "sleep", label: "睡眠", unit: "hours" }
];

const WORKOUT_TYPE_PRESETS = [
  { value: "步行", label: "步行", met: 3.5 },
  { value: "快走", label: "快走", met: 4.3 },
  { value: "跑步", label: "跑步", met: 9.8 },
  { value: "健身", label: "健身", met: 5.5 },
  { value: "力量訓練", label: "力量訓練", met: 6 },
  { value: "HIIT", label: "HIIT", met: 8.5 },
  { value: "單車", label: "單車", met: 7.5 },
  { value: "游泳", label: "游泳", met: 8 },
  { value: "瑜伽", label: "瑜伽", met: 2.8 },
  { value: "普拉提", label: "普拉提", met: 3 },
  { value: "羽毛球", label: "羽毛球", met: 5.5 },
  { value: "籃球", label: "籃球", met: 6.5 },
  { value: "足球", label: "足球", met: 7 },
  { value: "行山", label: "行山", met: 6 },
  { value: "跳繩", label: "跳繩", met: 11 }
];

function translateHealthPresetLabel(lang, value) {
  const labels = {
    weight: t(lang, "體重", "Weight"),
    height: t(lang, "身高", "Height"),
    waist: t(lang, "腰圍", "Waist"),
    hip: t(lang, "臀圍", "Hip"),
    chest: t(lang, "胸圍", "Chest"),
    heart_rate: t(lang, "心率", "Heart Rate"),
    resting_heart_rate: t(lang, "靜止心率", "Resting Heart Rate"),
    steps: t(lang, "步數", "Steps"),
    sleep: t(lang, "睡眠", "Sleep")
  };

  return labels[value] || value;
}

function translateWorkoutType(lang, value) {
  const labels = {
    步行: t(lang, "步行", "Walking"),
    快走: t(lang, "快走", "Brisk Walk"),
    跑步: t(lang, "跑步", "Running"),
    健身: t(lang, "健身", "Gym Workout"),
    力量訓練: t(lang, "力量訓練", "Strength Training"),
    HIIT: "HIIT",
    單車: t(lang, "單車", "Cycling"),
    游泳: t(lang, "游泳", "Swimming"),
    瑜伽: t(lang, "瑜伽", "Yoga"),
    普拉提: t(lang, "普拉提", "Pilates"),
    羽毛球: t(lang, "羽毛球", "Badminton"),
    籃球: t(lang, "籃球", "Basketball"),
    足球: t(lang, "足球", "Football"),
    行山: t(lang, "行山", "Hiking"),
    跳繩: t(lang, "跳繩", "Jump Rope")
  };

  return labels[value] || value;
}

function estimateCaloriesBurned(workoutType, durationMinutes, weightKg) {
  if (!workoutType || !durationMinutes) {
    return "";
  }

  const preset = WORKOUT_TYPE_PRESETS.find((item) => item.value === workoutType);
  if (!preset) {
    return "";
  }

  const duration = Number(durationMinutes);
  const weight = Number(weightKg || 70);
  if (Number.isNaN(duration) || duration <= 0 || Number.isNaN(weight) || weight <= 0) {
    return "";
  }

  const calories = (preset.met * 3.5 * weight * duration) / 200;
  return String(Math.round(calories));
}

function isManualRecord(record) {
  return !String(record?.notes || "").startsWith("由 ");
}

function isManualExerciseLog(log) {
  return !String(log?.notes || "").startsWith("由 ");
}

function getHealthCategoryOrder(category) {
  const map = {
    weight: 0,
    waist: 1,
    hip: 2,
    chest: 3,
    heart_rate: 4,
    resting_heart_rate: 5,
    steps: 6,
    sleep: 7,
    height: 8
  };

  return map[normalizeRecordCategory(category)] ?? 99;
}

function HealthRecordGroupList({ memberId, items, onRunAction, isSaving, lang = "zh" }) {
  const groupedItems = useMemo(() => {
    const groups = new Map();

    for (const item of items) {
      const key = normalizeRecordCategory(item.category) || "other";
      const currentItems = groups.get(key) || [];
      currentItems.push(item);
      groups.set(key, currentItems);
    }

    return [...groups.entries()]
      .sort((left, right) => {
        const order = getHealthCategoryOrder(left[0]) - getHealthCategoryOrder(right[0]);
        if (order !== 0) {
          return order;
        }

        return formatCategoryLabel(left[0], lang).localeCompare(formatCategoryLabel(right[0], lang), "zh-HK");
      })
      .map(([key, groupItems]) => ({
        key,
        label: formatCategoryLabel(key, lang),
        items: [...groupItems].sort(
          (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime()
        )
      }));
  }, [items]);

  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          value: item.value === null ? "" : String(item.value),
          unit: item.unit || "",
          notes: item.notes || "",
          recordedAt: toDateTimeLocalValue(item.recordedAt)
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

  if (!items.length) {
    return (
      <SectionCard
        eyebrow={t(lang, "手動輸入", "Manual Entries")}
        title={t(lang, "快速修改健康紀錄", "Quick Edit Health Records")}
        description={t(lang, "依項目分開管理，會更快。", "Records are grouped by metric for faster editing.")}
      >
        <EmptyActionState
          lang={lang}
          title={t(lang, "還未有手動健康紀錄", "No manual health records yet")}
          description={t(
            lang,
            "先新增一筆體重、圍度或心率紀錄，之後就可以在這裡快速修改。",
            "Add a weight, body measurement, or heart-rate record first. You can edit it here afterwards."
          )}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow={t(lang, "手動輸入", "Manual Entries")}
      title={t(lang, "快速修改健康紀錄", "Quick Edit Health Records")}
      description={t(
        lang,
        "體重、心率、步數等已分開顯示，每條都可直接保存或一鍵刪除。",
        "Weight, heart rate, steps, and other metrics are grouped for direct editing and quick delete."
      )}
    >
      <div className="space-y-5">
        {groupedItems.map((group) => (
          <div key={group.key} className="rounded-[24px] border border-white/70 bg-white/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-ink">{group.label}</p>
                <p className="text-sm text-slate-500">
                  {t(lang, `${group.items.length} 條手動紀錄`, `${group.items.length} manual entries`)}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {group.items.map((item) => {
                const draft = drafts[item.id];

                return (
                  <form
                    key={item.id}
                    className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onRunAction(
                        () =>
                          updateHealthRecord(memberId, item.id, {
                            category: item.category,
                            value: draft.value,
                            unit: draft.unit,
                            notes: draft.notes,
                            recordedAt: new Date(draft.recordedAt).toISOString()
                          }),
                        `${group.label} 已更新`
                      );
                    }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {item.value} {item.unit || ""}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatChineseDate(item.recordedAt, true, lang)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <SubmitButton disabled={isSaving} className="px-4 py-2">
                          保存
                        </SubmitButton>
                        <button
                          type="button"
                          disabled={isSaving}
                          className={deleteButtonClass}
                          onClick={() => {
                            if (!window.confirm(`確定刪除這條${group.label}紀錄？`)) {
                              return;
                            }

                            onRunAction(
                              () => deleteHealthRecord(memberId, item.id),
                              `${group.label} 已刪除`
                            );
                          }}
                        >
                          一鍵刪除
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FieldLabel label="數值">
                        <input
                          className={baseInputClass}
                          value={draft?.value || ""}
                          onChange={(event) => updateDraft(item.id, { value: event.target.value })}
                        />
                      </FieldLabel>
                      <FieldLabel label="單位">
                        <input
                          className={baseInputClass}
                          value={draft?.unit || ""}
                          onChange={(event) => updateDraft(item.id, { unit: event.target.value })}
                        />
                      </FieldLabel>
                      <FieldLabel label="記錄時間">
                        <input
                          type="datetime-local"
                          className={baseInputClass}
                          value={draft?.recordedAt || ""}
                          onChange={(event) =>
                            updateDraft(item.id, { recordedAt: event.target.value })
                          }
                        />
                      </FieldLabel>
                      <div className="md:col-span-2">
                        <FieldLabel label="備註">
                          <textarea
                            className={`${baseInputClass} min-h-24 resize-y`}
                            value={draft?.notes || ""}
                            onChange={(event) => updateDraft(item.id, { notes: event.target.value })}
                          />
                        </FieldLabel>
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EditableList({
  title,
  description,
  items,
  getKey,
  getTitle,
  getSubtitle,
  initialValues,
  renderFields,
  onSave,
  onDelete,
  isSaving,
  emptyText,
  deleteLabel,
  itemIdPrefix
}) {
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(items.map((item) => [getKey(item), initialValues(item)]))
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

  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-4">
        {items.length ? null : <p className="text-sm text-slate-500">{emptyText}</p>}
        {items.map((item) => {
          const id = getKey(item);
          const draft = drafts[id];

          return (
            <form
              key={id}
              id={itemIdPrefix ? `${itemIdPrefix}-${id}` : undefined}
              className="rounded-[24px] border border-white/70 bg-white/70 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSave(item, draft);
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-semibold text-ink">{getTitle(item)}</p>
                  <p className="text-sm text-slate-500">{getSubtitle(item)}</p>
                </div>
                <div className="flex gap-2">
                  <SubmitButton disabled={isSaving} className="md:self-start px-4 py-2">
                    保存
                  </SubmitButton>
                  <button
                    type="button"
                    disabled={isSaving}
                    className={deleteButtonClass}
                    onClick={() => {
                      if (!window.confirm(`確定刪除這條${deleteLabel}？`)) {
                        return;
                      }

                      onDelete(item);
                    }}
                  >
                    一鍵刪除
                  </button>
                </div>
              </div>
              <div className="mt-4">{renderFields(draft, (updates) => updateDraft(id, updates))}</div>
            </form>
          );
        })}
      </div>
    </SectionCard>
  );
}

function AppleHealthPreview({ preview, lang = "zh" }) {
  if (!preview) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5">
      <p className="text-base font-semibold text-ink">{t(lang, "匯入預覽", "Import Preview")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t(lang, "會新增健康紀錄", "New health records")}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.newRecordCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t(lang, "會略過重複健康紀錄", "Duplicate health records skipped")}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.duplicateRecordCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t(lang, "會新增運動紀錄", "New workouts")}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.newWorkoutCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t(lang, "會略過重複運動紀錄", "Duplicate workouts skipped")}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.duplicateWorkoutCount}
          </p>
        </div>
      </div>
      {preview.source ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>{t(lang, "來源資料夾：", "Folder:")}{preview.source.folderPath}</p>
          <p className="mt-1">{t(lang, "最新 zip：", "Latest zip:")}{preview.source.zipPath}</p>
          <p className="mt-1">{t(lang, "匯入檔案：", "Export file:")}{preview.source.exportXmlPath}</p>
          {preview.source.sinceDate ? (
            <p className="mt-1">{t(lang, "同步範圍：", "Sync window:")}{formatChineseDate(preview.source.sinceDate, false, lang)} {t(lang, "之後", "onwards")}</p>
          ) : null}
        </div>
      ) : null}
      {preview.preview.sampleRecords?.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">{t(lang, "健康紀錄預覽", "Health Records Preview")}</p>
          <div className="mt-2 space-y-2">
            {preview.preview.sampleRecords.map((record, index) => (
              <div
                key={`${record.category}-${record.recordedAt}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {formatCategoryLabel(record.category, lang)}: {record.value} {record.unit || ""}，
                {formatChineseDate(record.recordedAt, true, lang)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {preview.preview.sampleWorkouts?.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">{t(lang, "運動紀錄預覽", "Workout Preview")}</p>
          <div className="mt-2 space-y-2">
            {preview.preview.sampleWorkouts.map((workout, index) => (
              <div
                key={`${workout.workoutType}-${workout.performedAt}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {workout.workoutType}，{workout.durationMinutes} {t(lang, "分鐘", "min")}，
                {formatChineseDate(workout.performedAt, true, lang)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function basename(filePath = "") {
  const segments = filePath.split("/");
  return segments[segments.length - 1] || filePath;
}

function ActionButton({ children, disabled, onClick, variant = "primary" }) {
  const className =
    variant === "secondary"
      ? "rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type="button" disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function ManagementIntro({ title, description, status, lang }) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.94))] p-6 shadow-glass">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {t(lang, "資料管理", "Data Management")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {status.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyActionState({ title, description, actionLabel, onAction, lang }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.96))] p-6 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      {onAction ? (
        <div className="mt-4">
          <ActionButton variant="secondary" onClick={onAction}>
            {actionLabel || t(lang, "立即開始", "Get started")}
          </ActionButton>
        </div>
      ) : null}
    </div>
  );
}

function AppleHealthWorkflowCard({ job, onRefreshPage, lang = "zh" }) {
  if (!job) {
    return null;
  }

  const steps =
    job.kind === "preview-latest"
      ? [
          t(lang, "尋找 iCloud Drive 最新 zip", "Find the latest iCloud Drive zip"),
          t(lang, "解壓 export.xml", "Extract export.xml"),
          t(lang, "分析最近 30 日資料", "Analyze the last 30 days of data")
        ]
      : job.kind === "import-latest"
        ? [
            t(lang, "尋找 iCloud Drive 最新 zip", "Find the latest iCloud Drive zip"),
            t(lang, "解壓 export.xml", "Extract export.xml"),
            t(lang, "寫入 PostgreSQL", "Write to PostgreSQL")
          ]
        : job.kind === "preview-file"
          ? [
              t(lang, "讀取你上傳的 export.xml", "Read the uploaded export.xml"),
              t(lang, "分析可匯入資料", "Analyze importable data"),
              t(lang, "產生預覽摘要", "Generate a preview summary")
            ]
          : [
              t(lang, "讀取你上傳的 export.xml", "Read the uploaded export.xml"),
              t(lang, "寫入 PostgreSQL", "Write to PostgreSQL"),
              t(lang, "整理匯入結果", "Prepare the import summary")
            ];

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              job.phase === "running"
                ? "animate-pulse bg-blue"
                : job.phase === "error"
                  ? "bg-rose-500"
                  : "bg-emerald-500"
            }`}
          />
          <p className="text-base font-semibold text-ink">{job.title}</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>
        <div className="mt-4 grid gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-2xl px-4 py-3 text-sm ${
                index === 0 && job.phase === "running"
                  ? "bg-blue/10 text-ink"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              {index + 1}. {step}
            </div>
          ))}
        </div>
        {job.phase === "running" ? (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-blue" />
          </div>
        ) : null}
        {job.phase === "error" ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {job.error}
          </div>
        ) : null}
      </div>

      {job.result ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-base font-semibold text-ink">
            {job.result.preview ? t(lang, "最近一次預覽結果", "Latest preview result") : t(lang, "最近一次匯入結果", "Latest import result")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">
                {job.result.preview ? t(lang, "會新增健康紀錄", "New health records") : t(lang, "新增健康紀錄", "Imported health records")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {job.result.preview
                  ? job.result.preview.newRecordCount
                  : job.result.importedRecordCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">
                {job.result.preview ? t(lang, "會略過重複健康紀錄", "Duplicate health records skipped") : t(lang, "略過重複健康紀錄", "Duplicate health records skipped")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {job.result.preview
                  ? job.result.preview.duplicateRecordCount
                  : job.result.skippedDuplicateRecordCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">
                {job.result.preview ? t(lang, "會新增運動紀錄", "New workouts") : t(lang, "新增運動紀錄", "Imported workouts")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {job.result.preview
                  ? job.result.preview.newWorkoutCount
                  : job.result.importedWorkoutCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">
                {job.result.preview ? t(lang, "會略過重複運動紀錄", "Duplicate workouts skipped") : t(lang, "略過重複運動紀錄", "Duplicate workouts skipped")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {job.result.preview
                  ? job.result.preview.duplicateWorkoutCount
                  : job.result.skippedDuplicateWorkoutCount}
              </p>
            </div>
          </div>
          {job.result.source ? (
            <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-slate-600">
              <p>{t(lang, "讀取資料夾：", "Folder:")}{job.result.source.folderPath}</p>
              <p className="mt-1">{t(lang, "zip 檔名：", "Zip file:")}{basename(job.result.source.zipPath)}</p>
              <p className="mt-1">{t(lang, "來源 zip：", "Source zip:")}{job.result.source.zipPath}</p>
              {job.result.source.sinceDate ? (
                <p className="mt-1">{t(lang, "同步範圍：", "Sync window:")}{formatChineseDate(job.result.source.sinceDate, false, lang)} {t(lang, "之後", "onwards")}</p>
              ) : null}
            </div>
          ) : null}
          {!job.result.preview ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton variant="secondary" onClick={onRefreshPage}>
                {t(lang, "重新讀取頁面資料", "Refresh page data")}
              </ActionButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileManagementPanel({ member, growth, lang = "zh" }) {
  const router = useRouter();
  const isAdult = member.familyRole !== "Child";
  const latestWeightValue =
    member.latestMetrics?.weight?.value ||
    member.healthDataRecords?.find((record) => normalizeRecordCategory(record.category) === "weight")
      ?.value ||
    "";
  const latestManualHeightRecord = (member.healthDataRecords || [])
    .filter(
      (record) => isManualRecord(record) && normalizeRecordCategory(record.category) === "height"
    )
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())[0];
  const manualHealthRecords = (member.healthDataRecords || []).filter(isManualRecord);
  const manualExerciseLogs = (member.exerciseLogs || []).filter(isManualExerciseLog);
  const tabs = useMemo(() => {
    const nextTabs = [
      { id: "profile", label: t(lang, "個人資料", "Profile") },
      { id: "record", label: t(lang, "健康紀錄", "Health Records") },
      {
        id: isAdult ? "exercise" : "growth",
        label: isAdult ? t(lang, "運動紀錄", "Workouts") : t(lang, "身高與體重", "Height & Weight")
      }
    ];

    if (isAdult) {
      nextTabs.push({ id: "apple-health", label: t(lang, "Apple Health 匯入", "Apple Health Import") });
    }

    return nextTabs;
  }, [isAdult, lang]);

  const defaultTab = isAdult ? "profile" : "growth";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [appleHealthFile, setAppleHealthFile] = useState(null);
  const [appleHealthPreview, setAppleHealthPreview] = useState(null);
  const [appleHealthJob, setAppleHealthJob] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: member.name,
    gender: member.gender,
    dateOfBirth: member.dateOfBirth
  });
  const [quickWeightForm, setQuickWeightForm] = useState({
    value: latestWeightValue ? String(latestWeightValue) : "",
    recordedAt: toDateTimeLocalValue(new Date().toISOString()),
    notes: ""
  });
  const [quickBodyMeasurementsForm, setQuickBodyMeasurementsForm] = useState({
    waist: member.latestMetrics?.waist?.value ? String(member.latestMetrics.waist.value) : "",
    hip: member.latestMetrics?.hip?.value ? String(member.latestMetrics.hip.value) : "",
    chest: member.latestMetrics?.chest?.value ? String(member.latestMetrics.chest.value) : "",
    recordedAt: toDateTimeLocalValue(new Date().toISOString()),
    notes: ""
  });
  const [quickHeightForm, setQuickHeightForm] = useState({
    value: latestManualHeightRecord?.value ? String(latestManualHeightRecord.value) : "",
    recordedAt: latestManualHeightRecord
      ? toDateTimeLocalValue(latestManualHeightRecord.recordedAt)
      : toDateTimeLocalValue(new Date().toISOString()),
    notes: latestManualHeightRecord?.notes || ""
  });

  const [newRecordForm, setNewRecordForm] = useState({
    category: "weight",
    value: "",
    unit: "kg",
    notes: "",
    recordedAt: toDateTimeLocalValue(new Date().toISOString())
  });

  const [newGrowthForm, setNewGrowthForm] = useState({
    heightCm: "",
    weightKg: "",
    measuredAt: toDateTimeLocalValue(new Date().toISOString())
  });

  const [newExerciseForm, setNewExerciseForm] = useState({
    workoutType: "",
    durationMinutes: "",
    caloriesBurned: "",
    notes: "",
    performedAt: toDateTimeLocalValue(new Date().toISOString())
  });

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");

    if (!hash) {
      setActiveTab(defaultTab);
      return;
    }

    const targetTab = tabs.find((tab) => hash.includes(tab.id))?.id;
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, [defaultTab, tabs]);

  async function runAction(action, successMessage) {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await action();
      setMessage(successMessage);
      router.refresh();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function resetExerciseForm() {
    setNewExerciseForm({
      workoutType: "",
      durationMinutes: "",
      caloriesBurned: "",
      notes: "",
      performedAt: toDateTimeLocalValue(new Date().toISOString())
    });
  }

  function resetRecordForm() {
    setNewRecordForm({
      category: "weight",
      value: "",
      unit: "kg",
      notes: "",
      recordedAt: toDateTimeLocalValue(new Date().toISOString())
    });
  }

  function startAppleHealthJob(kind, title, description) {
    setMessage("");
    setError("");
    setAppleHealthJob({
      kind,
      phase: "running",
      title,
      description,
      result: null,
      error: ""
    });
  }

  function finishAppleHealthJob(kind, title, description, result) {
    setAppleHealthJob({
      kind,
      phase: "done",
      title,
      description,
      result,
      error: ""
    });
  }

  function failAppleHealthJob(kind, title, description, errorMessage) {
    setAppleHealthJob({
      kind,
      phase: "error",
      title,
      description,
      result: null,
      error: errorMessage
    });
  }

  async function handleAppleHealthPreviewLatest() {
    setAppleHealthPreview(null);
    startAppleHealthJob(
      "preview-latest",
      `正在讀取 ${member.name} 的 iCloud Drive 匯出`,
      `系統正在 ${member.name} 專屬資料夾中尋找最新 zip、解壓 export.xml，並分析最近 30 日資料。`
    );

    try {
      const preview = await previewLatestAppleHealthImport(member.id);
      setAppleHealthPreview(preview);
      finishAppleHealthJob(
        "preview-latest",
        `${member.name} 的 iCloud Drive 預覽完成`,
        "已完成分析，你可以先看數量，再決定要不要正式匯入。",
        preview
      );
    } catch (jobError) {
      failAppleHealthJob(
        "preview-latest",
        `${member.name} 的 iCloud Drive 預覽失敗`,
        "系統未能完成該成員資料夾的最新 zip 預覽。",
        jobError.message
      );
    }
  }

  async function handleAppleHealthImportLatest() {
    setAppleHealthPreview(null);
    startAppleHealthJob(
      "import-latest",
      `正在匯入 ${member.name} 的最新 zip`,
      `系統正在 ${member.name} 專屬資料夾中尋找最新 zip、過濾重複資料，然後把最近 30 日資料寫入 PostgreSQL。`
    );

    try {
      const result = await importLatestAppleHealth(member.id);
      finishAppleHealthJob(
        "import-latest",
        `${member.name} 的自動匯入完成`,
        "Apple Health 最新 zip 已導入完成。確認結果後，再手動刷新頁面資料。",
        result
      );
    } catch (jobError) {
      failAppleHealthJob(
        "import-latest",
        `${member.name} 的自動匯入失敗`,
        "系統未能完成該成員資料夾的最新 zip 匯入。",
        jobError.message
      );
    }
  }

  async function handleAppleHealthPreviewFile() {
    if (!appleHealthFile) {
      failAppleHealthJob(
        "preview-file",
        "尚未選擇檔案",
        "請先選擇 export.xml，再開始預覽。",
        "請先選擇 Apple Health 匯出檔"
      );
      return;
    }

    setAppleHealthPreview(null);
    startAppleHealthJob(
      "preview-file",
      "正在分析上傳檔案",
      "系統正在讀取你上傳的 export.xml，並生成預覽摘要。"
    );

    try {
      const preview = await previewAppleHealthImport(member.id, appleHealthFile);
      setAppleHealthPreview(preview);
      finishAppleHealthJob(
        "preview-file",
        "手動檔案預覽完成",
        "已完成分析，你可以先看摘要，再決定是否正式匯入。",
        preview
      );
    } catch (jobError) {
      failAppleHealthJob(
        "preview-file",
        "手動檔案預覽失敗",
        "系統未能完成上傳檔案預覽。",
        jobError.message
      );
    }
  }

  async function handleAppleHealthImportFile() {
    if (!appleHealthFile) {
      failAppleHealthJob(
        "import-file",
        "尚未選擇檔案",
        "請先選擇 export.xml，再開始匯入。",
        "請先選擇 Apple Health 匯出檔"
      );
      return;
    }

    setAppleHealthPreview(null);
    startAppleHealthJob(
      "import-file",
      "正在匯入上傳檔案",
      "系統正在解析你上傳的 Apple Health 檔案，並寫入 PostgreSQL。"
    );

    try {
      const result = await importAppleHealth(member.id, appleHealthFile);
      finishAppleHealthJob(
        "import-file",
        "手動檔案匯入完成",
        "Apple Health 檔案已導入完成。確認結果後，再手動刷新頁面資料。",
        result
      );
    } catch (jobError) {
      failAppleHealthJob(
        "import-file",
        "手動檔案匯入失敗",
        "系統未能完成上傳檔案匯入。",
        jobError.message
      );
    }
  }

  function renderProfileTab() {
    return (
      <div className="space-y-5">
        <SectionCard
          eyebrow={t(lang, "基本資料", "Profile Basics")}
          title={t(lang, "編輯個人資料", "Edit Profile")}
          description={t(lang, "修改姓名、性別和生日。", "Update name, gender, and birthday.")}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(() => updateFamilyMember(member.id, profileForm), t(lang, "個人資料已更新", "Profile updated"));
            }}
          >
            <FieldLabel label={t(lang, "姓名", "Name")}>
              <input
                className={baseInputClass}
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label={t(lang, "性別", "Gender")}>
              <select
                className={baseInputClass}
                value={profileForm.gender}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, gender: event.target.value }))
                }
              >
                <option value="Male">{t(lang, "男", "Male")}</option>
                <option value="Female">{t(lang, "女", "Female")}</option>
              </select>
            </FieldLabel>
            <FieldLabel label={t(lang, "生日", "Birthday")}>
              <input
                type="date"
                className={baseInputClass}
                value={toDateInputValue(profileForm.dateOfBirth)}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, dateOfBirth: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving}>{t(lang, "保存", "Save")}</SubmitButton>
          </form>
        </SectionCard>

        {isAdult ? (
          <SectionCard
            eyebrow={t(lang, "身體數據", "Body Metrics")}
            title={t(lang, "身體資料", "Body Metrics")}
            description={t(lang, "身高較少變動，可以在這裡設定；體重則可快速補一筆最新紀錄。", "Set height here and quickly add the latest weight record.")}
            tone="accent"
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <form
                className="rounded-[24px] border border-white/70 bg-white/70 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    async () => {
                      const payload = {
                        category: "height",
                        value: quickHeightForm.value,
                        unit: "cm",
                        notes: quickHeightForm.notes,
                        recordedAt: new Date(quickHeightForm.recordedAt).toISOString()
                      };

                      if (latestManualHeightRecord?.id) {
                        await updateHealthRecord(member.id, latestManualHeightRecord.id, payload);
                      } else {
                        await createHealthRecord(member.id, payload);
                      }
                    },
                    t(lang, "身高設定已更新", "Height updated")
                  );
                }}
              >
                <p className="text-base font-semibold text-ink">{t(lang, "身高設定", "Height Setting")}</p>
                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>
                    {t(lang, "目前已保存身高：", "Saved height:")}
                    <span className="ml-2 font-semibold text-ink">
                      {latestManualHeightRecord?.value ? `${latestManualHeightRecord.value} cm` : t(lang, "未設定", "Not set")}
                    </span>
                  </p>
                  {latestManualHeightRecord?.recordedAt ? (
                    <p className="mt-1">{t(lang, "最後更新：", "Last updated:")}{formatChineseDate(latestManualHeightRecord.recordedAt, true, lang)}</p>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4">
                  <FieldLabel label={t(lang, "身高（cm）", "Height (cm)")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className={baseInputClass}
                      value={quickHeightForm.value}
                      onChange={(event) =>
                        setQuickHeightForm((current) => ({ ...current, value: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "記錄時間", "Recorded At")}>
                    <input
                      type="datetime-local"
                      className={baseInputClass}
                      value={quickHeightForm.recordedAt}
                      onChange={(event) =>
                        setQuickHeightForm((current) => ({
                          ...current,
                          recordedAt: event.target.value
                        }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "備註", "Notes")}>
                    <input
                      className={baseInputClass}
                      placeholder={t(lang, "例如：最新量度身高", "Example: latest height check")}
                      value={quickHeightForm.notes}
                      onChange={(event) =>
                        setQuickHeightForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <SubmitButton disabled={isSaving}>{t(lang, "保存身高設定", "Save height")}</SubmitButton>
                </div>
              </form>

              <form
                className="rounded-[24px] border border-white/70 bg-white/70 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    async () => {
                      await createHealthRecord(member.id, {
                        category: "weight",
                        value: quickWeightForm.value,
                        unit: "kg",
                        notes: quickWeightForm.notes,
                        recordedAt: new Date(quickWeightForm.recordedAt).toISOString()
                      });
                      setQuickWeightForm({
                        value: "",
                        recordedAt: toDateTimeLocalValue(new Date().toISOString()),
                        notes: ""
                      });
                    },
                    t(lang, "體重已記錄", "Weight saved")
                  );
                }}
              >
                <p className="text-base font-semibold text-ink">{t(lang, "快速記錄體重", "Quick Weight Entry")}</p>
                <div className="mt-4 grid gap-4">
                  <FieldLabel label={t(lang, "體重（kg）", "Weight (kg)")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className={baseInputClass}
                      value={quickWeightForm.value}
                      onChange={(event) =>
                        setQuickWeightForm((current) => ({ ...current, value: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "記錄時間", "Recorded At")}>
                    <input
                      type="datetime-local"
                      className={baseInputClass}
                      value={quickWeightForm.recordedAt}
                      onChange={(event) =>
                        setQuickWeightForm((current) => ({
                          ...current,
                          recordedAt: event.target.value
                        }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "備註", "Notes")}>
                    <input
                      className={baseInputClass}
                      placeholder={t(lang, "例如：早上量度", "Example: morning weigh-in")}
                      value={quickWeightForm.notes}
                      onChange={(event) =>
                        setQuickWeightForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <SubmitButton disabled={isSaving}>{t(lang, "新增體重紀錄", "Add weight record")}</SubmitButton>
                </div>
              </form>

              <form
                className="rounded-[24px] border border-white/70 bg-white/70 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    async () => {
                      const entries = [
                        ["waist", quickBodyMeasurementsForm.waist],
                        ["hip", quickBodyMeasurementsForm.hip],
                        ["chest", quickBodyMeasurementsForm.chest]
                      ].filter(([, value]) => String(value || "").trim());

                      if (!entries.length) {
                        throw new Error(t(lang, "請至少填寫一項圍度", "Enter at least one body measurement"));
                      }

                      await Promise.all(
                        entries.map(([category, value]) =>
                          createHealthRecord(member.id, {
                            category,
                            value,
                            unit: "cm",
                            notes: quickBodyMeasurementsForm.notes,
                            recordedAt: new Date(quickBodyMeasurementsForm.recordedAt).toISOString()
                          })
                        )
                      );

                      setQuickBodyMeasurementsForm({
                        waist: "",
                        hip: "",
                        chest: "",
                        recordedAt: toDateTimeLocalValue(new Date().toISOString()),
                        notes: ""
                      });
                    },
                    t(lang, "圍度已記錄", "Measurements saved")
                  );
                }}
              >
                <p className="text-base font-semibold text-ink">{t(lang, "快速記錄圍度", "Quick Body Measurements")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>{t(lang, "目前腰圍", "Current waist")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {member.latestMetrics?.waist?.value ? `${member.latestMetrics.waist.value} cm` : t(lang, "未設定", "Not set")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>{t(lang, "目前臀圍", "Current hip")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {member.latestMetrics?.hip?.value ? `${member.latestMetrics.hip.value} cm` : t(lang, "未設定", "Not set")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>{t(lang, "目前胸圍", "Current chest")}</p>
                    <p className="mt-1 font-semibold text-ink">
                      {member.latestMetrics?.chest?.value ? `${member.latestMetrics.chest.value} cm` : t(lang, "未設定", "Not set")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <FieldLabel label={t(lang, "腰圍（cm）", "Waist (cm)")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className={baseInputClass}
                      value={quickBodyMeasurementsForm.waist}
                      onChange={(event) =>
                        setQuickBodyMeasurementsForm((current) => ({ ...current, waist: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "臀圍（cm）", "Hip (cm)")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className={baseInputClass}
                      value={quickBodyMeasurementsForm.hip}
                      onChange={(event) =>
                        setQuickBodyMeasurementsForm((current) => ({ ...current, hip: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "胸圍（cm）", "Chest (cm)")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className={baseInputClass}
                      value={quickBodyMeasurementsForm.chest}
                      onChange={(event) =>
                        setQuickBodyMeasurementsForm((current) => ({ ...current, chest: event.target.value }))
                      }
                    />
                  </FieldLabel>
                  <FieldLabel label={t(lang, "記錄時間", "Recorded At")}>
                    <input
                      type="datetime-local"
                      className={baseInputClass}
                      value={quickBodyMeasurementsForm.recordedAt}
                      onChange={(event) =>
                        setQuickBodyMeasurementsForm((current) => ({
                          ...current,
                          recordedAt: event.target.value
                        }))
                      }
                    />
                  </FieldLabel>
                  <div className="sm:col-span-2">
                    <FieldLabel label={t(lang, "備註", "Notes")}>
                      <input
                        className={baseInputClass}
                        placeholder={t(lang, "例如：量身日", "Example: measurement check")}
                        value={quickBodyMeasurementsForm.notes}
                        onChange={(event) =>
                          setQuickBodyMeasurementsForm((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </FieldLabel>
                  </div>
                  <div className="sm:col-span-3">
                    <SubmitButton disabled={isSaving}>{t(lang, "新增圍度紀錄", "Add measurements")}</SubmitButton>
                  </div>
                </div>
              </form>
            </div>
          </SectionCard>
        ) : null}
      </div>
    );
  }

  function renderRecordTab() {
    return (
      <div className="space-y-5">
        <SectionCard
          eyebrow={t(lang, "新增資料", "Add Data")}
          title={t(lang, "新增健康紀錄", "Add Health Record")}
          description={t(lang, "先新增，再直接在下方依項目快速管理。", "Add a record first, then manage it below by category.")}
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                async () => {
                  await createHealthRecord(member.id, {
                    ...newRecordForm,
                    recordedAt: new Date(newRecordForm.recordedAt).toISOString()
                  });
                  resetRecordForm();
                },
                t(lang, "健康紀錄已新增", "Health record added")
              );
            }}
          >
            <FieldLabel label={t(lang, "類型", "Type")}>
              <select
                className={baseInputClass}
                value={newRecordForm.category}
                onChange={(event) =>
                  setNewRecordForm((current) => {
                    const preset = HEALTH_RECORD_PRESETS.find((item) => item.value === event.target.value);
                    return {
                      ...current,
                      category: event.target.value,
                      unit: preset?.unit || current.unit
                    };
                  })
                }
              >
                {HEALTH_RECORD_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {translateHealthPresetLabel(lang, preset.value)}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="數值">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                className={baseInputClass}
                value={newRecordForm.value}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, value: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="單位">
              <input
                className={baseInputClass}
                value={newRecordForm.unit}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="記錄時間">
              <input
                type="datetime-local"
                className={baseInputClass}
                value={newRecordForm.recordedAt}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, recordedAt: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="md:col-span-2">
              <FieldLabel label="備註">
                <textarea
                  className={`${baseInputClass} min-h-24 resize-y`}
                  value={newRecordForm.notes}
                  onChange={(event) =>
                    setNewRecordForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </FieldLabel>
            </div>
            <div className="md:col-span-2">
              <SubmitButton disabled={isSaving}>新增健康紀錄</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <HealthRecordGroupList
          memberId={member.id}
          items={manualHealthRecords}
          onRunAction={runAction}
          isSaving={isSaving}
          lang={lang}
        />
      </div>
    );
  }

  function renderGrowthTab() {
    return (
      <div className="space-y-5">
        <SectionCard
          eyebrow={t(lang, "Ryan Growth", "Ryan Growth")}
          title={t(lang, "新增成長測量", "Add Growth Measurement")}
          description={t(lang, "新增完之後，下方每條可以直接編輯或刪除。", "Add a growth entry first, then edit or delete each record below.")}
          tone="accent"
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  createGrowthMeasurement(member.id, {
                    ...newGrowthForm,
                    measuredAt: new Date(newGrowthForm.measuredAt).toISOString()
                  }),
                t(lang, "成長數據已新增", "Growth record added")
              );
            }}
          >
            <FieldLabel label={t(lang, "身高（cm）", "Height (cm)")}>
              <input
                className={baseInputClass}
                value={newGrowthForm.heightCm}
                onChange={(event) =>
                  setNewGrowthForm((current) => ({ ...current, heightCm: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label={t(lang, "體重（kg）", "Weight (kg)")}>
              <input
                className={baseInputClass}
                value={newGrowthForm.weightKg}
                onChange={(event) =>
                  setNewGrowthForm((current) => ({ ...current, weightKg: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label={t(lang, "測量時間", "Measured At")}>
              <input
                type="datetime-local"
                className={baseInputClass}
                value={newGrowthForm.measuredAt}
                onChange={(event) =>
                  setNewGrowthForm((current) => ({ ...current, measuredAt: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="md:col-span-2">
              <SubmitButton disabled={isSaving}>{t(lang, "新增成長數據", "Add growth record")}</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <EditableList
          title={t(lang, "快速修改成長數據", "Quick Edit Growth Records")}
          description={t(lang, "每條測量都可以直接保存或刪除。", "Each growth entry can be saved or deleted directly.")}
          items={growth?.measurements || []}
          getKey={(item) => item.id}
          getTitle={(item) => `${item.heightCm} cm / ${item.weightKg} kg`}
          getSubtitle={(item) => formatChineseDate(item.measuredAt, false, lang)}
          initialValues={(item) => ({
            heightCm: String(item.heightCm ?? ""),
            weightKg: String(item.weightKg ?? ""),
            measuredAt: toDateTimeLocalValue(item.measuredAt)
          })}
          renderFields={(draft, updateDraft) => (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label={t(lang, "身高（cm）", "Height (cm)")}>
                <input
                  className={baseInputClass}
                  value={draft.heightCm}
                  onChange={(event) => updateDraft({ heightCm: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={t(lang, "體重（kg）", "Weight (kg)")}>
                <input
                  className={baseInputClass}
                  value={draft.weightKg}
                  onChange={(event) => updateDraft({ weightKg: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={t(lang, "測量時間", "Measured At")}>
                <input
                  type="datetime-local"
                  className={baseInputClass}
                  value={draft.measuredAt}
                  onChange={(event) => updateDraft({ measuredAt: event.target.value })}
                />
              </FieldLabel>
            </div>
          )}
          onSave={(item, draft) =>
            runAction(
              () =>
                updateGrowthMeasurement(member.id, item.id, {
                  ...draft,
                  measuredAt: new Date(draft.measuredAt).toISOString()
                }),
              t(lang, "成長數據已更新", "Growth record updated")
            )
          }
          onDelete={(item) =>
            runAction(() => deleteGrowthMeasurement(member.id, item.id), t(lang, "成長數據已刪除", "Growth record deleted"))
          }
          isSaving={isSaving}
          emptyText={t(lang, "暫時沒有成長數據。", "No growth records yet.")}
          deleteLabel={t(lang, "成長數據", "Growth record")}
          itemIdPrefix="growth-record"
        />
      </div>
    );
  }

  function renderExerciseTab() {
    return (
      <div className="space-y-5">
        <SectionCard
          eyebrow={t(lang, "手動輸入", "Manual Entries")}
          title={t(lang, "新增運動紀錄", "Add Workout")}
          description={t(lang, "揀運動類型後，系統會按你的最近體重自動估算卡路里。", "Calories are auto-estimated from the selected workout type and your latest weight.")}
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                async () => {
                  await createExerciseLog(member.id, {
                    ...newExerciseForm,
                    performedAt: new Date(newExerciseForm.performedAt).toISOString()
                  });
                  resetExerciseForm();
                },
                t(lang, "運動紀錄已新增", "Workout added")
              );
            }}
          >
            <FieldLabel label={t(lang, "運動類型", "Workout Type")}>
              <select
                className={baseInputClass}
                value={newExerciseForm.workoutType}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({
                    ...current,
                    workoutType: event.target.value,
                    caloriesBurned: estimateCaloriesBurned(
                      event.target.value,
                      current.durationMinutes,
                      latestWeightValue
                    )
                  }))
                }
              >
                <option value="">{t(lang, "請選擇運動類型", "Select a workout type")}</option>
                {WORKOUT_TYPE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {translateWorkoutType(lang, preset.value)}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label={t(lang, "時長（分鐘）", "Duration (min)")}>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                className={baseInputClass}
                placeholder={t(lang, "例如：45", "Example: 45")}
                value={newExerciseForm.durationMinutes}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                    caloriesBurned: estimateCaloriesBurned(
                      current.workoutType,
                      event.target.value,
                      latestWeightValue
                    )
                  }))
                }
              />
            </FieldLabel>
            <FieldLabel label={t(lang, "運動時間", "Workout Time")}>
              <input
                type="datetime-local"
                className={baseInputClass}
                value={newExerciseForm.performedAt}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({ ...current, performedAt: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="md:col-span-2">
              <FieldLabel label={t(lang, "備註", "Notes")}>
                <textarea
                  className={`${baseInputClass} min-h-24 resize-y`}
                  placeholder={t(lang, "例如：跑步機 5 公里，感覺良好", "Example: 5 km treadmill run, felt good")}
                  value={newExerciseForm.notes}
                  onChange={(event) =>
                    setNewExerciseForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </FieldLabel>
            </div>
            <div className="md:col-span-2">
              <p className="mb-3 text-xs text-slate-500">
                {t(
                  lang,
                  `卡路里會按最近體重 ${latestWeightValue || 70} kg 自動估算並儲存；如果未有體重，會先用 70 kg。`,
                  `Calories are auto-estimated using your latest weight of ${latestWeightValue || 70} kg. If no weight is available, 70 kg is used.`
                )}
              </p>
              <SubmitButton disabled={isSaving}>{t(lang, "新增運動紀錄", "Add workout")}</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <EditableList
          title={t(lang, "快速修改運動紀錄", "Quick Edit Workouts")}
          description={t(lang, "只會顯示人手新增的運動紀錄；Apple Health 匯入的資料不會在這裡修改。", "Only manual workout entries appear here. Apple Health imports cannot be edited here.")}
          items={manualExerciseLogs}
          getKey={(item) => item.id}
          getTitle={(item) => item.workoutType}
          getSubtitle={(item) => formatChineseDate(item.performedAt, true, lang)}
          initialValues={(item) => ({
            workoutType: item.workoutType,
            durationMinutes: String(item.durationMinutes ?? ""),
            caloriesBurned: String(item.caloriesBurned ?? ""),
            notes: item.notes || "",
            performedAt: toDateTimeLocalValue(item.performedAt)
          })}
          renderFields={(draft, updateDraft) => (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="運動類型">
                <select
                  className={baseInputClass}
                  value={draft.workoutType}
                  onChange={(event) =>
                    updateDraft({
                      workoutType: event.target.value,
                      caloriesBurned:
                        estimateCaloriesBurned(
                          event.target.value,
                          draft.durationMinutes,
                          latestWeightValue
                        ) || draft.caloriesBurned
                    })
                  }
                >
                  <option value="">請選擇運動類型</option>
                  {!WORKOUT_TYPE_PRESETS.some((preset) => preset.value === draft.workoutType) &&
                  draft.workoutType ? (
                    <option value={draft.workoutType}>{draft.workoutType}</option>
                  ) : null}
                  {WORKOUT_TYPE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {translateWorkoutType(lang, preset.value)}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="時長（分鐘）">
                <input
                  className={baseInputClass}
                  value={draft.durationMinutes}
                  onChange={(event) =>
                    updateDraft({
                      durationMinutes: event.target.value,
                      caloriesBurned:
                        estimateCaloriesBurned(
                          draft.workoutType,
                          event.target.value,
                          latestWeightValue
                        ) || draft.caloriesBurned
                    })
                  }
                />
              </FieldLabel>
              <FieldLabel label="卡路里">
                <input
                  className={baseInputClass}
                  value={draft.caloriesBurned}
                  onChange={(event) => updateDraft({ caloriesBurned: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="運動時間">
                <input
                  type="datetime-local"
                  className={baseInputClass}
                  value={draft.performedAt}
                  onChange={(event) => updateDraft({ performedAt: event.target.value })}
                />
              </FieldLabel>
              <div className="md:col-span-2">
                <FieldLabel label="備註">
                  <textarea
                    className={`${baseInputClass} min-h-24 resize-y`}
                    value={draft.notes}
                    onChange={(event) => updateDraft({ notes: event.target.value })}
                  />
                </FieldLabel>
              </div>
            </div>
          )}
          onSave={(item, draft) =>
            runAction(
              () =>
                updateExerciseLog(member.id, item.id, {
                  ...draft,
                  performedAt: new Date(draft.performedAt).toISOString()
                }),
              t(lang, "運動紀錄已更新", "Workout updated")
            )
          }
          onDelete={(item) =>
            runAction(() => deleteExerciseLog(member.id, item.id), t(lang, "運動紀錄已刪除", "Workout deleted"))
          }
          isSaving={isSaving}
          emptyText={t(lang, "暫時沒有可修改的人手運動紀錄。", "No editable manual workout records yet.")}
          deleteLabel={t(lang, "運動紀錄", "Workout")}
        />
      </div>
    );
  }

  function renderAppleHealthTab() {
    const isAppleHealthBusy = appleHealthJob?.phase === "running";

    return (
      <div className="space-y-5">
        <SectionCard
          eyebrow="Apple Health"
          title={t(lang, "Apple Health 自動匯入", "Apple Health Auto Import")}
          description={t(lang, "建議先看預覽，再正式匯入。每一步都會顯示明確狀態。", "Preview first, then import. Each step shows a clear status.")}
          tone="accent"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-base font-semibold text-ink">{t(lang, "第 1 步：先做預覽", "Step 1: Preview first")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t(lang, "先掃描 iCloud Drive 最新 zip，看看會新增多少資料。", "Scan the latest iCloud Drive zip first to see what would be added.")}
              </p>
              <div className="mt-4">
                <ActionButton disabled={isAppleHealthBusy} onClick={handleAppleHealthPreviewLatest}>
                  {isAppleHealthBusy && appleHealthJob?.kind === "preview-latest"
                    ? t(lang, "正在分析最新 zip...", "Previewing latest zip...")
                    : t(lang, "先做預覽", "Preview")}
                </ActionButton>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-base font-semibold text-ink">{t(lang, "第 2 步：正式匯入", "Step 2: Import")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t(lang, "確認預覽沒問題之後，再把最近 30 日資料寫入資料庫。", "After reviewing the preview, write the last 30 days of data into the database.")}
              </p>
              <div className="mt-4">
                <ActionButton disabled={isAppleHealthBusy} onClick={handleAppleHealthImportLatest}>
                  {isAppleHealthBusy && appleHealthJob?.kind === "import-latest"
                    ? t(lang, "正在匯入最新 zip...", "Importing latest zip...")
                    : t(lang, "開始自動匯入", "Start auto import")}
                </ActionButton>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {t(lang, "系統會自動讀取", "The system will automatically read")}
            <span className="mx-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {`iCloud Drive/Apple Health/${member.name}`}
            </span>
            {t(lang, "資料夾裡最新的 zip，解壓後自動找到", "for the latest zip in that folder, unpack it, find")} <code>export.xml</code>{t(lang, "，並只同步最近 30 日資料。", ", and sync only the most recent 30 days of data.")}
          </p>
        </SectionCard>

        <SectionCard
          eyebrow="Fallback"
          title={t(lang, "手動上傳 Apple Health 匯出檔", "Manual Apple Health Upload")}
          description={t(lang, "如果你想自己選檔，也建議先預覽再匯入。", "If you prefer manual upload, preview before importing.")}
        >
          <div className="space-y-4">
            <FieldLabel label={t(lang, "選擇 export.xml", "Choose export.xml")}>
              <input
                type="file"
                accept=".xml,text/xml"
                className={baseInputClass}
                onChange={(event) => {
                  setAppleHealthPreview(null);
                  setAppleHealthJob(null);
                  setAppleHealthFile(event.target.files?.[0] || null);
                }}
              />
            </FieldLabel>
            <div className="flex flex-col gap-3 md:flex-row">
              <ActionButton disabled={!appleHealthFile || isAppleHealthBusy} onClick={handleAppleHealthPreviewFile}>
                {isAppleHealthBusy && appleHealthJob?.kind === "preview-file"
                  ? t(lang, "正在分析上傳檔案...", "Previewing uploaded file...")
                  : t(lang, "先看預覽", "Preview")}
              </ActionButton>
              <ActionButton disabled={!appleHealthFile || isAppleHealthBusy} onClick={handleAppleHealthImportFile}>
                {isAppleHealthBusy && appleHealthJob?.kind === "import-file"
                  ? t(lang, "正在匯入上傳檔案...", "Importing uploaded file...")
                  : t(lang, "開始匯入", "Import")}
              </ActionButton>
            </div>
          </div>
        </SectionCard>

        <AppleHealthWorkflowCard job={appleHealthJob} onRefreshPage={() => router.refresh()} lang={lang} />

        <AppleHealthPreview preview={appleHealthPreview} lang={lang} />
      </div>
    );
  }

  const managementStatus = [
    {
      label: t(lang, "管理模式", "Workflow"),
      value: isAdult ? t(lang, "手動記錄 + Apple Health", "Manual + Apple Health") : t(lang, "兒童成長管理", "Child Growth Tracking")
    },
    {
      label: t(lang, "目前分頁", "Active Tab"),
      value: tabs.find((tab) => tab.id === activeTab)?.label || ""
    }
  ];

  return (
    <section className="space-y-6">
      <ManagementIntro
        lang={lang}
        title={t(lang, `${member.name} 的資料工作台`, `${member.name}'s data workspace`)}
        description={
          isAdult
            ? t(
                lang,
                "把手動記錄、運動紀錄和 Apple Health 同步集中在同一個地方，先看摘要，再逐步處理。",
                "Keep manual records, workouts, and Apple Health sync in one focused workflow: review the summary, then take action."
              )
            : t(
                lang,
                "這裡是 Ryan 的成長管理區。先記錄身高體重，再回到上方圖表查看趨勢。",
                "This is Ryan's growth workspace. Add height and weight entries here, then return to the charts above to review the trend."
              )
        }
        status={managementStatus}
      />

      <div className="flex flex-wrap gap-3 rounded-[24px] border border-white/70 bg-white/70 p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tabButtonClass(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {activeTab === "profile" ? renderProfileTab() : null}
      {activeTab === "record" ? renderRecordTab() : null}
      {activeTab === "growth" ? renderGrowthTab() : null}
      {activeTab === "exercise" ? renderExerciseTab() : null}
      {activeTab === "apple-health" ? renderAppleHealthTab() : null}
    </section>
  );
}
