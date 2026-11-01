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
 * Los dibujos son páginas de colorear de verdad: tinta negra sobre fondo
 * transparente, en `public/art/coloring/`. Antes eran geometría escrita a mano
 * —un árbol era un óvalo sobre un rectángulo— y no se reconocían. Las zonas
 * no se escriben: salen de la propia imagen, porque cada espacio cerrado por
 * la tinta es una zona (`coloringRegionCells`). La lámina solo dice qué zona
 * es cuál, con un punto dentro de cada pedazo.
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
 * **Los colores que se piden son los de la realidad.** Cada zona dice qué
 * colores tiene sentido pedirle —las hojas, verdes; el tronco, café; el mar,
 * azul; el arcoíris, en su orden— y se elige entre ellos al empezar cada
 * ronda. Pedir "pinta las hojas de amarillo" o un tronco azul no enseña nada:
 * el color se aprende junto con lo que lleva ese color. Lo que de verdad
 * puede ser de cualquier color —una pared, una vela, un pez— sigue variando,
 * y por eso la misma casa sale distinta cada vez y el banco puede ser
 * pequeño sin que el juego se agote. Lo que en la realidad va igual —las dos
 * alas de arriba de una mariposa, las ventanas de una casa— es una sola zona
 * con varios pedazos, para que nunca se pidan de dos colores.
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
 * Qué cambia en cada escalón: cómo se pide la zona y cuántas fichas tiene la
 * paleta.
 *
 * Cuántas zonas tiene el dibujo lo dice el dibujo, no el escalón: por eso cada
 * lámina declara a qué nivel pertenece y el banco crece por ahí.
 *
 * Qué colores se usan lo dice lo que se pinta (ver `ColoringRegion.colors`),
 * así que el escalón no elige colores: elige cuántas fichas hay que mirar.
 * `paletteSize` es el mínimo, y si la lámina usa menos colores, los que faltan
 * se completan con otros que no pinta ninguna zona. Un árbol necesita verde y
 * café, y con solo esas dos fichas no habría nada que decidir.
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
    paletteSize: number;
    brushes: readonly ColoringBrushId[];
    coverageToFill: number;
  }
> = {
  1: {
    mode: "spoken",
    paletteSize: 3,
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.7,
  },
  2: {
    mode: "spoken",
    paletteSize: 4,
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.7,
  },
  3: {
    mode: "key",
    paletteSize: 4,
    brushes: ["fino", "medio", "grueso"],
    coverageToFill: 0.75,
  },
  4: {
    mode: "key",
    paletteSize: 5,
    brushes: ["fino", "medio"],
    coverageToFill: 0.8,
  },
  5: {
    mode: "key",
    paletteSize: 6,
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
 * Los radios están elegidos contra las zonas de verdad, no al azar: una franja
 * del arcoíris mide unos 6 de lado a lado y el tallo de la flor unos 5, así
 * que el grueso (19 de diámetro) y el medio las cubren de una pasada y el fino
 * sirve para la ventana del cohete y la cabeza de la mariposa. Ninguno
 * estropea nada por grande, porque la pintura se recorta a la zona.
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
 * cae dentro del camino de una zona es el navegador (`isPointInPath`), y este
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
 * Una zona del dibujo: cómo se llama, dónde está y qué colores puede llevar.
 *
 * El nombre no es decoración: en los escalones hablados es lo que se dice en
 * voz alta, y en todos es el nombre accesible del botón. Una zona sin nombre
 * no se podría ni pedir ni leer.
 */
export type ColoringRegion = {
  id: string;
  label: Record<Language, string>;
  /**
   * Un punto dentro de cada pedazo de la zona, en el lienzo de 100 × 100.
   *
   * Hace dos cosas. Dice qué espacio cerrado de la imagen es esta zona —el
   * espacio que contiene el punto, y todos los que lo contengan si la zona
   * tiene varios pedazos, como los pétalos o las ruedas— y es donde se pinta
   * su número en los escalones numerados. Por eso va en el punto más hondo de
   * cada pedazo, el más lejos de las líneas, y no en el centro de su caja:
   * en una banda del arcoíris el centro cae en el hueco del arco.
   */
  labelAt: ColoringPoint[];
  /**
   * Los colores que puede llevar, los que tiene en la realidad.
   *
   * Uno solo cuando no hay duda —las hojas, verdes; el mar, azul— y varios
   * cuando la cosa puede ser de muchos colores, como una pared o un pez. Al
   * escribir una lámina hay que mirar también la zona de al lado: si la
   * ventana es azul, la pared que la rodea no puede serlo, o "pinta la pared
   * de azul" pediría pintarlas iguales.
   */
  colors: readonly ColorId[];
};

/**
 * Una lámina.
 *
 * Tiene la forma de una fila de base de datos —id, nivel, nombre, dibujo y
 * zonas— por lo mismo que los ejercicios de Trazos: para que el día que el
 * contenido venga de una tabla haya que cambiar de dónde sale, no el juego.
 */
export type ColoringPicture = {
  id: string;
  level: ColoringLevel;
  name: Record<Language, string>;
  /** La tinta de la página, cuadrada y con el fondo transparente. */
  image: string;
  /**
   * En el orden en que se piden en los escalones hablados. Cada zona prefiere
   * un color que todavía no lleve ninguna otra, así que en la práctica las
   * vecinas nunca salen iguales; y una zona nunca repite el color de la
   * anterior salvo que la realidad lo pida (el tallo y la hoja, verdes los
   * dos).
   */
  regions: ColoringRegion[];
};

/* ──────────────── Las zonas, sacadas de la imagen ────────────── */

/**
 * El lado de la rejilla en la que se buscan las zonas de una imagen.
 *
 * 256 es de sobra: la línea de las láminas mide unas cuatro celdas, así que
 * ningún espacio cerrado se escapa por un hueco que no existe, y la zona más
 * pequeña del banco —la cabeza de la mariposa— tiene centenares de celdas.
 * Contar en la imagen entera, de 1024, sería dieciséis veces más trabajo en
 * el momento de empezar cada lámina y no cambiaría ninguna zona.
 */
export const COLORING_GRID = 256;

/**
 * Cuántas celdas se mete cada zona dentro de la línea que la rodea.
 *
 * La pintura se recorta a la zona, y la zona en celdas tiene bordes en
 * escalera. Metiéndola un poco bajo la tinta, la escalera queda tapada por la
 * línea, que se pinta encima, y entre el color y el contorno no queda ni un
 * hilo blanco. Dos celdas son la mitad de la línea: dos zonas vecinas se
 * encuentran en el centro de la raya que las separa y ninguna asoma al otro
 * lado.
 */
export const COLORING_GROW = 2;

/** Una fila de celdas seguidas de una zona: fila, primera y última columna. */
export type ColoringRun = { y: number; x0: number; x1: number };

/**
 * Las celdas de cada zona de una lámina, en tramos de fila.
 *
 * `ink` es la rejilla de `size × size` con un 1 donde hay tinta; quien la lee
 * de la imagen es el cliente, que es quien tiene un lienzo, y aquí solo se
 * cuenta. Cada zona es el espacio cerrado —sin tinta, unido de lado a lado—
 * que contiene alguno de sus puntos; lo que no contiene ninguno es fondo y no
 * se pinta, como el cielo bajo el arco del arcoíris o el hueco entre dos
 * ruedas.
 *
 * Devuelve también lo que salió mal, en vez de callarlo: un punto que cae
 * sobre la tinta, o dos zonas que reclaman el mismo espacio porque la línea
 * que debía separarlas tiene un hueco. Las dos cosas pasan al cambiar una
 * imagen sin mirar sus puntos.
 */
export function coloringRegionCells(
  ink: Uint8Array,
  size: number,
  regions: readonly { labelAt: readonly ColoringPoint[] }[],
): { runs: ColoringRun[][]; problems: string[] } {
  const owner = new Int16Array(size * size);
  const problems: string[] = [];

  regions.forEach((region, index) => {
    const mark = index + 1;
    for (const point of region.labelAt) {
      const cx = Math.min(size - 1, Math.max(0, Math.floor((point.x / 100) * size)));
      const cy = Math.min(size - 1, Math.max(0, Math.floor((point.y / 100) * size)));
      const start = cy * size + cx;
      if (ink[start]) {
        problems.push(`zona ${index}: el punto (${point.x}, ${point.y}) cae sobre la línea`);
        continue;
      }
      if (owner[start] === mark) continue;
      if (owner[start] !== 0) {
        problems.push(`zona ${index}: comparte el espacio con la zona ${owner[start] - 1}`);
        continue;
      }

      // Relleno de cuatro vecinos: dos celdas que solo se tocan en diagonal
      // están separadas por la línea, aunque la línea sea fina en ese punto.
      const queue = [start];
      owner[start] = mark;
      for (let head = 0; head < queue.length; head += 1) {
        const cell = queue[head];
        const x = cell % size;
        const neighbours = [
          x > 0 ? cell - 1 : -1,
          x < size - 1 ? cell + 1 : -1,
          cell - size,
          cell + size,
        ];
        for (const next of neighbours) {
          if (next < 0 || next >= owner.length) continue;
          if (ink[next] || owner[next] !== 0) continue;
          owner[next] = mark;
          queue.push(next);
        }
      }
    }
  });

  // Crecer bajo la tinta, una celda por pasada y desde la foto de la pasada
  // anterior, para que ninguna zona avance dos celdas de golpe hacia un lado.
  for (let pass = 0; pass < COLORING_GROW; pass += 1) {
    const before = owner.slice();
    for (let cell = 0; cell < owner.length; cell += 1) {
      if (!ink[cell] || before[cell] !== 0) continue;
      const x = cell % size;
      const found =
        (x > 0 && before[cell - 1]) ||
        (x < size - 1 && before[cell + 1]) ||
        (cell >= size && before[cell - size]) ||
        (cell + size < owner.length && before[cell + size]) ||
        0;
      if (found) owner[cell] = found;
    }
  }

  const runs: ColoringRun[][] = regions.map(() => []);
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      const mark = owner[y * size + x];
      if (mark === 0) {
        x += 1;
        continue;
      }
      let end = x;
      while (end + 1 < size && owner[y * size + end + 1] === mark) end += 1;
      runs[mark - 1].push({ y, x0: x, x1: end });
      x = end + 1;
    }
  }

  regions.forEach((_, index) => {
    if (runs[index].length === 0) problems.push(`zona ${index}: no ocupa nada`);
  });
  return { runs, problems };
}

/**
 * Los tramos de una zona como camino SVG en el lienzo de 100 × 100: un
 * rectángulo por tramo. El mismo texto sirve para `Path2D`, que es con lo que
 * el lienzo recorta la pintura y pregunta qué zona hay bajo el dedo, y para el
 * `<path>` enfocable de la capa accesible.
 */
export function coloringRunsPath(runs: readonly ColoringRun[], size: number): string {
  const cell = 100 / size;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return runs
    .map(
      ({ y, x0, x1 }) =>
        `M${round(x0 * cell)} ${round(y * cell)}h${round((x1 - x0 + 1) * cell)}v${round(cell)}h${round(-(x1 - x0 + 1) * cell)}z`,
    )
    .join("");
}

const art = (id: string) => `/art/coloring/${id}.png`;

export const COLORING_PICTURES: ColoringPicture[] = [
  // ─── Nivel 1: tres zonas ──────────────────────────────────
  {
    id: "casa",
    level: 1,
    name: { en: "House", es: "Casa" },
    image: art("casa"),
    regions: [
      {
        id: "techo",
        label: { en: "the roof", es: "el techo" },
        labelAt: [{ x: 49.8, y: 26.4 }],
        colors: ["rojo", "cafe", "naranja"],
      },
      {
        id: "pared",
        label: { en: "the wall", es: "la pared" },
        labelAt: [{ x: 25.6, y: 61.5 }],
        colors: ["amarillo", "azul", "rosado", "verde"],
      },
      {
        id: "puerta",
        label: { en: "the door", es: "la puerta" },
        labelAt: [{ x: 49.8, y: 72.9 }],
        colors: ["cafe", "rojo", "azul"],
      },
    ],
  },
  {
    id: "arbol",
    level: 1,
    name: { en: "Tree", es: "Árbol" },
    image: art("arbol"),
    regions: [
      {
        id: "copa",
        label: { en: "the leaves", es: "las hojas" },
        labelAt: [{ x: 47.9, y: 33.4 }],
        colors: ["verde"],
      },
      {
        id: "tronco",
        label: { en: "the trunk", es: "el tronco" },
        labelAt: [{ x: 49.8, y: 76 }],
        colors: ["cafe"],
      },
      {
        id: "suelo",
        label: { en: "the grass", es: "el pasto" },
        labelAt: [{ x: 50, y: 90 }],
        colors: ["verde"],
      },
    ],
  },
  {
    id: "pez",
    level: 1,
    name: { en: "Fish", es: "Pez" },
    image: art("pez"),
    regions: [
      {
        id: "cuerpo",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: [{ x: 42.8, y: 56.8 }],
        colors: ["naranja", "amarillo", "azul", "rojo"],
      },
      {
        id: "cola",
        label: { en: "the tail", es: "la cola" },
        labelAt: [{ x: 81.1, y: 66.2 }],
        colors: ["naranja", "amarillo", "azul", "rojo", "morado"],
      },
      {
        id: "aleta",
        label: { en: "the fin", es: "la aleta" },
        labelAt: [{ x: 50.2, y: 26 }],
        colors: ["naranja", "amarillo", "azul", "rojo", "morado"],
      },
    ],
  },

  // ─── Nivel 2: cuatro y cinco zonas ────────────────────────
  {
    id: "flor",
    level: 2,
    name: { en: "Flower", es: "Flor" },
    image: art("flor"),
    regions: [
      {
        id: "petalos",
        label: { en: "the petals", es: "los pétalos" },
        labelAt: [
          { x: 48.2, y: 15.8 },
          { x: 30.3, y: 29.1 },
          { x: 68.9, y: 29.1 },
          { x: 63.1, y: 51.4 },
          { x: 35.7, y: 51.8 },
        ],
        colors: ["rojo", "amarillo", "rosado", "morado", "azul", "naranja"],
      },
      {
        id: "centro",
        label: { en: "the middle", es: "el centro" },
        labelAt: [{ x: 49.4, y: 37.7 }],
        colors: ["amarillo", "naranja", "cafe"],
      },
      {
        id: "tallo",
        label: { en: "the stem", es: "el tallo" },
        labelAt: [{ x: 49.4, y: 75.2 }],
        colors: ["verde"],
      },
      {
        id: "hoja",
        label: { en: "the leaf", es: "la hoja" },
        labelAt: [{ x: 63.5, y: 74.8 }],
        colors: ["verde"],
      },
    ],
  },
  {
    id: "barco",
    level: 2,
    name: { en: "Boat", es: "Barco" },
    image: art("barco"),
    regions: [
      {
        id: "vela-grande",
        label: { en: "the big sail", es: "la vela grande" },
        labelAt: [{ x: 35.7, y: 46.7 }],
        colors: ["rojo", "amarillo", "azul", "naranja", "morado", "verde"],
      },
      {
        id: "vela-pequena",
        label: { en: "the small sail", es: "la vela pequeña" },
        labelAt: [{ x: 71.3, y: 54.5 }],
        colors: ["rojo", "amarillo", "azul", "naranja", "morado", "verde"],
      },
      {
        // Sin azul: el casco está pegado al mar, que lo es siempre.
        id: "casco",
        label: { en: "the hull", es: "el casco" },
        labelAt: [{ x: 50, y: 77.5 }],
        colors: ["cafe", "rojo", "amarillo", "naranja"],
      },
      {
        id: "mar",
        label: { en: "the sea", es: "el mar" },
        labelAt: [{ x: 50, y: 88.1 }],
        colors: ["azul"],
      },
    ],
  },
  {
    id: "cohete",
    level: 2,
    name: { en: "Rocket", es: "Cohete" },
    image: art("cohete"),
    regions: [
      {
        id: "punta",
        label: { en: "the nose", es: "la punta" },
        labelAt: [{ x: 49.8, y: 15.4 }],
        colors: ["rojo", "naranja", "azul"],
      },
      {
        // Sin azul: la ventana, que va dentro, es azul siempre.
        id: "cuerpo",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: [{ x: 49, y: 71.3 }],
        colors: ["rojo", "amarillo", "morado", "verde", "naranja"],
      },
      {
        id: "ventana",
        label: { en: "the window", es: "la ventana" },
        labelAt: [{ x: 49.8, y: 45.1 }],
        colors: ["azul"],
      },
      {
        id: "aletas",
        label: { en: "the fins", es: "las aletas" },
        labelAt: [
          { x: 26, y: 80.3 },
          { x: 74, y: 80.7 },
        ],
        colors: ["rojo", "naranja", "azul", "verde", "morado"],
      },
      {
        id: "base",
        label: { en: "the base", es: "la base" },
        labelAt: [{ x: 49.8, y: 90.8 }],
        colors: ["naranja", "amarillo", "rojo"],
      },
    ],
  },

  // ─── Nivel 3: el primero numerado ─────────────────────────
  {
    // Las alas van de dos en dos porque una mariposa es simétrica: pedir el
    // ala izquierda de un color y la derecha de otro no es ninguna mariposa.
    id: "mariposa",
    level: 3,
    name: { en: "Butterfly", es: "Mariposa" },
    image: art("mariposa"),
    regions: [
      {
        id: "alas-arriba",
        label: { en: "the top wings", es: "las alas de arriba" },
        labelAt: [
          { x: 26, y: 38.5 },
          { x: 74, y: 38.5 },
        ],
        colors: ["azul", "morado", "naranja", "amarillo", "rosado", "rojo"],
      },
      {
        id: "alas-abajo",
        label: { en: "the bottom wings", es: "las alas de abajo" },
        labelAt: [
          { x: 26, y: 73.6 },
          { x: 74, y: 73.6 },
        ],
        colors: ["azul", "morado", "naranja", "amarillo", "rosado", "rojo"],
      },
      {
        // El cuerpo y la cabeza son dos espacios en la imagen y una sola cosa
        // en la mariposa.
        id: "cuerpo",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: [
          { x: 49.8, y: 53.3 },
          { x: 49.8, y: 33.8 },
        ],
        colors: ["cafe"],
      },
    ],
  },
  {
    id: "tren",
    level: 3,
    name: { en: "Train", es: "Tren" },
    image: art("tren"),
    regions: [
      {
        id: "cuerpo",
        label: { en: "the body", es: "el cuerpo" },
        labelAt: [{ x: 36.5, y: 49.8 }],
        colors: ["rojo", "azul", "verde"],
      },
      {
        id: "cabina",
        label: { en: "the cabin", es: "la cabina" },
        labelAt: [{ x: 76.4, y: 38.5 }],
        colors: ["rojo", "azul", "amarillo", "verde"],
      },
      {
        id: "chimenea",
        label: { en: "the chimney", es: "la chimenea" },
        labelAt: [{ x: 29.9, y: 30.7 }],
        colors: ["cafe", "rojo"],
      },
      {
        id: "ruedas",
        label: { en: "the wheels", es: "las ruedas" },
        labelAt: [
          { x: 23.6, y: 62.3 },
          { x: 49.4, y: 62.3 },
          { x: 75.2, y: 62.3 },
        ],
        colors: ["rojo", "amarillo", "azul"],
      },
      {
        id: "via",
        label: { en: "the track", es: "la vía" },
        labelAt: [{ x: 90, y: 73.6 }],
        colors: ["cafe"],
      },
    ],
  },

  // ─── Nivel 4: cinco y seis zonas ──────────────────────────
  {
    id: "casa-grande",
    level: 4,
    name: { en: "Big house", es: "Casa grande" },
    image: art("casa-grande"),
    regions: [
      {
        id: "sol",
        label: { en: "the sun", es: "el sol" },
        labelAt: [{ x: 20.5, y: 19.7 }],
        colors: ["amarillo", "naranja"],
      },
      {
        id: "techo",
        label: { en: "the roof", es: "el techo" },
        labelAt: [{ x: 54.1, y: 38.1 }],
        colors: ["rojo", "cafe", "naranja"],
      },
      {
        // Sin azul: las ventanas, que van dentro, son azules siempre.
        id: "pared",
        label: { en: "the wall", es: "la pared" },
        labelAt: [{ x: 43.9, y: 62.7 }],
        colors: ["amarillo", "rosado", "verde", "naranja"],
      },
      {
        id: "ventanas",
        label: { en: "the windows", es: "las ventanas" },
        labelAt: [
          { x: 33, y: 72.5 },
          { x: 75.6, y: 72.5 },
        ],
        colors: ["azul"],
      },
      {
        id: "puerta",
        label: { en: "the door", es: "la puerta" },
        labelAt: [{ x: 54.1, y: 73.2 }],
        colors: ["cafe", "rojo"],
      },
    ],
  },
  {
    id: "camion",
    level: 4,
    name: { en: "Truck", es: "Camión" },
    image: art("camion"),
    regions: [
      {
        id: "caja",
        label: { en: "the box", es: "la caja" },
        labelAt: [{ x: 34.6, y: 40.8 }],
        colors: ["rojo", "azul", "amarillo", "naranja", "verde"],
      },
      {
        // Sin azul: la ventana, que va dentro, es azul siempre.
        id: "cabina",
        label: { en: "the cabin", es: "la cabina" },
        labelAt: [{ x: 84.6, y: 51 }],
        colors: ["rojo", "amarillo", "naranja", "verde"],
      },
      {
        id: "ventana",
        label: { en: "the window", es: "la ventana" },
        labelAt: [{ x: 71.3, y: 37.3 }],
        colors: ["azul"],
      },
      {
        id: "ruedas",
        label: { en: "the wheels", es: "las ruedas" },
        labelAt: [
          { x: 23.2, y: 67 },
          { x: 76, y: 66.6 },
        ],
        colors: ["rojo", "amarillo", "azul", "naranja"],
      },
      {
        id: "parte-de-abajo",
        label: { en: "the bottom", es: "la parte de abajo" },
        labelAt: [{ x: 50, y: 70.9 }],
        colors: ["cafe", "amarillo", "rojo"],
      },
      {
        id: "suelo",
        label: { en: "the ground", es: "el suelo" },
        labelAt: [{ x: 50, y: 79.1 }],
        colors: ["cafe", "verde"],
      },
    ],
  },

  // ─── Nivel 5: los dibujos más grandes ─────────────────────
  {
    // Las franjas van en el orden del arcoíris y las nubes se quedan blancas,
    // que es como son: en la paleta no hay blanco porque sobre el papel no se
    // vería pintado.
    // Los números de las franjas van repartidos por el arco, cada uno a una
    // altura: una franja mide menos que una cifra y, uno junto a otro, se
    // pisarían.
    id: "arcoiris",
    level: 5,
    name: { en: "Rainbow", es: "Arcoíris" },
    image: art("arcoiris"),
    regions: [
      {
        id: "banda-1",
        label: { en: "the outside stripe", es: "la franja de afuera" },
        labelAt: [{ x: 16.6, y: 57.2 }],
        colors: ["rojo"],
      },
      {
        id: "banda-2",
        label: { en: "the second stripe", es: "la segunda franja" },
        labelAt: [{ x: 36.1, y: 42 }],
        colors: ["naranja"],
      },
      {
        id: "banda-3",
        label: { en: "the third stripe", es: "la tercera franja" },
        labelAt: [{ x: 63.5, y: 47.9 }],
        colors: ["amarillo"],
      },
      {
        id: "banda-4",
        label: { en: "the inside stripe", es: "la franja de adentro" },
        labelAt: [{ x: 67, y: 63.1 }],
        colors: ["verde"],
      },
      {
        id: "sol",
        label: { en: "the sun", es: "el sol" },
        labelAt: [{ x: 80.3, y: 20.1 }],
        colors: ["amarillo", "naranja"],
      },
      {
        id: "suelo",
        label: { en: "the hill", es: "la colina" },
        labelAt: [{ x: 44.7, y: 86.9 }],
        colors: ["verde"],
      },
    ],
  },
  {
    // Las tres torres son una sola zona porque son de la misma piedra; los
    // techos, en cambio, pueden ser cada uno de su color, como en los cuentos.
    id: "castillo",
    level: 5,
    name: { en: "Castle", es: "Castillo" },
    image: art("castillo"),
    regions: [
      {
        id: "techo-izq",
        label: { en: "the left roof", es: "el techo de la izquierda" },
        labelAt: [{ x: 22.1, y: 35.7 }],
        colors: ["rojo", "azul", "morado", "rosado"],
      },
      {
        id: "techo-centro",
        label: { en: "the middle roof", es: "el techo del medio" },
        labelAt: [{ x: 49.8, y: 24.8 }],
        colors: ["rojo", "azul", "morado", "rosado"],
      },
      {
        id: "techo-der",
        label: { en: "the right roof", es: "el techo de la derecha" },
        labelAt: [{ x: 77.5, y: 35.7 }],
        colors: ["rojo", "azul", "morado", "rosado"],
      },
      {
        id: "torres",
        label: { en: "the towers", es: "las torres" },
        labelAt: [
          { x: 22.5, y: 56.4 },
          { x: 48.6, y: 49 },
          { x: 76.8, y: 56.8 },
        ],
        colors: ["amarillo", "naranja", "rosado"],
      },
      {
        id: "puerta",
        label: { en: "the gate", es: "la puerta" },
        labelAt: [{ x: 49.8, y: 70.9 }],
        colors: ["cafe"],
      },
      {
        id: "suelo",
        label: { en: "the grass", es: "el pasto" },
        labelAt: [{ x: 50, y: 88.5 }],
        colors: ["verde"],
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
 * Cada zona elige al azar entre sus colores de verdad (`colors`), y entre
 * ellos prefiere uno que todavía no lleve ninguna otra zona: así el dibujo
 * sale variado y dos zonas vecinas casi nunca coinciden sin tener que
 * escribir quién toca a quién. Si todos sus colores ya están usados, evita al
 * menos el de la zona anterior; y si ni eso puede —el tallo y la hoja de la
 * flor no pueden ser más que verdes—, repite, porque la realidad manda más que
 * la variedad.
 *
 * La paleta son los colores usados, completados hasta `paletteSize` con otros
 * que no pinta nadie y revueltos. El número de cada zona es el de su color en
 * esa paleta, así que dos zonas del mismo color llevan el mismo número.
 */
export function buildColoringRound(
  picture: ColoringPicture,
  level: ColoringLevel,
): ColoringRound {
  const { mode, paletteSize } = COLORING_LEVELS[level];

  const used = new Set<ColorId>();
  let previous: ColorId | null = null;
  const chosen = picture.regions.map((region) => {
    const fresh = region.colors.filter((colorId) => !used.has(colorId));
    const notPrevious = region.colors.filter((colorId) => colorId !== previous);
    const pool =
      fresh.length > 0 ? fresh : notPrevious.length > 0 ? notPrevious : region.colors;
    const colorId = pool[Math.floor(Math.random() * pool.length)];
    used.add(colorId);
    previous = colorId;
    return colorId;
  });

  const spare = shuffleColoringItems(
    (Object.keys(COLORING_COLORS) as ColorId[]).filter((colorId) => !used.has(colorId)),
  );
  const palette = shuffleColoringItems([
    ...used,
    ...spare.slice(0, Math.max(0, paletteSize - used.size)),
  ]);

  const tasks = picture.regions.map((region, index) => ({
    ...region,
    colorId: chosen[index],
    key: palette.indexOf(chosen[index]) + 1,
  }));

  return { picture, mode, palette, tasks };
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
 * El tope de fichas de la paleta. Con seis, las fichas de 48 px de un teléfono
 * de 375 caben en una sola fila; con más, la última bajaría sola a otra fila
 * y el tablero saltaría. Como cada zona pone a lo sumo un color, una lámina
 * no puede tener más zonas que esto, y `validate:content` lo comprueba.
 */
export const COLORING_MAX_SWATCHES = 6;

export type { Difficulty };
