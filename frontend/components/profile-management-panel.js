"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createExerciseLog,
  createGrowthMeasurement,
  createHealthRecord,
  importAppleHealth,
  updateExerciseLog,
  updateFamilyMember,
  updateGrowthMeasurement,
  updateHealthRecord
} from "../lib/api";

const baseInputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

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

function SubmitButton({ children, disabled, className = "" }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function InlineEditList({
  title,
  description,
  items,
  getKey,
  getTitle,
  getSubtitle,
  initialValues,
  renderFields,
  onSave,
  isSaving,
  emptyText
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
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-semibold text-ink">{getTitle(item)}</p>
                  <p className="text-sm text-slate-500">{getSubtitle(item)}</p>
                </div>
                <SubmitButton disabled={isSaving} className="md:self-start">
                  保存這一條
                </SubmitButton>
              </div>
              <div className="mt-4">{renderFields(draft, (updates) => updateDraft(id, updates))}</div>
            </form>
          );
        })}
      </div>
    </SectionCard>
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
        <SectionCard title="新增健康紀錄" description="先新增，再直接在下方逐條快速編輯。">
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

        <InlineEditList
          title="快速修改健康紀錄"
          description="每一條紀錄都可以直接改，不用先選。"
          items={member.healthDataRecords || []}
          getKey={(item) => item.id}
          getTitle={(item) => item.category}
          getSubtitle={(item) =>
            new Date(item.recordedAt).toLocaleString("zh-HK", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          }
          initialValues={(item) => ({
            category: item.category,
            value: item.value === null ? "" : String(item.value),
            unit: item.unit || "",
            notes: item.notes || "",
            recordedAt: toDateTimeLocalValue(item.recordedAt)
          })}
          renderFields={(draft, updateDraft) => (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="類型">
                <input
                  className={baseInputClass}
                  value={draft.category}
                  onChange={(event) => updateDraft({ category: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="數值">
                <input
                  className={baseInputClass}
                  value={draft.value}
                  onChange={(event) => updateDraft({ value: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="單位">
                <input
                  className={baseInputClass}
                  value={draft.unit}
                  onChange={(event) => updateDraft({ unit: event.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="記錄時間">
                <input
                  type="datetime-local"
                  className={baseInputClass}
                  value={draft.recordedAt}
                  onChange={(event) => updateDraft({ recordedAt: event.target.value })}
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
                updateHealthRecord(member.id, item.id, {
                  ...draft,
                  recordedAt: new Date(draft.recordedAt).toISOString()
                }),
              "健康紀錄已更新"
            )
          }
          isSaving={isSaving}
          emptyText="暫時沒有健康紀錄。"
        />
      </div>
    );
  }

  function renderGrowthTab() {
    return (
      <div className="space-y-5">
        <SectionCard title="新增成長測量" description="新增完之後，下方每條可以直接編輯。">
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

        <InlineEditList
          title="快速修改成長數據"
          description="直接在每條測量上修改，不用再下拉選擇。"
          items={growth?.measurements || []}
          getKey={(item) => item.id}
          getTitle={(item) => `${item.heightCm} cm / ${item.weightKg} kg`}
          getSubtitle={(item) => new Date(item.measuredAt).toLocaleDateString("zh-HK")}
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
          isSaving={isSaving}
          emptyText="暫時沒有成長數據。"
        />
      </div>
    );
  }

  function renderExerciseTab() {
    return (
      <div className="space-y-5">
        <SectionCard title="新增運動紀錄" description="新增完之後，下方每條可以直接改。">
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

        <InlineEditList
          title="快速修改運動紀錄"
          description="每條運動紀錄都可以直接改。"
          items={member.exerciseLogs || []}
          getKey={(item) => item.id}
          getTitle={(item) => item.workoutType}
          getSubtitle={(item) => new Date(item.performedAt).toLocaleString("zh-HK")}
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
          isSaving={isSaving}
          emptyText="暫時沒有運動紀錄。"
        />
      </div>
    );
  }

  function renderAppleHealthTab() {
    return (
      <SectionCard
        title="Apple Health 匯入"
        description="上傳 iPhone Health app 匯出的 XML 檔案。系統會匯入體重、步數、心率、睡眠和運動資料。"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (!appleHealthFile) {
              setError("請先選擇 Apple Health 匯出檔");
              return;
            }

            runAction(
              () => importAppleHealth(member.id, appleHealthFile),
              "Apple Health 資料已匯入"
            );
          }}
        >
          <FieldLabel label="XML 匯出檔">
            <input
              type="file"
              accept=".xml,text/xml"
              className={`${baseInputClass} file:mr-4 file:rounded-full file:border-0 file:bg-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
              onChange={(event) => setAppleHealthFile(event.target.files?.[0] || null)}
            />
          </FieldLabel>
          <SubmitButton disabled={isSaving}>開始匯入</SubmitButton>
        </form>
        <div className="mt-5 rounded-[22px] bg-white/70 p-4 text-sm leading-6 text-slate-600">
          <p>匯入方式：</p>
          <p>1. 在 iPhone 打開「健康」App。</p>
          <p>2. 點右上角個人頭像。</p>
          <p>3. 向下找到「匯出所有健康資料」。</p>
          <p>4. 等 iPhone 產生 `export.zip`。</p>
          <p>5. 解壓後選擇裡面的 `export.xml` 上傳到這裡。</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-[30px] p-6 shadow-glass">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">資料管理</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
              新增與修改資料
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              改成逐條直接編輯，唔使再先選一條再填表。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      {message ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
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
