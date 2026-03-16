"use client";

import { useEffect, useState } from "react";
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

function SubmitButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
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

  const [selectedRecordId, setSelectedRecordId] = useState(member.healthDataRecords[0]?.id || "");
  const selectedRecord = member.healthDataRecords.find((record) => record.id === selectedRecordId);
  const [editRecordForm, setEditRecordForm] = useState({
    category: "",
    value: "",
    unit: "",
    notes: "",
    recordedAt: ""
  });

  const [newGrowthForm, setNewGrowthForm] = useState({
    heightCm: "",
    weightKg: "",
    measuredAt: toDateTimeLocalValue(new Date().toISOString())
  });
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(
    growth?.measurements?.[growth.measurements.length - 1]?.id || ""
  );
  const selectedMeasurement = growth?.measurements?.find(
    (measurement) => measurement.id === selectedMeasurementId
  );
  const [editGrowthForm, setEditGrowthForm] = useState({
    heightCm: "",
    weightKg: "",
    measuredAt: ""
  });

  const [newExerciseForm, setNewExerciseForm] = useState({
    workoutType: "",
    durationMinutes: "",
    caloriesBurned: "",
    notes: "",
    performedAt: toDateTimeLocalValue(new Date().toISOString())
  });
  const [selectedExerciseLogId, setSelectedExerciseLogId] = useState(member.exerciseLogs?.[0]?.id || "");
  const selectedExerciseLog = member.exerciseLogs?.find((log) => log.id === selectedExerciseLogId);
  const [editExerciseForm, setEditExerciseForm] = useState({
    workoutType: "",
    durationMinutes: "",
    caloriesBurned: "",
    notes: "",
    performedAt: ""
  });

  useEffect(() => {
    if (!selectedRecord) {
      setEditRecordForm({ category: "", value: "", unit: "", notes: "", recordedAt: "" });
      return;
    }

    setEditRecordForm({
      category: selectedRecord.category,
      value: selectedRecord.value === null ? "" : String(selectedRecord.value),
      unit: selectedRecord.unit || "",
      notes: selectedRecord.notes || "",
      recordedAt: toDateTimeLocalValue(selectedRecord.recordedAt)
    });
  }, [selectedRecord]);

  useEffect(() => {
    if (!selectedMeasurement) {
      setEditGrowthForm({ heightCm: "", weightKg: "", measuredAt: "" });
      return;
    }

    setEditGrowthForm({
      heightCm: String(selectedMeasurement.heightCm ?? ""),
      weightKg: String(selectedMeasurement.weightKg ?? ""),
      measuredAt: toDateTimeLocalValue(selectedMeasurement.measuredAt)
    });
  }, [selectedMeasurement]);

  useEffect(() => {
    if (!selectedExerciseLog) {
      setEditExerciseForm({
        workoutType: "",
        durationMinutes: "",
        caloriesBurned: "",
        notes: "",
        performedAt: ""
      });
      return;
    }

    setEditExerciseForm({
      workoutType: selectedExerciseLog.workoutType,
      durationMinutes: String(selectedExerciseLog.durationMinutes ?? ""),
      caloriesBurned: String(selectedExerciseLog.caloriesBurned ?? ""),
      notes: selectedExerciseLog.notes || "",
      performedAt: toDateTimeLocalValue(selectedExerciseLog.performedAt)
    });
  }, [selectedExerciseLog]);

  async function runAction(action, successMessage) {
    setIsSaving(true);
    setError("");
    setMessage("");

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
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="新增健康紀錄" description="手動加入體重、心率、睡眠等資料。">
          <form
            className="space-y-4"
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
                placeholder="例如：weight、sleep、resting_heart_rate"
                value={newRecordForm.category}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
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
            <FieldLabel label="備註">
              <textarea
                className={`${baseInputClass} min-h-28 resize-y`}
                value={newRecordForm.notes}
                onChange={(event) =>
                  setNewRecordForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving}>新增健康紀錄</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="修改既有健康紀錄" description="選一筆現有紀錄再更新內容。">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  updateHealthRecord(member.id, selectedRecordId, {
                    ...editRecordForm,
                    recordedAt: new Date(editRecordForm.recordedAt).toISOString()
                  }),
                "健康紀錄已更新"
              );
            }}
          >
            <FieldLabel label="選擇紀錄">
              <select
                className={baseInputClass}
                value={selectedRecordId}
                onChange={(event) => setSelectedRecordId(event.target.value)}
              >
                {member.healthDataRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.category} / {new Date(record.recordedAt).toLocaleDateString("zh-HK")}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="類型">
              <input
                className={baseInputClass}
                value={editRecordForm.category}
                onChange={(event) =>
                  setEditRecordForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="數值">
                <input
                  className={baseInputClass}
                  value={editRecordForm.value}
                  onChange={(event) =>
                    setEditRecordForm((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </FieldLabel>
              <FieldLabel label="單位">
                <input
                  className={baseInputClass}
                  value={editRecordForm.unit}
                  onChange={(event) =>
                    setEditRecordForm((current) => ({ ...current, unit: event.target.value }))
                  }
                />
              </FieldLabel>
            </div>
            <FieldLabel label="記錄時間">
              <input
                type="datetime-local"
                className={baseInputClass}
                value={editRecordForm.recordedAt}
                onChange={(event) =>
                  setEditRecordForm((current) => ({ ...current, recordedAt: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="備註">
              <textarea
                className={`${baseInputClass} min-h-28 resize-y`}
                value={editRecordForm.notes}
                onChange={(event) =>
                  setEditRecordForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving || !member.healthDataRecords.length}>更新健康紀錄</SubmitButton>
          </form>
        </SectionCard>
      </div>
    );
  }

  function renderGrowthTab() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="新增成長測量" description="為 Ryan 新增最新身高和體重。">
          <form
            className="space-y-4"
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
            <SubmitButton disabled={isSaving}>新增成長數據</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="修改既有成長測量" description="選擇一筆歷史成長數據作更新。">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  updateGrowthMeasurement(member.id, selectedMeasurementId, {
                    ...editGrowthForm,
                    measuredAt: new Date(editGrowthForm.measuredAt).toISOString()
                  }),
                "成長數據已更新"
              );
            }}
          >
            <FieldLabel label="選擇測量">
              <select
                className={baseInputClass}
                value={selectedMeasurementId}
                onChange={(event) => setSelectedMeasurementId(event.target.value)}
              >
                {growth?.measurements?.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {new Date(entry.measuredAt).toLocaleDateString("zh-HK")} / {entry.heightCm} cm /{" "}
                    {entry.weightKg} kg
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="身高（cm）">
              <input
                className={baseInputClass}
                value={editGrowthForm.heightCm}
                onChange={(event) =>
                  setEditGrowthForm((current) => ({ ...current, heightCm: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="體重（kg）">
              <input
                className={baseInputClass}
                value={editGrowthForm.weightKg}
                onChange={(event) =>
                  setEditGrowthForm((current) => ({ ...current, weightKg: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="測量時間">
              <input
                type="datetime-local"
                className={baseInputClass}
                value={editGrowthForm.measuredAt}
                onChange={(event) =>
                  setEditGrowthForm((current) => ({ ...current, measuredAt: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving || !growth?.measurements?.length}>更新成長數據</SubmitButton>
          </form>
        </SectionCard>
      </div>
    );
  }

  function renderExerciseTab() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="新增運動紀錄" description="記錄 gym、running、cardio、strength training 等活動。">
          <form
            className="space-y-4"
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
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
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
            <FieldLabel label="備註">
              <textarea
                className={`${baseInputClass} min-h-28 resize-y`}
                value={newExerciseForm.notes}
                onChange={(event) =>
                  setNewExerciseForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving}>新增運動紀錄</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="修改既有運動紀錄" description="更新既有 workout 類型、時長和卡路里。">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () =>
                  updateExerciseLog(member.id, selectedExerciseLogId, {
                    ...editExerciseForm,
                    performedAt: new Date(editExerciseForm.performedAt).toISOString()
                  }),
                "運動紀錄已更新"
              );
            }}
          >
            <FieldLabel label="選擇運動紀錄">
              <select
                className={baseInputClass}
                value={selectedExerciseLogId}
                onChange={(event) => setSelectedExerciseLogId(event.target.value)}
              >
                {member.exerciseLogs?.map((log) => (
                  <option key={log.id} value={log.id}>
                    {log.workoutType} / {new Date(log.performedAt).toLocaleDateString("zh-HK")}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="運動類型">
              <input
                className={baseInputClass}
                value={editExerciseForm.workoutType}
                onChange={(event) =>
                  setEditExerciseForm((current) => ({ ...current, workoutType: event.target.value }))
                }
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="時長（分鐘）">
                <input
                  className={baseInputClass}
                  value={editExerciseForm.durationMinutes}
                  onChange={(event) =>
                    setEditExerciseForm((current) => ({
                      ...current,
                      durationMinutes: event.target.value
                    }))
                  }
                />
              </FieldLabel>
              <FieldLabel label="卡路里">
                <input
                  className={baseInputClass}
                  value={editExerciseForm.caloriesBurned}
                  onChange={(event) =>
                    setEditExerciseForm((current) => ({
                      ...current,
                      caloriesBurned: event.target.value
                    }))
                  }
                />
              </FieldLabel>
            </div>
            <FieldLabel label="運動時間">
              <input
                type="datetime-local"
                className={baseInputClass}
                value={editExerciseForm.performedAt}
                onChange={(event) =>
                  setEditExerciseForm((current) => ({ ...current, performedAt: event.target.value }))
                }
              />
            </FieldLabel>
            <FieldLabel label="備註">
              <textarea
                className={`${baseInputClass} min-h-28 resize-y`}
                value={editExerciseForm.notes}
                onChange={(event) =>
                  setEditExerciseForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </FieldLabel>
            <SubmitButton disabled={isSaving || !member.exerciseLogs?.length}>更新運動紀錄</SubmitButton>
          </form>
        </SectionCard>
      </div>
    );
  }

  function renderAppleHealthTab() {
    return (
      <SectionCard
        title="Apple Health 匯入"
        description="上傳 iPhone Health app 匯出的 XML 檔案，系統會匯入可識別的體重、步數、心率、睡眠和運動資料。"
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
              透過分頁管理不同資料類型，避免頁面內容過度擁擠。
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
