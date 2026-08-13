"use client";

import Link from "next/link";
import { gameHexagons } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import { useLanguage } from "@/lib/i18n";

export default function GamesClient() {
  const { language, t } = useLanguage();

  return (
    <main className="relative min-h-full overflow-hidden bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="hive-ambient-cluster hive-ambient-cluster-left">
          <span className="hive-ambient hive-ambient-one" />
          <span className="hive-ambient hive-ambient-two" />
          <span className="hive-ambient hive-ambient-three" />
        </div>
        <div className="hive-ambient-cluster hive-ambient-cluster-right">
          <span className="hive-ambient hive-ambient-one" />
          <span className="hive-ambient hive-ambient-two" />
          <span className="hive-ambient hive-ambient-three" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <header className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#9b7400] sm:text-sm">
            BIntuitive
          </p>
          <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">
            {t("gamesHeading")}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base font-semibold text-ink/60 sm:text-lg">
            {t("gamesIntro")}
          </p>
        </header>

        <section
          className="mt-7 grid grid-cols-1 gap-4 sm:mt-9 sm:grid-cols-2 sm:gap-5"
          aria-label={t("gamesHeading")}
        >
          {gameHexagons.map((game, index) => {
            const localizedGame = localizeHexagon(game, language);
            const accentClass = index % 2 === 0
              ? "border-sky bg-skysoft"
              : "border-berry bg-berrysoft";

            return (
              <Link
                key={game.id}
                href={game.href}
                aria-label={t("openGameAria", { name: localizedGame.name })}
                className={`group flex min-h-40 items-center gap-4 rounded-3xl border-2 p-5 shadow-[0_10px_28px_rgba(74,56,0,0.08)] transition-transform active:scale-[0.98] sm:min-h-48 sm:p-6 ${accentClass}`}
              >
                <span
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.35rem] bg-white text-5xl shadow-sm sm:h-24 sm:w-24 sm:text-6xl"
                  aria-hidden="true"
                >
                  {localizedGame.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-extrabold leading-tight sm:text-3xl">
                    {localizedGame.name}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-ink/60 sm:text-base">
                    {localizedGame.description}
                  </span>
                </span>
                <span
                  className="text-2xl font-extrabold text-ink/40 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
