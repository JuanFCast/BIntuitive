import Link from "next/link";
import type { World } from "@/data/categories";
import { localizeCategory } from "@/data/localization";
import type { Language } from "@/lib/language";

type CategoryCardProps = {
  category: World;
  language: Language;
};

export default function CategoryCard({ category, language }: CategoryCardProps) {
  const localizedCategory = localizeCategory(category, language);
  const href = "href" in category ? category.href : `/game?world=${category.slug}`;

  return (
    <Link
      href={href}
      className={`flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-4 p-6 shadow-lg transition-transform active:scale-95 sm:min-h-56 ${category.colorClass}`}
      aria-label={
        language === "en"
          ? `Play in the ${localizedCategory.name} world`
          : `Jugar al mundo de ${localizedCategory.name}`
      }
    >
      <span aria-hidden="true" className="text-7xl sm:text-8xl">
        {localizedCategory.emoji}
      </span>
      <span className="text-2xl font-extrabold text-ink sm:text-3xl">
        {localizedCategory.name}
      </span>
      <span className="text-base font-semibold text-ink/60 sm:text-lg">
        {localizedCategory.description}
      </span>
    </Link>
  );
}
