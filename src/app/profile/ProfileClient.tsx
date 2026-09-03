"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useLanguage } from "@/lib/i18n";
import { useMuted, useTextSize } from "@/lib/preferences";
import { clearProgress } from "@/lib/storage";

/**
 * Perfil. Las preferencias se editan en el menú de ajustes de la cabecera, que
 * es único; aquí solo se leen, para que la pantalla diga en qué estado está la
 * aplicación sin ser una segunda interfaz de edición.
 *
 * Es también donde vive lo que se hace con los datos guardados, que sin cuentas
 * se reduce a poder borrarlos.
 *
 * Cuando lleguen las cuentas y los perfiles infantiles, la identidad ocupará la
 * parte de arriba y esto pasará a ser secundario.
 */
export default function ProfileClient() {
  const { language, t } = useLanguage();
  const muted = useMuted();
  const textSize = useTextSize();
  const [resetOpen, setResetOpen] = useState(false);

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

        {/*
          Aparte y al final: borrar el progreso no es una acción del día a día,
          así que no comparte tarjeta con las preferencias ni se parece a ellas.
        */}
        <section className="mt-8" aria-labelledby="data-heading">
          <h2
            id="data-heading"
            className="px-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45"
          >
            {t("profileData")}
          </h2>
          <div className="mt-2 rounded-3xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-semibold leading-snug text-ink/55">
              {t("profileResetDescription")}
            </p>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="mt-3 min-h-12 w-full rounded-2xl border-2 border-coral bg-white px-4 text-base font-extrabold text-ink transition-colors active:bg-coralsoft sm:w-auto sm:px-6"
            >
              {t("profileReset")}
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        ariaLabel={t("resetDialogAria")}
        title={t("resetDialogTitle")}
        description={t("resetDialogMessage")}
        confirmLabel={t("profileReset")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          clearProgress();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
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
      {/* "Desactivado" o "Muy grande" no se aprietan: envuelven si hace falta. */}
      <span className="min-w-0 flex-1 break-words text-lg font-extrabold">
        {title}
      </span>
      <span className="min-w-0 break-words text-right text-base font-bold leading-snug text-ink/55">
        {value}
      </span>
    </div>
  );
}
