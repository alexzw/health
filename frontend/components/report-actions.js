"use client";

import { useState } from "react";
import { t } from "../lib/i18n";

export function ReportActions({ shareText, lang = "zh" }) {
  const [feedback, setFeedback] = useState("");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t(lang, "家庭健康週報", "Family Health Report"),
          text: shareText
        });
        setFeedback(t(lang, "已打開分享面板。", "Share sheet opened."));
        return;
      } catch {
        setFeedback("");
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setFeedback(t(lang, "已複製週報摘要。", "Weekly summary copied."));
    } catch {
      setFeedback(t(lang, "暫時無法分享，請改用列印。", "Sharing is not available right now. Try print instead."));
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="button-primary px-5 py-3 text-sm font-semibold" onClick={handleShare}>
        {t(lang, "分享週報摘要", "Share Weekly Summary")}
      </button>
      <button type="button" className="button-secondary px-5 py-3 text-sm font-semibold" onClick={handlePrint}>
        {t(lang, "列印 / 匯出 PDF", "Print / Export PDF")}
      </button>
      {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
    </div>
  );
}
