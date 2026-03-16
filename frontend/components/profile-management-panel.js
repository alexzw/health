"use client";

import { useMemo, useState } from "react";
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

function SectionCard({ title, description, children }) {
  return (
    <div className="glass-panel rounded-[28px] p-6 shadow-glass">
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

function getHealthCategoryOrder(category) {
  const map = {
    weight: 0,
    heart_rate: 1,
    resting_heart_rate: 2,
    steps: 3,
    sleep: 4,
    height: 5
  };

  return map[normalizeRecordCategory(category)] ?? 99;
}

function HealthRecordGroupList({ memberId, items, onRunAction, isSaving }) {
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

        return formatCategoryLabel(left[0]).localeCompare(formatCategoryLabel(right[0]), "zh-HK");
      })
      .map(([key, groupItems]) => ({
        key,
        label: formatCategoryLabel(key),
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
      <SectionCard title="快速修改健康紀錄" description="依項目分開管理，會更快。">
        <p className="text-sm text-slate-500">暫時沒有健康紀錄。</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="快速修改健康紀錄" description="體重、心率、步數等已分開顯示，每條都可直接保存或一鍵刪除。">
      <div className="space-y-5">
        {groupedItems.map((group) => (
          <div key={group.key} className="rounded-[24px] border border-white/70 bg-white/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-ink">{group.label}</p>
                <p className="text-sm text-slate-500">{group.items.length} 條紀錄</p>
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
                          {formatChineseDate(item.recordedAt, true)}
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
  deleteLabel
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

function AppleHealthPreview({ preview }) {
  if (!preview) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5">
      <p className="text-base font-semibold text-ink">匯入預覽</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">會新增健康紀錄</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.newRecordCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">會略過重複健康紀錄</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.duplicateRecordCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">會新增運動紀錄</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.newWorkoutCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">會略過重複運動紀錄</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {preview.preview.duplicateWorkoutCount}
          </p>
        </div>
      </div>
      {preview.source ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>來源資料夾：{preview.source.folderPath}</p>
          <p className="mt-1">最新 zip：{preview.source.zipPath}</p>
          <p className="mt-1">匯入檔案：{preview.source.exportXmlPath}</p>
          {preview.source.sinceDate ? (
            <p className="mt-1">同步範圍：{formatChineseDate(preview.source.sinceDate)} 之後</p>
          ) : null}
        </div>
      ) : null}
      {preview.preview.sampleRecords?.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">健康紀錄預覽</p>
          <div className="mt-2 space-y-2">
            {preview.preview.sampleRecords.map((record, index) => (
              <div
                key={`${record.category}-${record.recordedAt}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {formatCategoryLabel(record.category)}: {record.value} {record.unit || ""}，
                {formatChineseDate(record.recordedAt, true)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {preview.preview.sampleWorkouts?.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">運動紀錄預覽</p>
          <div className="mt-2 space-y-2">
            {preview.preview.sampleWorkouts.map((workout, index) => (
              <div
                key={`${workout.workoutType}-${workout.performedAt}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {workout.workoutType}，{workout.durationMinutes} 分鐘，
                {formatChineseDate(workout.performedAt, true)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileManagementPanel({ member, growth }) {
  const router = useRouter();
  const isAdult = member.familyRole !== "Child";
  const tabs = [
    { id: "profile", label: "個人資料" },
    { id: "record", label: "健康紀錄" },
    { id: isAdult ? "exercise" : "growth", label: isAdult ? "運動紀錄" : "成長數據" }
  ];

  if (isAdult) {
    tabs.push({ id: "apple-health", label: "Apple Health 匯入" });
  }

  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [appleHealthFile, setAppleHealthFile] = useState(null);
  const [appleHealthPreview, setAppleHealthPreview] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: member.name,
    gender: member.gender,
    dateOfBirth: member.dateOfBirth
  });

  const [newRecordForm, setNewRecordForm] = useState({
    category: "",
    value: "",
    unit: "",
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

  function renderProfileTab() {
    return (
      <SectionCard title="編輯個人資料" description="修改姓名、性別和生日。">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            runAction(() => updateFamilyMember(member.id, profileForm), "個人資料已更新");
          }}
        >
          <FieldLabel label="姓名">
            <input
              className={baseInputClass}
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FieldLabel>
          <FieldLabel label="性別">
            <input
              className={baseInputClass}
              value={profileForm.gender}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, gender: event.target.value }))
              }
            />
          </FieldLabel>
          <FieldLabel label="生日">
            <input
              type="date"
              className={baseInputClass}
              value={toDateInputValue(profileForm.dateOfBirth)}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, dateOfBirth: event.target.value }))
              }
            />
          </FieldLabel>
          <SubmitButton disabled={isSaving}>保存</SubmitButton>
        </form>
      </SectionCard>
    );
  }

  function renderRecordTab() {
    return (
      <div className="space-y-5">
        <SectionCard title="新增健康紀錄" description="先新增，再直接在下方依項目快速管理。">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  createHealthRecord(member.id, {
                    ...newRecordForm,
                    recordedAt: new Date(newRecordForm.recordedAt).toISOString()
                  }),
                "健康紀錄已新增"
              );
            }}
          >
            <FieldLabel label="類型">
              <input
                className={baseInputClass}
                value={newRecordForm.category}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="數值">
              <input
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
          items={member.healthDataRecords || []}
          onRunAction={runAction}
          isSaving={isSaving}
        />
      </div>
    );
  }

  function renderGrowthTab() {
    return (
      <div className="space-y-5">
        <SectionCard title="新增成長測量" description="新增完之後，下方每條可以直接編輯或刪除。">
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
                "成長數據已新增"
              );
            }}
          >
            <FieldLabel label="身高（cm）">
              <input
                className={baseInputClass}
                value={newGrowthForm.heightCm}
                onChange={(event) =>
                  setNewGrowthForm((current) => ({ ...current, heightCm: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="體重（kg）">
              <input
                className={baseInputClass}
                value={newGrowthForm.weightKg}
                onChange={(event) =>
                  setNewGrowthForm((current) => ({ ...current, weightKg: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="測量時間">
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
              <SubmitButton disabled={isSaving}>新增成長數據</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <EditableList
          title="快速修改成長數據"
          description="每條測量都可以直接保存或刪除。"
          items={growth?.measurements || []}
          getKey={(item) => item.id}
          getTitle={(item) => `${item.heightCm} cm / ${item.weightKg} kg`}
          getSubtitle={(item) => formatChineseDate(item.measuredAt)}
          initialValues={(item) => ({
            heightCm: String(item.heightCm ?? ""),
            weightKg: String(item.weightKg ?? ""),
            measuredAt: toDateTimeLocalValue(item.measuredAt)
          })}
          renderFields={(draft, updateDraft) => (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="身高（cm）">
                <input
                  className={baseInputClass}
                  value={draft.heightCm}
                  onChange={(event) => updateDraft({ heightCm: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="體重（kg）">
                <input
                  className={baseInputClass}
                  value={draft.weightKg}
                  onChange={(event) => updateDraft({ weightKg: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="測量時間">
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
              "成長數據已更新"
            )
          }
          onDelete={(item) =>
            runAction(() => deleteGrowthMeasurement(member.id, item.id), "成長數據已刪除")
          }
          isSaving={isSaving}
          emptyText="暫時沒有成長數據。"
          deleteLabel="成長數據"
        />
      </div>
    );
  }

  function renderExerciseTab() {
    return (
      <div className="space-y-5">
        <SectionCard title="新增運動紀錄" description="新增完之後，下方每條可以直接改或刪除。">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  createExerciseLog(member.id, {
                    ...newExerciseForm,
                    performedAt: new Date(newExerciseForm.performedAt).toISOString()
                  }),
                "運動紀錄已新增"
              );
            }}
          >
            <FieldLabel label="運動類型">
              <input
                className={baseInputClass}
                value={newExerciseForm.workoutType}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({ ...current, workoutType: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="時長（分鐘）">
              <input
                className={baseInputClass}
                value={newExerciseForm.durationMinutes}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value
                  }))
                }
              />
            </FieldLabel>
            <FieldLabel label="卡路里">
              <input
                className={baseInputClass}
                value={newExerciseForm.caloriesBurned}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({
                    ...current,
                    caloriesBurned: event.target.value
                  }))
                }
              />
            </FieldLabel>
            <FieldLabel label="運動時間">
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
              <FieldLabel label="備註">
                <textarea
                  className={`${baseInputClass} min-h-24 resize-y`}
                  value={newExerciseForm.notes}
                  onChange={(event) =>
                    setNewExerciseForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </FieldLabel>
            </div>
            <div className="md:col-span-2">
              <SubmitButton disabled={isSaving}>新增運動紀錄</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <EditableList
          title="快速修改運動紀錄"
          description="每條運動紀錄都可以直接改和刪除。"
          items={member.exerciseLogs || []}
          getKey={(item) => item.id}
          getTitle={(item) => item.workoutType}
          getSubtitle={(item) => formatChineseDate(item.performedAt, true)}
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
                <input
                  className={baseInputClass}
                  value={draft.workoutType}
                  onChange={(event) => updateDraft({ workoutType: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="時長（分鐘）">
                <input
                  className={baseInputClass}
                  value={draft.durationMinutes}
                  onChange={(event) => updateDraft({ durationMinutes: event.target.value })}
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
              "運動紀錄已更新"
            )
          }
          onDelete={(item) =>
            runAction(() => deleteExerciseLog(member.id, item.id), "運動紀錄已刪除")
          }
          isSaving={isSaving}
          emptyText="暫時沒有運動紀錄。"
          deleteLabel="運動紀錄"
        />
      </div>
    );
  }

  function renderAppleHealthTab() {
    return (
      <div className="space-y-5">
        <SectionCard
          title="Apple Health 自動匯入"
          description="如果你每次都把 export.zip 放到 iCloud Drive 的 Apple Health 資料夾，這裡可以直接自動找最新檔案。"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <SubmitButton
              type="button"
              disabled={isSaving}
              className="md:w-fit"
              onClick={() =>
                runAction(async () => {
                  const preview = await previewLatestAppleHealthImport(member.id);
                  setAppleHealthPreview(preview);
                }, "已讀取 iCloud Drive 最新匯出預覽")
              }
            >
              讀取 iCloud 最新匯出預覽
            </SubmitButton>
            <SubmitButton
              type="button"
              disabled={isSaving}
              className="md:w-fit"
              onClick={() =>
                runAction(
                  async () => {
                    const result = await importLatestAppleHealth(member.id);
                    setAppleHealthPreview(null);
                    return result;
                  },
                  "已自動從 iCloud Drive 最新 zip 匯入"
                )
              }
            >
              自動匯入最新 zip
            </SubmitButton>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            預設會讀取
            <span className="mx-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              iCloud Drive/Apple Health/
            </span>
            裡最新的 zip，解壓後自動找到 <code>export.xml</code>，並只同步最近 30 日資料。
          </p>
        </SectionCard>

        <SectionCard
          title="手動上傳 Apple Health 匯出檔"
          description="如果你想自己挑選檔案，也可以上傳 export.xml。"
        >
          <div className="space-y-4">
            <FieldLabel label="選擇 export.xml">
              <input
                type="file"
                accept=".xml,text/xml"
                className={baseInputClass}
                onChange={(event) => {
                  setAppleHealthPreview(null);
                  setAppleHealthFile(event.target.files?.[0] || null);
                }}
              />
            </FieldLabel>
            <div className="flex flex-col gap-3 md:flex-row">
              <SubmitButton
                type="button"
                disabled={!appleHealthFile || isSaving}
                className="md:w-fit"
                onClick={() =>
                  runAction(async () => {
                    const preview = await previewAppleHealthImport(member.id, appleHealthFile);
                    setAppleHealthPreview(preview);
                  }, "已生成匯入預覽")
                }
              >
                先看預覽
              </SubmitButton>
              <SubmitButton
                type="button"
                disabled={!appleHealthFile || isSaving}
                className="md:w-fit"
                onClick={() =>
                  runAction(async () => {
                    const result = await importAppleHealth(member.id, appleHealthFile);
                    setAppleHealthPreview(null);
                    return result;
                  }, "Apple Health 已匯入")
                }
              >
                開始匯入
              </SubmitButton>
            </div>
          </div>
        </SectionCard>

        <AppleHealthPreview preview={appleHealthPreview} />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-3">
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
