import type { CategoryId } from "./questions";

export type Category = {
  id: CategoryId;
  name: string;
  emoji: string;
  description: string;
  colorClass: string;
};

export const categories: Category[] = [
  {
    id: "lugares",
    name: "Lugares",
    emoji: "🏝️",
    description: "Playas, montañas y más",
    colorClass: "bg-skysoft border-sky",
  },
  {
    id: "numeros",
    name: "Números",
    emoji: "🔢",
    description: "Contar y comparar",
    colorClass: "bg-mintsoft border-mint",
  },
  {
    id: "colores",
    name: "Colores",
    emoji: "🎨",
    description: "Rojo, azul, amarillo...",
    colorClass: "bg-sunsoft border-sun",
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
