import type { CategoryId } from "./questions";

export type Category = {
  id: CategoryId;
  slug: "places" | "numbers" | "colors";
  name: string;
  emoji: string;
  description: string;
  colorClass: string;
};

export type GameWorld = {
  id: "visual" | "typing";
  name: string;
  emoji: string;
  description: string;
  colorClass: string;
  href: string;
};

export type World = Category | GameWorld;

export const categories: Category[] = [
  {
    id: "lugares",
    slug: "places",
    name: "Lugares",
    emoji: "🏝️",
    description: "Playas, montañas y más",
    colorClass: "bg-skysoft border-sky",
  },
  {
    id: "numeros",
    slug: "numbers",
    name: "Números",
    emoji: "🔢",
    description: "Contar y comparar",
    colorClass: "bg-mintsoft border-mint",
  },
  {
    id: "colores",
    slug: "colors",
    name: "Colores",
    emoji: "🎨",
    description: "Rojo, azul, amarillo...",
    colorClass: "bg-sunsoft border-sun",
  },
];

export const gameWorlds: GameWorld[] = [
  {
    id: "visual",
    name: "Agilidad visual",
    emoji: "👀",
    description: "Encuentra el símbolo en común",
    colorClass: "bg-coralsoft border-coral",
    href: "/games/visual",
  },
  {
    id: "typing",
    name: "Type Rush",
    emoji: "⌨️",
    description: "Escribe rápido y con precisión",
    colorClass: "bg-berrysoft border-berry",
    href: "/games/typing",
  },
];

export const worlds: World[] = [...categories, ...gameWorlds];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
