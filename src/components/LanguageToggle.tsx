"use client";

import { useLanguage } from "@/lib/i18n";

type LanguageToggleProps = {
  className?: string;
};

export default function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={t("switchLanguage")}
      title={t("switchLanguage")}
      className={`flex h-12 min-w-14 items-center justify-center gap-1 rounded-full border-2 border-ink/20 bg-white px-3 text-base font-extrabold text-ink shadow-sm transition-transform active:scale-90 ${className}`}
    >
      <span aria-hidden="true">🌐</span>
      <span>{language === "en" ? "ES" : "EN"}</span>
    </button>
  );
}
