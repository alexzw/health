"use client";

import { useRouter } from "next/navigation";
import { LANGUAGE_COOKIE, isEnglish } from "../lib/i18n";

function setLanguageCookie(lang) {
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ lang }) {
  const router = useRouter();
  const english = isEnglish(lang);

  function switchLanguage(nextLanguage) {
    setLanguageCookie(nextLanguage);
    router.refresh();
  }

  return (
    <div className="inline-flex rounded-full border border-white/80 bg-white/80 p-1 shadow-glass">
      <button
        type="button"
        onClick={() => switchLanguage("zh")}
        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
          english ? "text-slate-500" : "bg-ink text-white"
        }`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => switchLanguage("en")}
        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
          english ? "bg-ink text-white" : "text-slate-500"
        }`}
      >
        English
      </button>
    </div>
  );
}
