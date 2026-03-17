"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "../lib/i18n";

const STORAGE_KEY = "family-health-dismissed-reminders";

export function ReminderPanel({ reminders, lang = "zh" }) {
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      setDismissed(Array.isArray(saved) ? saved : []);
    } catch {
      setDismissed([]);
    }
  }, []);

  const visibleReminders = useMemo(
    () => (reminders || []).filter((reminder) => !dismissed.includes(reminder.title)),
    [reminders, dismissed]
  );

  function dismissReminder(title) {
    const next = [...dismissed, title];
    setDismissed(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        <div key={reminder.title} className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-amber-950">{reminder.title}</p>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">{reminder.detail}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm"
              onClick={() => dismissReminder(reminder.title)}
            >
              {t(lang, "稍後再看", "Dismiss")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
