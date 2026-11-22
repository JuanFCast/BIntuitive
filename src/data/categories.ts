import type { CategoryId } from "./questions";

export type Category = {
  id: CategoryId;
  slug: "places" | "numbers" | "colors";
  name: string;
  /** Dibujo de la ficha, en `public/art/hexagons/`. */
  image: string;
  description: string;
};

export type GameHexagon = {
  id:
    | "visual"
    | "typing"
    | "scramble"
    | "search"
    | "memory"
    | "tracing"
    | "coloring"
    | "bridge";
  name: string;
  /** Dibujo de la ficha, en `public/art/hexagons/`. */
  image: string;
  description: string;
  href: string;
  /**
   * Es de BIntuitive Plus. Hoy es solo una marca: sin pagos en las tiendas
   * no hay forma de comprar Plus, así que el juego se puede jugar igual. El
   * candado y la suscripción llegan con la fase de pagos.
   */
  plus?: boolean;
};

export type Hexagon = Category | GameHexagon;

/**
 * Los once del panal, categorías de preguntas y juegos por igual. Es la clave
 * con la que el progreso guarda la dificultad de cada actividad, así que sale
 * de aquí, que es la fuente de verdad de qué existe.
 */
export type GameId = Hexagon["id"];

export const categories: Category[] = [
  {
    id: "lugares",
    slug: "places",
    name: "Lugares",
    image: "/art/hexagons/lugares.png",
    description: "Playas, montañas y más",
  },
  {
    id: "numeros",
    slug: "numbers",
    name: "Números",
    image: "/art/hexagons/numeros.png",
    description: "Contar y comparar",
  },
  {
    id: "colores",
    slug: "colors",
    name: "Colores",
    image: "/art/hexagons/colores.png",
    description: "Rojo, azul, amarillo...",
  },
];

export const gameHexagons: GameHexagon[] = [
  {
    id: "visual",
    name: "Agilidad visual",
    image: "/art/hexagons/agilidad-visual.png",
    description: "Encuentra el símbolo en común",
    href: "/game/visual",
  },
  {
    id: "typing",
    name: "Type Rush",
    image: "/art/hexagons/type-rush.png",
    description: "Escribe rápido y con precisión",
    href: "/game/typing",
  },
  {
    id: "scramble",
    name: "Ordena la palabra",
    image: "/art/hexagons/ordena-la-palabra.png",
    description: "Ordena las letras y forma la palabra.",
    href: "/game/word-scramble",
  },
  {
    id: "search",
    name: "Sopa de letras",
    image: "/art/hexagons/sopa-de-letras.png",
    description: "Encuentra las palabras escondidas.",
    href: "/game/word-search",
  },
  {
    id: "memory",
    name: "Parejas",
    image: "/art/hexagons/parejas.png",
    description: "Destapa las fichas y encuentra las parejas.",
    href: "/game/memory",
  },
  {
    id: "tracing",
    name: "Trazos",
    image: "/art/hexagons/trazos.png",
    description: "Sigue el camino punteado con el dedo.",
    href: "/game/tracing",
  },
  {
    id: "coloring",
    name: "Colorear",
    image: "/art/hexagons/colorear.png",
    description: "Pinta cada zona del color que le toca.",
    href: "/game/coloring",
  },
  {
    id: "bridge",
    name: "Puente de palabras",
    image: "/art/hexagons/puente-de-palabras.svg",
    description: "Une cada palabra con su traducción.",
    href: "/game/word-bridge",
    plus: true,
  },
];

export const hexagons: Hexagon[] = [...categories, ...gameHexagons];

/**
 * El dibujo de una actividad, para las pantallas que la enseñan fuera del
 * panal: su introducción, su ayuda y la portada. Sale de aquí para que cada
 * juego no repita la ruta a mano.
 */
export function hexagonImage(id: GameId): string {
  const hexagon = hexagons.find((candidate) => candidate.id === id);
  if (!hexagon) throw new Error(`Hexágono desconocido: ${id}`);
  return hexagon.image;
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
