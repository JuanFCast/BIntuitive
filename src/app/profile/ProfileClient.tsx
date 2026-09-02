"use client";

import { useLanguage } from "@/lib/i18n";
import { useMuted, useTextSize } from "@/lib/preferences";

/**
 * Perfil. Las preferencias se editan en el menú de ajustes de la cabecera, que
 * es único; aquí solo se leen, para que la pantalla diga en qué estado está la
 * aplicación sin ser una segunda interfaz de edición.
 *
 * Cuando lleguen las cuentas y los perfiles infantiles, la identidad ocupará la
 * parte de arriba y este resumen pasará a ser secundario.
 */
export default function ProfileClient() {
  const { language, t } = useLanguage();
  const muted = useMuted();
  const textSize = useTextSize();

  const textSizeLabel = {
    normal: t("menuTextNormal"),
    large: t("menuTextLarge"),
    xlarge: t("menuTextXLarge"),
  }[textSize];

  return (
    <main className="min-h-full bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-sun bg-sunsoft text-4xl shadow-sm"
            aria-hidden="true"
          >
            👤
          </div>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            {t("profileHeading")}
          </h1>
          <p className="mt-2 text-base font-semibold text-ink/60 sm:text-lg">
            {t("profileIntro")}
          </p>
        </header>

        <section className="mt-7" aria-labelledby="preferences-heading">
          <h2
            id="preferences-heading"
            className="px-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45"
          >
            {t("profilePreferences")}
          </h2>
          <div className="mt-2 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
            <PreferenceRow
              icon="🌐"
              title={t("menuLanguage")}
              value={language === "en" ? "English" : "Español"}
            />
            <div className="mx-5 border-t border-ink/8" />
            <PreferenceRow
              icon="🔊"
              title={t("menuSound")}
              value={muted ? t("menuSoundOff") : t("menuSoundOn")}
            />
            <div className="mx-5 border-t border-ink/8" />
            <PreferenceRow
              icon="🔡"
              title={t("menuText")}
              value={textSizeLabel}
            />
          </div>
          <p className="mt-2 px-1 text-sm font-semibold text-ink/50">
            {t("profilePreferencesSummary")}
          </p>
        </section>
      </div>
    </main>
  );
}

function PreferenceRow({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunsoft text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-lg font-extrabold">{title}</span>
      <span className="shrink-0 text-base font-bold text-ink/55">{value}</span>
    </div>
  );
}
