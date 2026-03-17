"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatRelativeDate } from "../lib/format";
import { t } from "../lib/i18n";

const STORAGE_KEY = "family-health-reminder-state";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function loadReminderState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReminderState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ReminderPanel({ reminders, lang = "zh" }) {
  const [reminderState, setReminderState] = useState({});

  useEffect(() => {
    setReminderState(loadReminderState());
  }, []);

  const visibleReminders = useMemo(() => {
    const now = Date.now();
    return (reminders || []).filter((reminder) => {
      const state = reminderState[reminder.id];
      if (!state) {
        return true;
      }

      if (state.done) {
        return false;
      }

      if (state.snoozedUntil && new Date(state.snoozedUntil).getTime() > now) {
        return false;
      }

      return true;
    });
  }, [reminders, reminderState]);

  const archivedReminders = useMemo(() => {
    const byId = new Map((reminders || []).map((item) => [item.id, item]));
    return Object.entries(reminderState)
      .map(([id, state]) => {
        const reminder = byId.get(id);
        if (!reminder) {
          return null;
        }

        return {
          ...reminder,
          state
        };
      })
      .filter(Boolean)
      .filter((item) => item.state?.done || item.state?.snoozedUntil)
      .sort((left, right) => new Date(right.state.updatedAt || 0).getTime() - new Date(left.state.updatedAt || 0).getTime());
  }, [reminderState, reminders]);

  function updateReminder(id, nextValue) {
    const nextState = {
      ...reminderState,
      [id]: nextValue
    };
    setReminderState(nextState);
    saveReminderState(nextState);
  }

  function markDone(id) {
    updateReminder(id, { done: true, updatedAt: new Date().toISOString() });
  }

  function snoozeReminder(id) {
    updateReminder(id, {
      snoozedUntil: new Date(Date.now() + SNOOZE_MS).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  function restoreReminder(id) {
    const nextState = { ...reminderState };
    delete nextState[id];
    setReminderState(nextState);
    saveReminderState(nextState);
  }

  function restoreAll() {
    setReminderState({});
    saveReminderState({});
  }

  if (!visibleReminders.length && !archivedReminders.length) {
    return (
      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
        {t(lang, "目前沒有需要特別追趕的提醒，節奏維持得不錯。", "There are no overdue reminders right now. Your family is keeping a healthy rhythm.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleReminders.length ? (
        visibleReminders.map((reminder) => (
          <div key={reminder.id} className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80">{reminder.member}</p>
                  <p className="mt-2 text-base font-semibold text-amber-950">{reminder.title}</p>
                  <p className="mt-2 text-sm leading-6 text-amber-900/80">{reminder.detail}</p>
                </div>
                {reminder.ctaHref ? (
                  <Link href={reminder.ctaHref} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm">
                    {reminder.ctaLabel}
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-amber-950 px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={() => markDone(reminder.id)}
                >
                  {t(lang, "已完成", "Done")}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm"
                  onClick={() => snoozeReminder(reminder.id)}
                >
                  {t(lang, "延後一天", "Snooze 1 day")}
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
          {t(lang, "目前沒有需要立即處理的提醒。", "There are no reminders that need action right now.")}
        </div>
      )}

      {archivedReminders.length ? (
        <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{t(lang, "最近處理過的提醒", "Recently Managed Reminders")}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t(lang, "如果你想再次看到它們，可以在這裡恢復。", "Restore any reminder here if you want it to reappear.")}
              </p>
            </div>
            <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600" onClick={restoreAll}>
              {t(lang, "恢復全部", "Restore all")}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {archivedReminders.map((reminder) => (
              <div key={`${reminder.id}-archived`} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{reminder.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {reminder.state.done
                      ? t(lang, "已標記完成", "Marked as done")
                      : t(lang, "已延後一天", "Snoozed for 1 day")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatRelativeDate(reminder.state.updatedAt, lang)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                  onClick={() => restoreReminder(reminder.id)}
                >
                  {t(lang, "恢復", "Restore")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
