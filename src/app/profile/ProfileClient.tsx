"use client";

import LanguageToggle from "@/components/LanguageToggle";
import MuteButton from "@/components/MuteButton";
import { useLanguage } from "@/lib/i18n";

export default function ProfileClient() {
  const { t } = useLanguage();

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
              title={t("profileLanguage")}
              description={t("profileLanguageDescription")}
              control={<LanguageToggle />}
            />
            <div className="mx-5 border-t border-ink/8" />
            <PreferenceRow
              icon="🔊"
              title={t("profileSound")}
              description={t("profileSoundDescription")}
              control={<MuteButton />}
            />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-extrabold">{t("profileAbout")}</h2>
          <p className="mt-1.5 font-semibold leading-relaxed text-ink/60">
            {t("profileAboutDescription")}
          </p>
        </section>
      </div>
    </main>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  control,
}: {
  icon: string;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunsoft text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{title}</span>
        <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink/50">
          {description}
        </span>
      </span>
      {control}
    </div>
  );
}
