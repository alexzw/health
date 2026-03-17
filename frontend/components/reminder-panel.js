"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  if (!visibleReminders.length) {
    return (
      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
        {t(lang, "目前沒有需要特別追趕的提醒，節奏維持得不錯。", "There are no overdue reminders right now. Your family is keeping a healthy rhythm.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleReminders.map((reminder) => (
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
      ))}
    </div>
  );
}
