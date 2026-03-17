"use client";

import { useMemo, useState } from "react";
import { formatRelativeDate } from "../lib/format";
import { t } from "../lib/i18n";

const FILTERS = ["all", "Ryan", "Alex", "Amelie"];

function getMilestoneAccent(type) {
  if (type === "growth") {
    return {
      bubble: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
      icon: "🌱"
    };
  }

  if (type === "weight") {
    return {
      bubble: "bg-sky-500",
      badge: "bg-sky-50 text-sky-700",
      icon: "⚖️"
    };
  }

  return {
    bubble: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700",
    icon: "🏃"
  };
}

export function MilestoneTimeline({ milestones, lang = "zh" }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleMilestones = useMemo(() => {
    if (activeFilter === "all") {
      return milestones || [];
    }

    return (milestones || []).filter((item) => item.member === activeFilter);
  }, [activeFilter, milestones]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          const label = filter === "all" ? t(lang, "全部成員", "All Members") : filter;

          return (
            <button
              key={filter}
              type="button"
              className={
                active
                  ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
              }
              onClick={() => setActiveFilter(filter)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6">
        {visibleMilestones.length ? (
          visibleMilestones.map((milestone) => (
            <div key={milestone.id} className="soft-card rounded-[30px] p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${getMilestoneAccent(milestone.type).bubble}`}>
                  {getMilestoneAccent(milestone.type).icon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {milestone.member}
                    </p>
                    <p className={`rounded-full px-3 py-1 text-xs font-semibold ${getMilestoneAccent(milestone.type).badge}`}>
                      {milestone.typeLabel || milestone.type}
                    </p>
                    {milestone.achievedAt ? (
                      <p className="text-xs font-medium text-slate-400">{formatRelativeDate(milestone.achievedAt, lang)}</p>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{milestone.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{milestone.detail}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="soft-card rounded-[30px] p-6 text-sm text-slate-600">
            {t(lang, "這位成員暫時未有 milestone，繼續記錄就會慢慢累積。", "This member does not have a milestone yet. Keep logging and the timeline will grow.")}
          </div>
        )}
      </div>
    </div>
  );
}
