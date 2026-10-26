import type { Difficulty, Stars } from "./difficulty";
import type { Language } from "./language";

/**
 * Colorear: lógica pura del décimo hexágono.
 *
 * El juego pide pintar zonas de un dibujo, y lo pide de dos maneras según el
 * escalón. En el 1 y el 2 lo dice en voz alta —"pinta el techo de rojo"— y va
 * zona por zona: no hace falta reconocer cifras, así que sirve desde los tres
 * años y lo que se practica es el nombre del color. Del 3 al 5 cada zona lleva
 * un número y la paleta dice qué color es cada número, así que hay que
 * emparejar cifra y color y se puede pintar en el orden que se quiera. Es el
 * mismo juego creciendo con el niño, y es lo que hace que los cinco escalones
 * sean cinco cosas distintas y no el mismo ejercicio con más piezas.
 *
 * Los dibujos son geometría a propósito: una casa son un triángulo y unos
 * rectángulos, y eso es exactamente lo que un camino SVG escrito a mano sabe
 * hacer bien. Las ilustraciones de Colores tuvieron que venir de fuera porque
 * un flamenco no es geometría; una página de colorear sí.
 *
 * **Se pinta pasando el dedo o el Apple Pencil, con el grosor que se elija.**
 * No es adorno: un toque que rellenaba la zona entera convertía colorear en
 * señalar, que es lo que ya hacen las lecciones de preguntas. Arrastrando, la
 * mano trabaja —el mismo gesto que Trazos, sin la exigencia de seguir un
 * camino— y elegir el grosor es la primera decisión de herramienta que toma
 * quien juega. La pintura solo agarra **dentro** de la zona, así que salirse
 * no estropea el dibujo: eso es lo que permite dárselo a un niño de tres años
 * con el dedo. Y una zona queda lista cuando está cubierta de sobra
 * (`coverageToFill` de cada escalón), no cuando está perfecta: pedir el 100 %
 * castigaría el pulso, que no es lo que este juego mide.
 *
 * Los colores **no se guardan en el dibujo**: se reparten al empezar cada
 * sesión desde la paleta del escalón. Así la misma casa sale distinta cada vez
 * y repetir un nivel no es repetir la misma lámina, que es lo que permite que
 * el banco sea pequeño sin que el juego se agote.
 */

export const COLORING_MAX_LEVEL = 5;

/** Cuántos dibujos tiene una sesión. */
export const COLORING_PICTURES_PER_SESSION = 2;

export type ColoringLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Cómo se pide la zona que toca pintar.
 *
 * `spoken` la nombra, una cada vez y en orden; `key` numera todas las zonas y
 * deja elegir. No es solo presentación: en `spoken` el juego lleva el turno y
 * en `key` lo lleva el niño.
 */
export type ColoringMode = "spoken" | "key";

export type ColorId =
  | "rojo"
  | "azul"
  | "amarillo"
  | "verde"
  | "naranja"
  | "morado"
  | "rosado"
  | "cafe";

/**
 * Los colores que se enseñan, no los de la marca.
 *
 * Son los mismos valores que usan los dibujos de la categoría Colores en
 * `public/art/colors/`: si aquí se cambia un tono, allí hay que cambiarlo
 * también, porque un niño que aprende "azul" en una pantalla tiene que ver
 * ese mismo azul en la otra. La paleta pastel de la interfaz (`sky`, `coral`)
 * no sirve para esto: `sky` es un celeste y `coral` un salmón.
 *
 * Ninguno es blanco ni negro a propósito: sobre el papel blanco del dibujo,
 * el blanco no se ve pintado y el negro tapa el contorno.
 */
export const COLORING_COLORS: Record<
  ColorId,
  { hex: string; label: Record<Language, string> }
> = {
  rojo: { hex: "#e23b2e", label: { en: "red", es: "rojo" } },
  azul: { hex: "#1f6fd0", label: { en: "blue", es: "azul" } },
  amarillo: { hex: "#f5c518", label: { en: "yellow", es: "amarillo" } },
  verde: { hex: "#3ea757", label: { en: "green", es: "verde" } },
  naranja: { hex: "#f07c1f", label: { en: "orange", es: "naranja" } },
  morado: { hex: "#8e44c8", label: { en: "purple", es: "morado" } },
  rosado: { hex: "#f58ab8", label: { en: "pink", es: "rosado" } },
  cafe: { hex: "#8b5a2b", label: { en: "brown", es: "café" } },
};

/**
 * Qué cambia en cada escalón: cómo se pide la zona y con cuántos colores
 * distintos se reparte el dibujo.
 *
 * Cuántas zonas tiene el dibujo lo dice el dibujo, no el escalón: por eso cada
 * lámina declara a qué nivel pertenece y el banco crece por ahí.
 *
 * Los colores del 1 al 3 son los primarios más el verde, que son los que un
 * niño reconoce antes; los escalones altos añaden los que se confunden entre
 * sí —morado con azul, rosado con rojo, naranja con amarillo— y esa confusión
 * es justo la dificultad.
 *
 * La mano también pide más al subir, pero sin castigar nunca salirse: la
 * pintura sigue recortada a la zona en todos los escalones. Lo que cambia es
 * cuánto hay que cubrir antes de que la zona se rellene sola
 * (`coverageToFill`) y, del 4 en adelante, que el pincel grueso desaparece:
 * con él dos pasadas tapaban casi cualquier zona y el escalón alto se
 * terminaba tan deprisa como el primero. El 1 y el 2 se quedan como estaban,
 * porque son los del niño de tres años con el dedo.
 */
export const COLORING_LEVELS: Record<
  ColoringLevel,
  {
    mode: ColoringMode;
    palette: readonly ColorId[];
    brushes: readonly ColoringBrushId[];
    coverageToFill: number;
  }
> = {
  1: {
    mode: "spoken",
    palette: ["rojo", "azul", "amarillo"],
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.7,
  },
  2: {
    mode: "spoken",
    palette: ["rojo", "azul", "amarillo", "verde"],
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.7,
  },
  3: {
    mode: "key",
    palette: ["rojo", "azul", "amarillo", "verde"],
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.75,
  },
  4: {
    mode: "key",
    palette: ["rojo", "azul", "amarillo", "verde", "naranja"],
    brushes: ["fino", "medio"],
    coverageToFill: 0.8,
  },
  5: {
    mode: "key",
    palette: ["rojo", "azul", "verde", "naranja", "morado", "rosado"],
    brushes: ["fino", "medio"],
    coverageToFill: 0.85,
  },
};

export function clampColoringLevel(level: number): ColoringLevel {
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= COLORING_MAX_LEVEL) return COLORING_MAX_LEVEL;
  return rounded as ColoringLevel;
}

/* ───────────────────────── El pincel ─────────────────────────── */

export type ColoringBrushId = "fino" | "medio" | "grueso";

/**
 * Los tres grosores, con su radio en el lienzo de 100 × 100 del dibujo.
 *
 * Tres y no un deslizador continuo: un deslizador es un gesto fino —justo el
 * que un niño de tres años todavía no tiene— y además no se puede nombrar en
 * voz alta ni leer con un lector de pantalla. Tres botones sí.
 *
 * Los radios están elegidos contra las zonas de verdad, no al azar: la franja
 * más estrecha del arcoíris mide 10 de lado a lado, así que el grueso (19 de
 * diámetro) la cubre de una pasada, el medio pide dos y el fino sirve para la
 * ventana y las ruedas. Ninguno estropea nada por grande, porque la pintura se
 * recorta a la zona.
 */
export const COLORING_BRUSHES: readonly {
  id: ColoringBrushId;
  radius: number;
}[] = [
  { id: "fino", radius: 3.5 },
  { id: "medio", radius: 6 },
  { id: "grueso", radius: 9.5 },
];

/** El de en medio: cubre rápido sin pasarse de las zonas pequeñas. */
export const COLORING_DEFAULT_BRUSH: ColoringBrushId = "medio";

export function coloringBrushRadius(id: ColoringBrushId): number {
  const brush = COLORING_BRUSHES.find((option) => option.id === id);
  return brush ? brush.radius : COLORING_BRUSHES[1].radius;
}

/** Los grosores que ofrece un escalón, en el mismo orden de menor a mayor. */
export function coloringBrushesForLevel(
  level: ColoringLevel,
): readonly { id: ColoringBrushId; radius: number }[] {
  const allowed = COLORING_LEVELS[level].brushes;
  return COLORING_BRUSHES.filter((brush) => allowed.includes(brush.id));
}

/* ──────────────────── Cuánto hay pintado ─────────────────────── */

export type ColoringPoint = { x: number; y: number };

/**
 * El paso de la rejilla con la que se mide una zona, en el lienzo de 100.
 *
 * Medir leyendo los píxeles del lienzo costaría una copia de memoria por cada
 * movimiento del dedo; esto es geometría y no lee nada: se siembra la zona de
 * puntos una vez por lámina y luego cada tramo de pincel marca los que le
 * caen debajo. Con paso 2 la zona más pequeña del banco sigue teniendo
 * decenas de puntos, que es resolución de sobra para umbrales de entre el
 * 70 % y el 85 %.
 */
export const COLORING_SAMPLE_STEP = 2;

/**
 * Lo que tiene que moverse el dedo para que cuente como tramo nuevo, en el
 * lienzo de 100. Un Apple Pencil manda cientos de puntos por segundo y casi
 * pegados: sin este mínimo, un trazo de dos segundos guarda miles de puntos
 * que luego hay que repintar enteros al girar el iPad.
 */
export const COLORING_MIN_STEP = 0.4;

/**
 * Siembra el lienzo de 100 × 100 de puntos y devuelve los que caen dentro.
 *
 * Recibe el "está dentro" en vez de calcularlo porque quien sabe si un punto
 * cae dentro de un camino SVG es el navegador (`isPointInPath`), y este
 * archivo no puede depender de él: `validate:content` lo compila sin las
 * librerías del DOM justo para que el contenido no acabe importando código de
 * navegador.
 *
 * Los puntos van en el centro de cada celda y no en sus esquinas: en el borde
 * exacto de un camino, "dentro" depende del redondeo.
 */
export function coloringSampleGrid(
  isInside: (x: number, y: number) => boolean,
  step: number = COLORING_SAMPLE_STEP,
): ColoringPoint[] {
  const samples: ColoringPoint[] = [];
  for (let y = step / 2; y < 100; y += step) {
    for (let x = step / 2; x < 100; x += step) {
      if (isInside(x, y)) samples.push({ x, y });
    }
  }
  return samples;
}

/**
 * Si un tramo de pincel —de `from` a `to`, con ese radio— tapa el punto.
 *
 * Es la distancia del punto al segmento, que es exactamente la forma que deja
 * un pincel redondo arrastrado en línea recta. El dedo manda muchos puntos
 * seguidos, así que la unión de los tramos es el trazo entero.
 */
export function coloringStrokeCovers(
  sample: ColoringPoint,
  from: ColoringPoint,
  to: ColoringPoint,
  radius: number,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;

  // Un toque sin arrastre es un segmento de longitud cero: un círculo.
  let along = 0;
  if (lengthSquared > 0) {
    along =
      ((sample.x - from.x) * dx + (sample.y - from.y) * dy) / lengthSquared;
    along = Math.max(0, Math.min(1, along));
  }

  const nearestX = from.x + along * dx;
  const nearestY = from.y + along * dy;
  return Math.hypot(sample.x - nearestX, sample.y - nearestY) <= radius;
}

/**
 * La parte cubierta de una zona, de 0 a 1.
 *
 * Una zona sin un solo punto de muestra —no hay ninguna hoy, pero una lámina
 * nueva podría traerla— se cuenta como cubierta en cuanto se la toca: mejor
 * eso que una zona imposible de terminar.
 */
export function coloringCoverage(covered: number, total: number): number {
  if (total === 0) return 1;
  return covered / total;
}

/**
 * Si la zona ya está cubierta de sobra para su escalón y toca rellenarla
 * entera.
 *
 * El umbral (`coverageToFill`) va del 70 % al 85 %: por debajo se vería a
 * medio hacer, y el 100 % obligaría a repasar los rincones del contorno con el
 * pincel fino, que mide el pulso y no el color. Al llegar al umbral la zona se
 * rellena entera y sola, así que el dibujo terminado siempre queda limpio.
 */
export function coloringRegionIsFull(
  covered: number,
  total: number,
  level: ColoringLevel,
): boolean {
  return coloringCoverage(covered, total) >= COLORING_LEVELS[level].coverageToFill;
}

/**
 * La decisión que se está tomando: pintar **esta** zona de **este** color.
 *
 * Es lo que cuenta la precisión, y cuenta una sola vez: cubrir una zona pide
 * varias pasadas del dedo, y cobrar cada pasada como un intento habría hecho
 * que pintar bien con el pincel fino puntuara peor que pintar bien con el
 * grueso. Equivocarse también se cuenta una vez por pareja, así que seguir
 * frotando con el color que no era no hunde la sesión: lo que se mide es
 * haber elegido mal, no cuánto tardó en notarse.
 */
export function coloringAttemptKey(regionId: string, colorId: ColorId): string {
  return `${regionId}:${colorId}`;
}

/**
 * Una zona del dibujo: su camino y cómo se llama.
 *
 * El nombre no es decoración: en los escalones hablados es lo que se dice en
 * voz alta, y en todos es el nombre accesible del botón. Una zona sin nombre
 * no se podría ni pedir ni leer.
 */
export type ColoringRegion = {
  id: string;
  /** Camino SVG en un lienzo de 100 × 100. */
  path: string;
  label: Record<Language, string>;
  /**
   * Dónde se pinta el número de la zona en los escalones numerados.
   *
   * Va escrito a mano y es obligatorio porque el centro de la caja del camino
   * no sirve: en una banda del arcoíris cae en el hueco del arco, en los
   * pétalos cae sobre el centro de la flor —que es otra zona— y en las dos
   * ruedas del tren cae entre ellas, en el aire. Exigirlo obliga a mirar
   * dónde cae antes de añadir una lámina nueva.
   */
  labelAt: { x: number; y: number };
};

/**
 * Una lámina.
 *
 * Tiene la forma de una fila de base de datos —id, nivel, nombre y zonas— por
 * lo mismo que los ejercicios de Trazos: para que el día que el contenido
 * venga de una tabla haya que cambiar de dónde sale, no el juego.
 */
export type ColoringPicture = {
  id: string;
  level: ColoringLevel;
  name: Record<Language, string>;
  /**
   * En orden de pintado, que es también el orden en que se dibujan: una zona
   * posterior puede montarse encima de otra —la puerta sobre la pared—. Dos
   * zonas seguidas nunca reciben el mismo color, así que el orden vale además
   * como orden de vecindad.
   */
  regions: ColoringRegion[];
};

export const COLORING_PICTURES: ColoringPicture[] = [
  // ─── Nivel 1: tres zonas ──────────────────────────────────
  {
    id: "casa",
    level: 1,
    name: { en: "House", es: "Casa" },
    regions: [
      {
        id: "techo",
        path: "M50 10 L92 44 L8 44 Z",
        label: { en: "the roof", es: "el techo" },
        labelAt: { x: 50, y: 33 },
      },
      {
        id: "pared",
        path: "M16 44 H84 V92 H16 Z",
        label: { en: "the wall", es: "la pared" },
        labelAt: { x: 26, y: 56 },
      },
      {
        id: "puerta",
        path: "M40 62 H60 V92 H40 Z",
        label: { en: "the door", es: "la puerta" },
        labelAt: { x: 50, y: 79 },
      },
    ],
  },
  {
    id: "arbol",
    level: 1,
    name: { en: "Tree", es: "Árbol" },
    regions: [
      {
        id: "copa",
        path: "M50 8 C76 8 90 28 83 47 C77 62 60 67 50 67 C40 67 23 62 17 47 C10 28 24 8 50 8 Z",
        label: { en: "the leaves", es: "las hojas" },
        labelAt: { x: 50, y: 36 },
      },
      {
        id: "tronco",
        path: "M41 62 H59 V88 H41 Z",
        label: { en: "the trunk", es: "el tronco" },
        labelAt: { x: 50, y: 75 },
      },
      {
        id: "suelo",
        path: "M4 88 H96 V97 H4 Z",
        label: { en: "the ground", es: "el suelo" },
        labelAt: { x: 50, y: 93 },
      },
    ],
  },
  {
    id: "pez",
    level: 1,
    name: { en: "Fish", es: "Pez" },
    regions: [
      {
        id: "cuerpo",
        path: "M18 52 C18 34 38 25 58 30 C72 34 80 43 80 52 C80 61 72 70 58 74 C38 79 18 70 18 52 Z",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: { x: 44, y: 55 },
      },
      {
        id: "cola",
        path: "M79 52 L97 32 V72 Z",
        label: { en: "the tail", es: "la cola" },
        labelAt: { x: 88, y: 52 },
      },
      {
        id: "aleta",
        // Se monta sobre el cuerpo a propósito: dibujada justo encima del
        // lomo parecía un plátano suelto flotando sobre el pez.
        path: "M38 36 C44 14 64 12 71 29 C60 27 47 30 38 36 Z",
        label: { en: "the fin", es: "la aleta" },
        labelAt: { x: 54, y: 25 },
      },
    ],
  },

  // ─── Nivel 2: cuatro zonas ────────────────────────────────
  {
    id: "flor",
    level: 2,
    name: { en: "Flower", es: "Flor" },
    regions: [
      {
        id: "petalos",
        path: [
          "M57 36 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
          "M46 55 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
          "M26 55 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
          "M15 36 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
          "M26 17 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
          "M46 17 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
        ].join(" "),
        label: { en: "the petals", es: "los pétalos" },
        labelAt: { x: 50, y: 17 },
      },
      {
        id: "centro",
        path: "M36 36 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z",
        label: { en: "the middle", es: "el centro" },
        labelAt: { x: 50, y: 36 },
      },
      {
        id: "tallo",
        path: "M45 54 H55 V94 H45 Z",
        label: { en: "the stem", es: "el tallo" },
        labelAt: { x: 50, y: 78 },
      },
      {
        id: "hoja",
        path: "M55 70 C72 60 86 70 81 83 C66 88 57 80 55 70 Z",
        label: { en: "the leaf", es: "la hoja" },
        labelAt: { x: 68, y: 74 },
      },
    ],
  },
  {
    id: "barco",
    level: 2,
    name: { en: "Boat", es: "Barco" },
    regions: [
      {
        id: "vela-grande",
        path: "M53 14 L84 66 H53 Z",
        label: { en: "the big sail", es: "la vela grande" },
        labelAt: { x: 66, y: 53 },
      },
      {
        id: "vela-pequena",
        path: "M47 24 L20 66 H47 Z",
        label: { en: "the small sail", es: "la vela pequeña" },
        labelAt: { x: 36, y: 55 },
      },
      {
        id: "casco",
        path: "M8 68 H92 L80 88 H20 Z",
        label: { en: "the hull", es: "el casco" },
        labelAt: { x: 50, y: 78 },
      },
      {
        id: "mar",
        path: "M2 88 H98 V98 H2 Z",
        label: { en: "the sea", es: "el mar" },
        labelAt: { x: 50, y: 93 },
      },
    ],
  },
  {
    id: "cohete",
    level: 2,
    name: { en: "Rocket", es: "Cohete" },
    regions: [
      {
        id: "punta",
        path: "M50 4 C63 17 68 28 68 36 H32 C32 28 37 17 50 4 Z",
        label: { en: "the nose", es: "la punta" },
        labelAt: { x: 50, y: 26 },
      },
      {
        id: "cuerpo",
        path: "M32 36 H68 V80 H32 Z",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: { x: 50, y: 70 },
      },
      {
        id: "aletas",
        path: "M32 56 L14 88 H32 Z M68 56 L86 88 H68 Z",
        label: { en: "the fins", es: "las aletas" },
        labelAt: { x: 23, y: 80 },
      },
      {
        id: "ventana",
        path: "M39 50 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z",
        label: { en: "the window", es: "la ventana" },
        labelAt: { x: 50, y: 50 },
      },
    ],
  },

  // ─── Nivel 3: cinco zonas ─────────────────────────────────
  {
    id: "mariposa",
    level: 3,
    name: { en: "Butterfly", es: "Mariposa" },
    regions: [
      {
        id: "ala-sup-izq",
        path: "M46 32 C30 6 6 10 8 30 C10 46 30 52 46 50 Z",
        label: { en: "the top left wing", es: "el ala de arriba a la izquierda" },
        labelAt: { x: 26, y: 32 },
      },
      {
        id: "ala-sup-der",
        path: "M54 32 C70 6 94 10 92 30 C90 46 70 52 54 50 Z",
        label: { en: "the top right wing", es: "el ala de arriba a la derecha" },
        labelAt: { x: 74, y: 32 },
      },
      {
        id: "ala-inf-izq",
        path: "M46 54 C31 51 12 58 17 76 C22 90 41 84 46 72 Z",
        label: { en: "the bottom left wing", es: "el ala de abajo a la izquierda" },
        labelAt: { x: 30, y: 68 },
      },
      {
        id: "ala-inf-der",
        path: "M54 54 C69 51 88 58 83 76 C78 90 59 84 54 72 Z",
        label: { en: "the bottom right wing", es: "el ala de abajo a la derecha" },
        labelAt: { x: 70, y: 68 },
      },
      {
        id: "cuerpo",
        path: "M45 22 H55 V80 C55 88 45 88 45 80 Z",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: { x: 50, y: 78 },
      },
    ],
  },
  {
    id: "tren",
    level: 3,
    name: { en: "Train", es: "Tren" },
    regions: [
      {
        id: "cuerpo",
        path: "M8 48 H62 V76 H8 Z",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: { x: 34, y: 62 },
      },
      {
        id: "cabina",
        path: "M62 30 H90 V76 H62 Z",
        label: { en: "the cabin", es: "la cabina" },
        labelAt: { x: 76, y: 52 },
      },
      {
        id: "chimenea",
        path: "M16 26 H34 V48 H16 Z",
        label: { en: "the chimney", es: "la chimenea" },
        labelAt: { x: 25, y: 37 },
      },
      {
        id: "ruedas",
        path: "M14 82 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M64 82 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z",
        label: { en: "the wheels", es: "las ruedas" },
        labelAt: { x: 25, y: 82 },
      },
      {
        id: "via",
        path: "M2 92 H98 V98 H2 Z",
        label: { en: "the track", es: "la vía" },
        labelAt: { x: 50, y: 95 },
      },
    ],
  },

  // ─── Nivel 4: seis zonas ──────────────────────────────────
  {
    id: "casa-grande",
    level: 4,
    name: { en: "Big house", es: "Casa grande" },
    regions: [
      {
        id: "sol",
        path: "M72 18 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z",
        label: { en: "the sun", es: "el sol" },
        labelAt: { x: 84, y: 18 },
      },
      {
        id: "techo",
        path: "M50 8 L93 42 L7 42 Z",
        label: { en: "the roof", es: "el techo" },
        labelAt: { x: 50, y: 32 },
      },
      {
        id: "pared",
        path: "M15 42 H85 V93 H15 Z",
        label: { en: "the wall", es: "la pared" },
        labelAt: { x: 25, y: 80 },
      },
      {
        id: "ventana-izq",
        path: "M23 50 H41 V68 H23 Z",
        label: { en: "the left window", es: "la ventana izquierda" },
        labelAt: { x: 32, y: 59 },
      },
      {
        id: "ventana-der",
        path: "M59 50 H77 V68 H59 Z",
        label: { en: "the right window", es: "la ventana derecha" },
        labelAt: { x: 68, y: 59 },
      },
      {
        id: "puerta",
        path: "M40 68 H60 V93 H40 Z",
        label: { en: "the door", es: "la puerta" },
        labelAt: { x: 50, y: 82 },
      },
    ],
  },
  {
    id: "camion",
    level: 4,
    name: { en: "Truck", es: "Camión" },
    regions: [
      {
        id: "caja",
        path: "M5 32 H56 V72 H5 Z",
        label: { en: "the box", es: "la caja" },
        labelAt: { x: 30, y: 52 },
      },
      {
        id: "cabina",
        path: "M56 46 H85 L95 62 V72 H56 Z",
        label: { en: "the cabin", es: "la cabina" },
        labelAt: { x: 72, y: 67 },
      },
      {
        id: "ventana",
        path: "M61 50 H81 L86 61 H61 Z",
        label: { en: "the window", es: "la ventana" },
        labelAt: { x: 72, y: 55 },
      },
      {
        id: "rueda-trasera",
        path: "M14 78 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z",
        label: { en: "the back wheel", es: "la rueda de atrás" },
        labelAt: { x: 26, y: 78 },
      },
      {
        id: "rueda-delantera",
        path: "M64 78 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z",
        label: { en: "the front wheel", es: "la rueda de adelante" },
        labelAt: { x: 76, y: 78 },
      },
      {
        id: "suelo",
        path: "M2 90 H98 V98 H2 Z",
        label: { en: "the ground", es: "el suelo" },
        labelAt: { x: 50, y: 94 },
      },
    ],
  },

  // ─── Nivel 5: ocho zonas ──────────────────────────────────
  {
    id: "arcoiris",
    level: 5,
    name: { en: "Rainbow", es: "Arcoíris" },
    regions: [
      {
        id: "banda-1",
        path: "M4 84 A46 46 0 0 1 96 84 H86 A36 36 0 0 0 14 84 Z",
        label: { en: "the outside stripe", es: "la franja de afuera" },
        labelAt: { x: 50, y: 43 },
      },
      {
        id: "banda-2",
        path: "M14 84 A36 36 0 0 1 86 84 H76 A26 26 0 0 0 24 84 Z",
        label: { en: "the second stripe", es: "la segunda franja" },
        labelAt: { x: 50, y: 53 },
      },
      {
        id: "banda-3",
        path: "M24 84 A26 26 0 0 1 76 84 H66 A16 16 0 0 0 34 84 Z",
        label: { en: "the third stripe", es: "la tercera franja" },
        labelAt: { x: 50, y: 63 },
      },
      {
        id: "banda-4",
        path: "M34 84 A16 16 0 0 1 66 84 H56 A6 6 0 0 0 44 84 Z",
        label: { en: "the inside stripe", es: "la franja de adentro" },
        labelAt: { x: 50, y: 73 },
      },
      {
        id: "nube-izq",
        path: "M2 84 a11 11 0 0 1 4 -20 a13 13 0 0 1 24 3 a9 9 0 0 1 -2 17 Z",
        label: { en: "the left cloud", es: "la nube de la izquierda" },
        labelAt: { x: 16, y: 75 },
      },
      {
        id: "nube-der",
        path: "M70 84 a9 9 0 0 1 -2 -17 a13 13 0 0 1 24 -3 a11 11 0 0 1 4 20 Z",
        label: { en: "the right cloud", es: "la nube de la derecha" },
        labelAt: { x: 84, y: 75 },
      },
      {
        id: "sol",
        path: "M38 16 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z",
        label: { en: "the sun", es: "el sol" },
        labelAt: { x: 49, y: 16 },
      },
      {
        id: "suelo",
        path: "M2 86 H98 V97 H2 Z",
        label: { en: "the ground", es: "el suelo" },
        labelAt: { x: 50, y: 91 },
      },
    ],
  },
  {
    id: "castillo",
    level: 5,
    name: { en: "Castle", es: "Castillo" },
    regions: [
      {
        id: "techo-izq",
        path: "M4 46 L18 24 L32 46 Z",
        label: { en: "the left tower roof", es: "el techo de la torre izquierda" },
        labelAt: { x: 18, y: 39 },
      },
      {
        id: "techo-centro",
        path: "M34 36 L50 10 L66 36 Z",
        label: { en: "the middle tower roof", es: "el techo de la torre del medio" },
        labelAt: { x: 50, y: 27 },
      },
      {
        id: "techo-der",
        path: "M68 46 L82 24 L96 46 Z",
        label: { en: "the right tower roof", es: "el techo de la torre derecha" },
        labelAt: { x: 82, y: 39 },
      },
      {
        id: "torre-izq",
        path: "M7 46 H29 V90 H7 Z",
        label: { en: "the left tower", es: "la torre izquierda" },
        labelAt: { x: 18, y: 70 },
      },
      {
        id: "torre-centro",
        path: "M36 36 H64 V90 H36 Z",
        label: { en: "the middle tower", es: "la torre del medio" },
        labelAt: { x: 50, y: 48 },
      },
      {
        id: "torre-der",
        path: "M71 46 H93 V90 H71 Z",
        label: { en: "the right tower", es: "la torre derecha" },
        labelAt: { x: 82, y: 70 },
      },
      {
        id: "puerta",
        path: "M42 62 C42 54 58 54 58 62 V90 H42 Z",
        label: { en: "the gate", es: "la puerta" },
        labelAt: { x: 50, y: 78 },
      },
      {
        id: "suelo",
        path: "M2 90 H98 V97 H2 Z",
        label: { en: "the ground", es: "el suelo" },
        labelAt: { x: 50, y: 93 },
      },
    ],
  },
];

/** Las láminas de un escalón. */
export function picturesForLevel(level: ColoringLevel): ColoringPicture[] {
  return COLORING_PICTURES.filter((picture) => picture.level === level);
}

export function shuffleColoringItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Una zona ya repartida: además de su dibujo, el color que le toca y el
 * número con el que se pide en los escalones numerados.
 */
export type ColoringTask = ColoringRegion & {
  colorId: ColorId;
  /** 1..n, el mismo número que lleva su color en la paleta. */
  key: number;
};

export type ColoringRound = {
  picture: ColoringPicture;
  mode: ColoringMode;
  /** La paleta de esta ronda, en el orden en que se enseña. */
  palette: ColorId[];
  tasks: ColoringTask[];
};

/**
 * Reparte los colores de una lámina.
 *
 * Va en rueda sobre la paleta ya revuelta, que consigue dos cosas de una vez:
 * **dos zonas seguidas nunca llevan el mismo color** —y como las zonas están
 * escritas en orden de vecindad, eso evita el dibujo con el techo y la pared
 * del mismo tono, que parece a medio pintar— y todos los colores de la paleta
 * acaban usándose, así que la paleta nunca tiene una ficha que no sirva para
 * nada.
 *
 * Al revolver la paleta en cada ronda, la misma casa sale distinta cada vez.
 */
export function buildColoringRound(
  picture: ColoringPicture,
  level: ColoringLevel,
): ColoringRound {
  const { mode, palette } = COLORING_LEVELS[level];
  const shuffled = shuffleColoringItems(palette);

  const tasks = picture.regions.map((region, index) => {
    const slot = index % shuffled.length;
    return { ...region, colorId: shuffled[slot], key: slot + 1 };
  });

  return { picture, mode, palette: shuffled, tasks };
}

/** Las láminas de una sesión, al azar y sin repetir dentro de la sesión. */
export function buildColoringSession(level: ColoringLevel): ColoringRound[] {
  const available = shuffleColoringItems(picturesForLevel(level));
  return available
    .slice(0, COLORING_PICTURES_PER_SESSION)
    .map((picture) => buildColoringRound(picture, level));
}

/**
 * Cuántas de las decisiones —zona y color, contadas una vez cada una por
 * `coloringAttemptKey`— dieron en la zona correcta. Sin ninguna aún es 100: la
 * sesión empieza perfecta y se estropea sola, igual que en Parejas.
 */
export function coloringAccuracy(attempts: number, painted: number): number {
  if (attempts === 0) return 100;
  return Math.round((painted / attempts) * 100);
}

/**
 * La valoración de la sesión, de cero a tres estrellas, por la precisión.
 *
 * Sin terminar vale cero: abandonar no abre nada. Terminada, una estrella es
 * haberla acabado; dos, acertar al menos dos de cada tres toques; tres, más de
 * ocho de cada diez. El listón está algo más alto que en Parejas porque aquí
 * no hay azar: la zona que toca está dicha o numerada, y fallar es haber
 * elegido mal el color, no haber tenido mala suerte.
 */
export function coloringSessionStars(
  accuracy: number,
  completed: boolean,
): Stars {
  if (!completed) return 0;
  if (accuracy >= 85) return 3;
  if (accuracy >= 66) return 2;
  return 1;
}

/** Pausa tras pintar bien, para que se vea el color antes de seguir. */
export const COLORING_FILL_MS = 420;

/**
 * El tope de zonas que puede tener una lámina. Lo usa `validate:content` para
 * comprobar que la paleta de cada escalón da para numerarlas todas.
 */
export const COLORING_MAX_REGIONS = Math.max(
  ...COLORING_PICTURES.map((picture) => picture.regions.length),
);

export type { Difficulty };
