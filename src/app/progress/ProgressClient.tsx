"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hexagons, type Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import { getProgress, type Progress, type SessionSummary } from "@/lib/storage";
import { ROUNDS_PER_SESSION } from "@/lib/gameEngine";
import { WORD_SCRAMBLE_MAX_LEVEL } from "@/lib/wordScramble";
import { WORD_SEARCH_MAX_LEVEL } from "@/lib/wordSearch";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import type { Language } from "@/lib/language";

/** Cuántas sesiones se enseñan de las hasta cincuenta guardadas. */
const RECENT_SESSIONS = 5;

/** Lo que se puede decir hoy de una actividad, o nada si aún no hay dato. */
type ActivityProgress = { level: string; best?: string } | null;

export default function ProgressClient() {
  const { language, t } = useLanguage();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  // Vacío es no haber jugado a nada: ni lecciones, ni estrellas, ni niveles, ni
  // ninguno de los dos juegos de palabras. Enseñar ceros y "Nivel 1" a quien
  // acaba de llegar no informa de nada.
  const hasProgress = Boolean(
    progress &&
      (progress.sessions.length > 0 ||
        progress.totalStars > 0 ||
        Object.keys(progress.levelByCategory).length > 0 ||
        progress.wordScramble ||
        progress.wordPuzzle ||
        progress.wordSearch),
  );

  if (!progress) {
    return (
      <ProgressLayout t={t}>
        <div className="mt-7 h-44 animate-pulse rounded-3xl bg-white/60" />
      </ProgressLayout>
    );
  }

  if (!hasProgress) {
    return (
      <ProgressLayout t={t}>
        <section className="mt-7 rounded-3xl border-2 border-dashed border-sun bg-white/70 px-6 py-10 text-center shadow-sm sm:py-14">
          <span className="text-5xl" aria-hidden="true">
            🌱
          </span>
          <h2 className="mt-3 text-2xl font-extrabold">
            {t("progressEmptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md font-semibold text-ink/60">
            {t("progressEmptyText")}
          </p>
          <Link
            href="/hexagons"
            className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl border-b-8 border-[#9b7600] bg-sun px-8 py-3 text-xl font-extrabold text-black shadow-lg transition-transform active:scale-95 active:border-b-4"
          >
            {t("progressEmptyCta")}
          </Link>
        </section>
      </ProgressLayout>
    );
  }

  const recent = [...progress.sessions].reverse().slice(0, RECENT_SESSIONS);

  return (
    <ProgressLayout t={t}>
      <Section title={t("progressSummary")}>
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <SummaryStat
            icon="⭐"
            label={t("progressStars")}
            value={progress.totalStars}
          />
          <SummaryStat
            icon="🎯"
            label={t("progressLessons")}
            value={progress.sessions.length}
          />
        </div>
      </Section>

      <Section title={t("progressByActivity")}>
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
          {hexagons.map((hexagon, index) => (
            <ActivityRow
              key={hexagon.id}
              hexagon={hexagon}
              progress={progress}
              language={language}
              t={t}
              first={index === 0}
            />
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title={t("progressRecent")}>
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
            {recent.map((session, index) => (
              <SessionRow
                key={`${session.date}-${index}`}
                session={session}
                language={language}
                t={t}
                first={index === 0}
              />
            ))}
          </div>
        </Section>
      )}

      <p className="mt-5 text-center text-xs font-semibold text-ink/40 sm:text-sm">
        {t("progressLocalNote")}
      </p>
    </ProgressLayout>
  );
}

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

function ProgressLayout({
  t,
  children,
}: {
  t: Translate;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-full bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-5xl" aria-hidden="true">
            🏆
          </p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {t("progressHeading")}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base font-semibold text-ink/60 sm:text-lg">
            {t("progressIntro")}
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="px-1 pb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border-2 border-sun bg-white px-3 py-6 text-center shadow-sm sm:px-6 sm:py-8">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-bold text-ink/55 sm:text-base">{label}</p>
    </div>
  );
}

/**
 * Lo que se sabe de cada actividad, leído del progreso ya guardado.
 *
 * Devuelve `null` cuando no hay nada que contar, que ocurre en dos casos y
 * ambos se muestran igual: una actividad a la que todavía no se ha jugado, y
 * Agilidad visual y Type Rush, que por diseño no guardan nada. Ninguna de las
 * dos merece una tarjeta que hable de lo que falta.
 */
function readActivity(
  hexagon: Hexagon,
  progress: Progress,
  t: Translate,
): ActivityProgress {
  if (hexagon.id === "scramble") {
    const stored = progress.wordScramble ?? progress.wordPuzzle;
    if (!stored) return null;
    return {
      level: t("progressLevel", {
        level: stored.level,
        total: WORD_SCRAMBLE_MAX_LEVEL,
      }),
      best: t("progressBestScramble", { count: stored.bestPerfectWords }),
    };
  }

  if (hexagon.id === "search") {
    const stored = progress.wordSearch;
    if (!stored) return null;
    return {
      level: t("progressLevel", {
        level: stored.level,
        total: WORD_SEARCH_MAX_LEVEL,
      }),
      best: t("progressBestSearch", { count: stored.bestWordsFound }),
    };
  }

  // Las tres categorías de preguntas guardan su nivel en `levelByCategory`.
  if (!("href" in hexagon)) {
    const level = progress.levelByCategory[hexagon.id];
    if (level === undefined) return null;
    return {
      level: t("progressLevel", { level, total: 3 }),
    };
  }

  return null;
}

function ActivityRow({
  hexagon,
  progress,
  language,
  t,
  first,
}: {
  hexagon: Hexagon;
  progress: Progress;
  language: Language;
  t: Translate;
  first: boolean;
}) {
  const localized = localizeHexagon(hexagon, language);
  const activity = readActivity(hexagon, progress, t);

  return (
    <div
      className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
        first ? "" : "border-t border-ink/8"
      }`}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunsoft text-xl"
        aria-hidden="true"
      >
        {localized.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{localized.name}</span>
        {activity?.best && (
          <span className="mt-0.5 block text-sm font-semibold text-ink/50">
            {activity.best}
          </span>
        )}
      </span>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-sm font-extrabold ${
          activity
            ? "border-2 border-mint bg-mintsoft text-ink"
            : "border border-ink/10 bg-cream text-ink/45"
        }`}
      >
        {activity ? activity.level : t("progressKeepPlaying")}
      </span>
    </div>
  );
}

/**
 * Una sesión guardada. Solo existen para Lugares, Números y Colores: son las
 * únicas que llaman a `saveSession`. Los otros juegos no aparecen aquí porque
 * no hay sesiones suyas que enseñar, no porque se hayan omitido.
 */
function SessionRow({
  session,
  language,
  t,
  first,
}: {
  session: SessionSummary;
  language: Language;
  t: Translate;
  first: boolean;
}) {
  const category = hexagons.find((hexagon) => hexagon.id === session.category);
  const localized = category ? localizeHexagon(category, language) : null;
  const date = new Date(session.date);
  const day = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
        day: "numeric",
        month: "short",
      });

  return (
    <div
      className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
        first ? "" : "border-t border-ink/8"
      }`}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-skysoft text-xl"
        aria-hidden="true"
      >
        {localized?.emoji ?? "🎯"}
      </span>
      <span className="min-w-0 flex-1 truncate text-lg font-extrabold">
        {localized?.name ?? session.category}
      </span>
      {day && (
        <span className="shrink-0 text-sm font-semibold text-ink/45">{day}</span>
      )}
      <span
        className="shrink-0 rounded-full border-2 border-sun bg-sunsoft px-3 py-1 text-sm font-extrabold tabular-nums text-ink"
        aria-label={t("resultsStarsAria", {
          stars: session.stars,
          total: session.total || ROUNDS_PER_SESSION,
        })}
      >
        <span aria-hidden="true">
          ⭐ {session.stars}/{session.total || ROUNDS_PER_SESSION}
        </span>
      </span>
    </div>
  );
}
