import type { CategoryId } from "./questions";

export type Category = {
  id: CategoryId;
  slug: "places" | "numbers" | "colors";
  name: string;
  emoji: string;
  description: string;
};

export type GameHexagon = {
  id: "visual" | "typing" | "scramble";
  name: string;
  emoji: string;
  description: string;
  href: string;
};

export type Hexagon = Category | GameHexagon;

export const categories: Category[] = [
  {
    id: "lugares",
    slug: "places",
    name: "Lugares",
    emoji: "🏝️",
    description: "Playas, montañas y más",
  },
  {
    id: "numeros",
    slug: "numbers",
    name: "Números",
    emoji: "🔢",
    description: "Contar y comparar",
  },
  {
    id: "colores",
    slug: "colors",
    name: "Colores",
    emoji: "🎨",
    description: "Rojo, azul, amarillo...",
  },
];

export const gameHexagons: GameHexagon[] = [
  {
    id: "visual",
    name: "Agilidad visual",
    emoji: "👀",
    description: "Encuentra el símbolo en común",
    href: "/game/visual",
  },
  {
    id: "typing",
    name: "Type Rush",
    emoji: "⌨️",
    description: "Escribe rápido y con precisión",
    href: "/game/typing",
  },
  {
    id: "scramble",
    name: "Ordena la palabra",
    emoji: "🧩",
    description: "Ordena las letras y forma la palabra.",
    href: "/game/word-scramble",
  },
];

export const hexagons: Hexagon[] = [...categories, ...gameHexagons];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
