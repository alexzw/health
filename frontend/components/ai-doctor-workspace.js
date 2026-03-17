"use client";

import { useMemo, useState } from "react";
import { askCoachQuestion } from "../lib/api";
import { t } from "../lib/i18n";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

export function AiDoctorWorkspace({ members, lang = "zh" }) {
  const [activeMemberId, setActiveMemberId] = useState(members[0]?.id || "alex");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeMemberId) || members[0],
    [activeMemberId, members]
  );

  async function submitQuestion(nextQuestion) {
    if (!nextQuestion.trim() || !activeMember) {
      return;
    }

    setIsLoading(true);
    setError("");
    setMessages((current) => [...current, { role: "user", text: nextQuestion, memberId: activeMember.id }]);

    try {
      const result = await askCoachQuestion(activeMember.id, { question: nextQuestion, lang });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.reply.answer,
          followUp: result.reply.followUp,
          memberId: activeMember.id
        }
      ]);
      setQuestion("");
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="soft-card rounded-[32px] p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">{t(lang, "AI Health Assistant", "AI Health Assistant")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-ink">
              {t(lang, "用對話方式解讀家人健康數據", "Understand family health through guided questions")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {t(
                lang,
                "這個助理會結合 Ryan 的成長、Alex 和 Amelie 的體重趨勢、睡眠、步數與運動資料，用比較易明的方式解讀。",
                "This assistant interprets Ryan's growth, Alex and Amelie's weight trends, sleep, steps, and workouts in plain language."
              )}
            </p>
          </div>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">{t(lang, "使用提醒", "Disclaimer")}</p>
            <p>{t(lang, "這不是醫療建議。", "This is not medical advice.")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-5">
          <div className="soft-card rounded-[28px] p-6">
            <p className="section-kicker">{t(lang, "選擇對象", "Choose a Member")}</p>
            <div className="mt-4 grid gap-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    member.id === activeMemberId
                      ? "border-blue bg-blue/5 shadow-sm"
                      : "border-slate-200 bg-white/80"
                  }`}
                  onClick={() => setActiveMemberId(member.id)}
                >
                  <p className="text-sm font-semibold text-ink">{member.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                  <p className="mt-3 text-sm text-slate-600">{member.summary}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="soft-card rounded-[28px] p-6">
            <p className="section-kicker">{t(lang, "快速問題", "Quick Questions")}</p>
            <div className="mt-4 grid gap-3">
              {activeMember?.quickQuestions.map((quickQuestion) => (
                <button
                  key={quickQuestion}
                  type="button"
                  className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4 text-left text-sm leading-6 text-slate-700 transition hover:border-blue/30 hover:bg-blue/5"
                  onClick={() => submitQuestion(quickQuestion)}
                  disabled={isLoading}
                >
                  {quickQuestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[28px] p-6">
          <p className="section-kicker">{t(lang, "問答區", "Assistant Chat")}</p>
          <div className="mt-4 space-y-4">
            <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
              {messages.length ? (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-[24px] px-4 py-4 text-sm leading-6 ${
                      message.role === "user"
                        ? "ml-auto max-w-[85%] bg-blue text-white"
                        : "max-w-[92%] border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.followUp ? <p className="mt-3 text-slate-500">{message.followUp}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
                  {t(
                    lang,
                    "先揀一位家庭成員，再從左邊點一條快速問題，或者自己輸入一個問題。",
                    "Pick a family member first, then tap a quick question on the left, or type your own question."
                  )}
                </div>
              )}
            </div>

            <form
              className="rounded-[24px] border border-slate-200 bg-white/90 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitQuestion(question);
              }}
            >
              <label className="block text-sm font-medium text-slate-600">
                {t(lang, "自訂問題", "Custom Question")}
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t(
                    lang,
                    "例如：Ryan 最近身高進度正常嗎？Alex 體重下降是否太快？",
                    "Example: Is Ryan's recent height gain on track? Is Alex's weight dropping too quickly?"
                  )}
                />
              </label>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {t(lang, "回覆會根據現有健康資料生成。", "Answers are generated from the current family health data.")}
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                >
                  {isLoading ? t(lang, "分析中...", "Analyzing...") : t(lang, "送出問題", "Ask")}
                </button>
              </div>
              {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
