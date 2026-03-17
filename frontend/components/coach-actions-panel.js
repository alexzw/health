"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { askCoachQuestion, saveWeeklyGoal } from "../lib/api";
import { t } from "../lib/i18n";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

export function CoachActionsPanel({ memberId, lang = "zh", goals = [] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [askError, setAskError] = useState("");
  const [goalDrafts, setGoalDrafts] = useState(() =>
    Object.fromEntries(
      goals.map((goal) => [
        goal.id,
        {
          ...goal,
          targetValue: goal.targetValue ?? "",
          notes: goal.notes || ""
        }
      ])
    )
  );
  const [goalMessage, setGoalMessage] = useState("");
  const [goalError, setGoalError] = useState("");
  const [savingGoalId, setSavingGoalId] = useState("");

  useEffect(() => {
    setGoalDrafts(
      Object.fromEntries(
        goals.map((goal) => [
          goal.id,
          {
            ...goal,
            targetValue: goal.targetValue ?? "",
            notes: goal.notes || ""
          }
        ])
      )
    );
  }, [goals]);

  async function handleAsk(event) {
    event.preventDefault();
    if (!question.trim()) {
      setAskError(t(lang, "請先輸入問題", "Please enter a question first"));
      return;
    }
    setIsAsking(true);
    setAskError("");

    try {
      const result = await askCoachQuestion(memberId, { question, lang });
      setAnswer(result);
    } catch (error) {
      setAskError(error.message);
    } finally {
      setIsAsking(false);
    }
  }

  async function handleSaveGoal(goalId) {
    const draft = goalDrafts[goalId];
    setSavingGoalId(goalId);
    setGoalMessage("");
    setGoalError("");

    try {
      const savedGoal = await saveWeeklyGoal(memberId, {
        ...draft,
        targetValue: draft.targetValue
      });
      setGoalDrafts((current) => ({
        ...current,
        [goalId]: {
          ...current[goalId],
          ...savedGoal,
          targetValue: savedGoal.targetValue ?? "",
          notes: savedGoal.notes || ""
        }
      }));
      setGoalMessage(t(lang, "目標已更新", "Goal updated"));
      router.refresh();
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setSavingGoalId("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">
            {t(lang, "向教練提問", "Ask the Coach")}
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "有問題就直接問", "Ask a Direct Question")}
          </h3>
          <form className="mt-5 space-y-4" onSubmit={handleAsk}>
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t(
                lang,
                "例如：點解我減重停滯？Ryan 身高趨勢正常嗎？",
                "Example: Why is my weight loss stalled? Is Ryan's height trend okay?"
              )}
            />
            <button
              type="submit"
              disabled={isAsking}
              className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {isAsking ? t(lang, "思考中...", "Thinking...") : t(lang, "送出問題", "Ask")}
            </button>
          </form>
          {askError ? <p className="mt-3 text-sm text-rose-600">{askError}</p> : null}
          {answer?.reply ? (
            <div className="metric-band mt-5 rounded-[24px] p-5">
              <p className="text-sm font-semibold text-ink">{answer.reply.answer}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer.reply.followUp}</p>
            </div>
          ) : null}
        </div>

        <div className="soft-card rounded-[32px] p-7">
          <p className="section-kicker">
            {t(lang, "每週目標", "Weekly Goals")}
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {t(lang, "追蹤你而家最重要的事", "Track What Matters Now")}
          </h3>
          <div className="mt-5 space-y-4">
            {goals.map((goal) => {
              const draft = goalDrafts[goal.id];
              return (
                <div key={goal.id} className="metric-band rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{goal.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{goal.cadence}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t(lang, "完成度", "Progress")}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{goal.progressPercent ?? (draft.isCompleted ? 100 : 0)}%</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.isCompleted)}
                        onChange={(event) =>
                          setGoalDrafts((current) => ({
                            ...current,
                            [goal.id]: {
                              ...current[goal.id],
                              isCompleted: event.target.checked
                            }
                          }))
                        }
                      />
                      {t(lang, "已完成", "Done")}
                    </label>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue transition-all"
                        style={{ width: `${goal.progressPercent ?? (draft.isCompleted ? 100 : 0)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {t(lang, "目前進度", "Current progress")}: {goal.currentValue ?? 0}
                      {goal.unit ? ` / ${goal.targetValue} ${goal.unit}` : ` / ${goal.targetValue || 0}`}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[0.45fr_0.55fr]">
                    <label className="text-sm text-slate-500">
                      {t(lang, "目標數值", "Target")}
                      <input
                        className={inputClass.replace("mt-2 ", "")}
                        value={draft.targetValue}
                        onChange={(event) =>
                          setGoalDrafts((current) => ({
                            ...current,
                            [goal.id]: {
                              ...current[goal.id],
                              targetValue: event.target.value
                            }
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm text-slate-500">
                      {t(lang, "備註", "Notes")}
                      <input
                        className={inputClass.replace("mt-2 ", "")}
                        value={draft.notes}
                        onChange={(event) =>
                          setGoalDrafts((current) => ({
                            ...current,
                            [goal.id]: {
                              ...current[goal.id],
                              notes: event.target.value
                            }
                          }))
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={savingGoalId === goal.id}
                    onClick={() => handleSaveGoal(goal.id)}
                    className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {savingGoalId === goal.id ? t(lang, "保存中...", "Saving...") : t(lang, "保存目標", "Save Goal")}
                  </button>
                </div>
              );
            })}
          </div>
          {goalMessage ? <p className="mt-3 text-sm text-emerald-700">{goalMessage}</p> : null}
          {goalError ? <p className="mt-3 text-sm text-rose-600">{goalError}</p> : null}
        </div>
      </div>
    </section>
  );
}
