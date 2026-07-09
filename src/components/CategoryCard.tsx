import Link from "next/link";
import type { Category } from "@/data/categories";

type CategoryCardProps = {
  category: Category;
};

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/game?categoria=${category.id}`}
      className={`flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-4 p-6 shadow-lg transition-transform active:scale-95 sm:min-h-56 ${category.colorClass}`}
      aria-label={`Jugar al mundo de ${category.name}`}
    >
      <span aria-hidden="true" className="text-7xl sm:text-8xl">
        {category.emoji}
      </span>
      <span className="text-2xl font-extrabold text-ink sm:text-3xl">
        {category.name}
      </span>
      <span className="text-base font-semibold text-ink/60 sm:text-lg">
        {category.description}
      </span>
    </Link>
  );
}
