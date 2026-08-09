"use client";

import Link from "next/link";
import Mascot from "@/components/Mascot";
import CategoryCard from "@/components/CategoryCard";
import LanguageToggle from "@/components/LanguageToggle";
import { worlds } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

export default function CategoriesClient() {
  const { language, t } = useLanguage();

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-6 py-8">
      <div className="flex w-full max-w-3xl justify-end">
        <LanguageToggle />
      </div>

      <header className="flex items-center gap-3">
        <Mascot expression="normal" size={72} />
        <h1 className="text-3xl font-extrabold text-ink sm:text-5xl">
          {t("categoriesHeading")}
        </h1>
      </header>

      <div className="grid w-full max-w-5xl flex-1 grid-cols-1 content-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {worlds.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            language={language}
          />
        ))}
      </div>

      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-full border-2 border-ink/20 bg-white px-8 py-3 text-lg font-bold text-ink/70 shadow-sm transition-transform active:scale-95"
      >
        ⬅️ {t("back")}
      </Link>
    </main>
  );
}
