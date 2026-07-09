import Link from "next/link";
import Mascot from "@/components/Mascot";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/data/categories";

export const metadata = {
  title: "Elige tu mundo · Avíspate Kids",
};

export default function CategoriasPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-6 py-8">
      <header className="flex items-center gap-3">
        <Mascot expression="normal" size={72} />
        <h1 className="text-3xl font-extrabold text-ink sm:text-5xl">
          ¿A qué mundo vamos?
        </h1>
      </header>

      <div className="grid w-full max-w-3xl flex-1 grid-cols-1 content-center gap-5 sm:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-full border-2 border-ink/20 bg-white px-8 py-3 text-lg font-bold text-ink/70 shadow-sm transition-transform active:scale-95"
      >
        ⬅️ Volver
      </Link>
    </main>
  );
}
