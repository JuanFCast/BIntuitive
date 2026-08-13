"use client";

import { useEffect, useState } from "react";
import { getProgress, type Progress } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

export default function ProgressClient() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const hasProgress = Boolean(progress?.sessions.length);

  return (
    <main className="min-h-full bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-5xl" aria-hidden="true">🏆</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {t("progressHeading")}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base font-semibold text-ink/60 sm:text-lg">
            {t("progressIntro")}
          </p>
        </header>

        <section className="mt-7" aria-live="polite" aria-busy={!progress}>
          {progress && hasProgress ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <ProgressStat
                icon="⭐"
                label={t("progressStars")}
                value={progress.totalStars}
              />
              <ProgressStat
                icon="🎯"
                label={t("progressLessons")}
                value={progress.sessions.length}
              />
            </div>
          ) : progress ? (
            <div className="rounded-3xl border-2 border-dashed border-sun bg-white/70 px-6 py-10 text-center shadow-sm sm:py-14">
              <span className="text-5xl" aria-hidden="true">🌱</span>
              <h2 className="mt-3 text-2xl font-extrabold">
                {t("progressEmptyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-md font-semibold text-ink/60">
                {t("progressEmptyText")}
              </p>
            </div>
          ) : (
            <div className="h-44 animate-pulse rounded-3xl bg-white/60" />
          )}
        </section>

        <p className="mt-5 text-center text-xs font-semibold text-ink/40 sm:text-sm">
          {t("progressLocalNote")}
        </p>
      </div>
    </main>
  );
}

function ProgressStat({
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
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-bold text-ink/55 sm:text-base">{label}</p>
    </div>
  );
}
