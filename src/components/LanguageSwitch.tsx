"use client";

import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

/**
 * El cambio de idioma de las pantallas públicas.
 *
 * Dentro de la aplicación el idioma se cambia en el menú de la cabecera, que
 * está en todas partes. La portada y los formularios de cuenta no llevan ese
 * marco, y quien llega por primera vez necesita poder leerlos en su idioma
 * antes de entrar a ninguna parte. Escribe en la misma preferencia global, así
 * que el idioma elegido aquí es el que se encuentra ya dentro.
 */
export default function LanguageSwitch({
  className = "",
}: {
  className?: string;
}) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("languageSwitchAria")}
      className={`flex items-center gap-1 rounded-full border-2 border-ink/10 bg-white p-1 shadow-sm ${className}`}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === language;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            aria-pressed={selected}
            className={`min-h-10 rounded-full px-3 text-sm font-extrabold transition-colors ${
              selected ? "bg-sun text-black" : "text-ink/55"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
