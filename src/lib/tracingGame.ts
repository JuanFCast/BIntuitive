import type { Stars } from "./difficulty";
import type { Language } from "./language";

/**
 * Trazos: lógica pura del juego de trazado.
 *
 * El tablero es un cuadrado y todo se mide en un espacio normalizado de 0 a
 * 100, el mismo `viewBox` que dibuja el SVG. Que sea cuadrado no es estética:
 * en un rectángulo, una unidad horizontal y una vertical medirían distinto y
 * la tolerancia sería más estrecha en un eje que en el otro.
 *
 * Aquí no hay React ni DOM: el camino se muestrea en puntos, y el juego solo
 * pregunta "¿a qué distancia del camino está el dedo?" y "¿hasta dónde ha
 * llegado?". Esas dos respuestas son las que deciden si el trazo vale.
 */

export const TRACING_MAX_LEVEL = 5;
export const TRACING_EXERCISES_PER_SESSION = 5;

/** Puntos con los que se muestrea cada camino. */
export const TRACING_SAMPLES = 72;

/**
 * Cuántas muestras puede saltarse el dedo de una vez. Es lo que impide ganar
 * yendo directo al destino: el avance tiene que ser seguido, no un salto desde
 * la salida hasta la meta.
 */
export const TRACING_MAX_SKIP = 6;

export type TracingLevel = 1 | 2 | 3 | 4 | 5;

export type TracingCategory =
  | "animals"
  | "colors"
  | "numbers"
  | "food"
  | "places"
  | "countries"
  | "transport"
  | "school";

export type TracingPathType =
  | "vertical"
  | "horizontal"
  | "diagonal"
  | "corner"
  | "hill"
  | "wave"
  | "zigzag"
  | "sWave"
  | "snake"
  | "longWave";

export type TracingPoint = { x: number; y: number };

/**
 * Los dos extremos del camino. `emoji` hace de ilustración: la aplicación no
 * tiene dibujos propios y usa emoji en todas partes, así que un ejercicio no
 * arrastra ningún archivo. El día que el banco venga de una base de datos, este
 * campo es el que se cambia por la URL de la ilustración.
 */
export type TracingFigure = {
  emoji: string;
  word: Record<Language, string>;
};

export type TracingExercise = {
  id: string;
  level: TracingLevel;
  category: TracingCategory;
  start: TracingFigure;
  target: TracingFigure;
  pathType: TracingPathType;
};

/**
 * Lo que cambia de un nivel a otro: qué formas de camino aparecen y cuánto se
 * puede uno separar de la línea sin salirse.
 *
 * La tolerancia se mide en unidades del tablero (de 0 a 100), así que 16 es un
 * carril de casi un tercio del ancho: en el primer nivel el niño casi no puede
 * fallar, que es la idea. Ni siquiera el nivel 5 aprieta de verdad; el salto de
 * dificultad está en la forma del camino, no en el castigo.
 */
export const TRACING_LEVELS: Record<
  TracingLevel,
  { tolerance: number; pathTypes: TracingPathType[] }
> = {
  1: { tolerance: 16, pathTypes: ["vertical", "horizontal"] },
  2: { tolerance: 14, pathTypes: ["diagonal", "corner"] },
  3: { tolerance: 12, pathTypes: ["hill", "wave"] },
  4: { tolerance: 10.5, pathTypes: ["zigzag", "sWave"] },
  5: { tolerance: 9, pathTypes: ["snake", "longWave"] },
};

/* --------------------------------------------------------------------------
 * Geometría de los caminos
 * ----------------------------------------------------------------------- */

/** Reparte las muestras por longitud, para que los puntos no se amontonen. */
function samplePolyline(anchors: TracingPoint[]): TracingPoint[] {
  const lengths = anchors.slice(1).map((point, index) => {
    const previous = anchors[index];
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);

  return Array.from({ length: TRACING_SAMPLES }, (_, index) => {
    let travelled = (index / (TRACING_SAMPLES - 1)) * total;
    for (let leg = 0; leg < lengths.length; leg += 1) {
      if (travelled <= lengths[leg] || leg === lengths.length - 1) {
        const ratio = lengths[leg] === 0 ? 0 : travelled / lengths[leg];
        const from = anchors[leg];
        const to = anchors[leg + 1];
        return {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio,
        };
      }
      travelled -= lengths[leg];
    }
    return anchors[anchors.length - 1];
  });
}

function sampleCurve(at: (t: number) => TracingPoint): TracingPoint[] {
  return Array.from({ length: TRACING_SAMPLES }, (_, index) =>
    at(index / (TRACING_SAMPLES - 1)),
  );
}

const PATH_SHAPES: Record<TracingPathType, () => TracingPoint[]> = {
  vertical: () =>
    samplePolyline([
      { x: 50, y: 16 },
      { x: 50, y: 84 },
    ]),
  horizontal: () =>
    samplePolyline([
      { x: 16, y: 50 },
      { x: 84, y: 50 },
    ]),
  diagonal: () =>
    samplePolyline([
      { x: 18, y: 18 },
      { x: 82, y: 82 },
    ]),
  corner: () =>
    samplePolyline([
      { x: 20, y: 18 },
      { x: 20, y: 72 },
      { x: 82, y: 72 },
    ]),
  hill: () =>
    sampleCurve((t) => ({
      x: 16 + 68 * t,
      y: 76 - 48 * Math.sin(Math.PI * t),
    })),
  wave: () =>
    sampleCurve((t) => ({
      x: 16 + 68 * t,
      y: 50 + 24 * Math.sin(2 * Math.PI * t),
    })),
  zigzag: () =>
    samplePolyline([
      { x: 18, y: 18 },
      { x: 76, y: 38 },
      { x: 22, y: 62 },
      { x: 82, y: 82 },
    ]),
  sWave: () =>
    sampleCurve((t) => ({
      x: 50 + 26 * Math.sin(2 * Math.PI * t),
      y: 16 + 68 * t,
    })),
  snake: () =>
    samplePolyline([
      { x: 16, y: 18 },
      { x: 80, y: 18 },
      { x: 80, y: 50 },
      { x: 20, y: 50 },
      { x: 20, y: 82 },
      { x: 84, y: 82 },
    ]),
  longWave: () =>
    sampleCurve((t) => ({
      x: 14 + 72 * t,
      y: 50 + 27 * Math.sin(3 * Math.PI * t),
    })),
};

export function tracingPath(pathType: TracingPathType): TracingPoint[] {
  return PATH_SHAPES[pathType]();
}

/* --------------------------------------------------------------------------
 * Seguir el camino
 * ----------------------------------------------------------------------- */

function distanceToSegment(
  point: TracingPoint,
  from: TracingPoint,
  to: TracingPoint,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0)
    return Math.hypot(point.x - from.x, point.y - from.y);

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared,
    ),
  );
  return Math.hypot(point.x - (from.x + dx * t), point.y - (from.y + dy * t));
}

/**
 * La muestra más cercana al dedo y a qué distancia está del camino.
 *
 * La distancia se mide contra los segmentos y no contra los puntos sueltos:
 * entre dos muestras hay línea, y quien va justo por el centro de ese tramo no
 * está fuera por estar lejos de las dos muestras.
 */
export function nearestOnPath(
  path: TracingPoint[],
  point: TracingPoint,
): { index: number; distance: number } {
  let best = { index: 0, distance: Number.POSITIVE_INFINITY };

  for (let index = 0; index < path.length - 1; index += 1) {
    const distance = distanceToSegment(point, path[index], path[index + 1]);
    if (distance < best.distance) {
      // El tramo cuenta como la muestra que ya se ha dejado atrás, para que el
      // avance no se adelante a donde está el dedo de verdad.
      best = { index, distance };
    }
  }

  const last = path[path.length - 1];
  const distanceToLast = Math.hypot(point.x - last.x, point.y - last.y);
  if (distanceToLast < best.distance) {
    best = { index: path.length - 1, distance: distanceToLast };
  }

  return best;
}

/** Con llegar a la penúltima muestra basta: el final no se pide al milímetro. */
export function isTracingComplete(reached: number): boolean {
  return reached >= TRACING_SAMPLES - 2;
}

/**
 * Precisión: qué parte del recorrido se hizo dentro del carril. Sin muestras
 * todavía es 100 —el trazo empieza perfecto y se estropea solo—, igual que
 * cuenta Parejas sus intentos.
 */
export function tracingAccuracy(inside: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((inside / total) * 100);
}

/** Tres estrellas es excelente, dos bien, una es "inténtalo otra vez". */
export function tracingStars(accuracy: number): number {
  if (accuracy >= 88) return 3;
  if (accuracy >= 68) return 2;
  return 1;
}

/**
 * La valoración de la sesión entera, de cero a tres estrellas.
 *
 * No sustituye a las estrellas de cada trazo, que se siguen ganando una a una
 * y son lo que ve el niño mientras juega: esto resume la sesión, y es lo único
 * que decide si se abre el escalón siguiente.
 *
 * Una sesión sin terminar vale cero. No es un castigo por rendirse: es que no
 * hay sesión que valorar, y abandonar a mitad no puede desbloquear nada.
 *
 * El nivel ya no se mueve solo. Antes esta lógica subía y bajaba la dificultad
 * a espaldas del niño; ahora la elige él entre las desbloqueadas y no cambia
 * durante la partida.
 */
export function tracingSessionStars(
  exerciseStars: number,
  completed: number,
  total: number,
): Stars {
  if (total <= 0 || completed < total) return 0;

  const average = exerciseStars / total;
  if (average >= 2.6) return 3;
  if (average >= 2) return 2;
  return 1;
}

export function clampTracingLevel(level: number): TracingLevel {
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= TRACING_MAX_LEVEL) return TRACING_MAX_LEVEL;
  return rounded as TracingLevel;
}

/* --------------------------------------------------------------------------
 * Banco de ejercicios
 *
 * Un ejercicio es contenido, no código: el nivel dice la forma del camino y la
 * tolerancia, y la pareja de figuras enseña vocabulario. Por eso están aquí en
 * una tabla plana con la misma forma que tendría una fila de base de datos, y
 * no repartidos por el componente.
 * ----------------------------------------------------------------------- */

export const TRACING_EXERCISES: TracingExercise[] = [
  {
    id: "dog-puppy",
    level: 1,
    category: "animals",
    start: { emoji: "🐕", word: { en: "Dog", es: "Perro" } },
    target: { emoji: "🐶", word: { en: "Puppy", es: "Cachorro" } },
    pathType: "vertical",
  },
  {
    id: "cow-barn",
    level: 1,
    category: "animals",
    start: { emoji: "🐄", word: { en: "Cow", es: "Vaca" } },
    target: { emoji: "🛖", word: { en: "Barn", es: "Establo" } },
    pathType: "horizontal",
  },
  {
    id: "car-house",
    level: 1,
    category: "transport",
    start: { emoji: "🚗", word: { en: "Car", es: "Carro" } },
    target: { emoji: "🏠", word: { en: "House", es: "Casa" } },
    pathType: "horizontal",
  },
  {
    id: "apple-basket",
    level: 1,
    category: "food",
    start: { emoji: "🍎", word: { en: "Apple", es: "Manzana" } },
    target: { emoji: "🧺", word: { en: "Basket", es: "Canasta" } },
    pathType: "vertical",
  },
  {
    id: "one-finger",
    level: 1,
    category: "numbers",
    start: { emoji: "1️⃣", word: { en: "One", es: "Uno" } },
    target: { emoji: "☝️", word: { en: "Finger", es: "Dedo" } },
    pathType: "vertical",
  },
  {
    id: "bee-flower",
    level: 2,
    category: "animals",
    start: { emoji: "🐝", word: { en: "Bee", es: "Abeja" } },
    target: { emoji: "🌻", word: { en: "Flower", es: "Flor" } },
    pathType: "diagonal",
  },
  {
    id: "pencil-school",
    level: 2,
    category: "school",
    start: { emoji: "✏️", word: { en: "Pencil", es: "Lápiz" } },
    target: { emoji: "🏫", word: { en: "School", es: "Escuela" } },
    pathType: "corner",
  },
  {
    id: "red-strawberry",
    level: 2,
    category: "colors",
    start: { emoji: "🔴", word: { en: "Red", es: "Rojo" } },
    target: { emoji: "🍓", word: { en: "Strawberry", es: "Fresa" } },
    pathType: "diagonal",
  },
  {
    id: "five-hand",
    level: 2,
    category: "numbers",
    start: { emoji: "5️⃣", word: { en: "Five", es: "Cinco" } },
    target: { emoji: "🖐️", word: { en: "Hand", es: "Mano" } },
    pathType: "corner",
  },
  {
    id: "banana-monkey",
    level: 2,
    category: "food",
    start: { emoji: "🍌", word: { en: "Banana", es: "Banano" } },
    target: { emoji: "🐒", word: { en: "Monkey", es: "Mono" } },
    pathType: "diagonal",
  },
  {
    id: "fish-ocean",
    level: 3,
    category: "places",
    start: { emoji: "🐟", word: { en: "Fish", es: "Pez" } },
    target: { emoji: "🌊", word: { en: "Ocean", es: "Océano" } },
    pathType: "wave",
  },
  {
    id: "bird-nest",
    level: 3,
    category: "animals",
    start: { emoji: "🐦", word: { en: "Bird", es: "Pájaro" } },
    target: { emoji: "🪹", word: { en: "Nest", es: "Nido" } },
    pathType: "hill",
  },
  {
    id: "yellow-sun",
    level: 3,
    category: "colors",
    start: { emoji: "🟡", word: { en: "Yellow", es: "Amarillo" } },
    target: { emoji: "☀️", word: { en: "Sun", es: "Sol" } },
    pathType: "hill",
  },
  {
    id: "bread-bakery",
    level: 3,
    category: "food",
    start: { emoji: "🥖", word: { en: "Bread", es: "Pan" } },
    target: { emoji: "🧑‍🍳", word: { en: "Baker", es: "Panadero" } },
    pathType: "wave",
  },
  {
    id: "crayon-paper",
    level: 3,
    category: "school",
    start: { emoji: "🖍️", word: { en: "Crayon", es: "Crayón" } },
    target: { emoji: "📄", word: { en: "Paper", es: "Papel" } },
    pathType: "wave",
  },
  {
    id: "plane-airport",
    level: 4,
    category: "transport",
    start: { emoji: "✈️", word: { en: "Airplane", es: "Avión" } },
    target: { emoji: "🛄", word: { en: "Airport", es: "Aeropuerto" } },
    pathType: "zigzag",
  },
  {
    id: "book-backpack",
    level: 4,
    category: "school",
    start: { emoji: "📚", word: { en: "Books", es: "Libros" } },
    target: { emoji: "🎒", word: { en: "Backpack", es: "Mochila" } },
    pathType: "sWave",
  },
  {
    id: "two-eyes",
    level: 4,
    category: "numbers",
    start: { emoji: "2️⃣", word: { en: "Two", es: "Dos" } },
    target: { emoji: "👀", word: { en: "Eyes", es: "Ojos" } },
    pathType: "sWave",
  },
  {
    id: "koala-australia",
    level: 4,
    category: "countries",
    start: { emoji: "🐨", word: { en: "Koala", es: "Koala" } },
    target: { emoji: "🇦🇺", word: { en: "Australia", es: "Australia" } },
    pathType: "zigzag",
  },
  {
    id: "tower-france",
    level: 4,
    category: "countries",
    start: { emoji: "🗼", word: { en: "Tower", es: "Torre" } },
    target: { emoji: "🇫🇷", word: { en: "France", es: "Francia" } },
    pathType: "sWave",
  },
  {
    id: "train-station",
    level: 5,
    category: "transport",
    start: { emoji: "🚂", word: { en: "Train", es: "Tren" } },
    target: { emoji: "🚉", word: { en: "Station", es: "Estación" } },
    pathType: "snake",
  },
  {
    id: "turtle-beach",
    level: 5,
    category: "places",
    start: { emoji: "🐢", word: { en: "Turtle", es: "Tortuga" } },
    target: { emoji: "🏖️", word: { en: "Beach", es: "Playa" } },
    pathType: "longWave",
  },
  {
    id: "taco-mexico",
    level: 5,
    category: "countries",
    start: { emoji: "🌮", word: { en: "Taco", es: "Taco" } },
    target: { emoji: "🇲🇽", word: { en: "Mexico", es: "México" } },
    pathType: "longWave",
  },
  {
    id: "butterfly-blossom",
    level: 5,
    category: "animals",
    start: { emoji: "🦋", word: { en: "Butterfly", es: "Mariposa" } },
    target: { emoji: "🌸", word: { en: "Blossom", es: "Flor de cerezo" } },
    pathType: "longWave",
  },
  {
    id: "green-tree",
    level: 5,
    category: "colors",
    start: { emoji: "🟢", word: { en: "Green", es: "Verde" } },
    target: { emoji: "🌳", word: { en: "Tree", es: "Árbol" } },
    pathType: "snake",
  },
];

export function shuffleTracingItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Los ejercicios de una sesión: los de su nivel, revueltos, y si el nivel no
 * tiene bastantes se completa con los del nivel anterior antes que repetir uno
 * dos veces en la misma sesión.
 */
export function createTracingSession(level: TracingLevel): TracingExercise[] {
  const chosen = shuffleTracingItems(
    TRACING_EXERCISES.filter((exercise) => exercise.level === level),
  );

  let fallbackLevel = level;
  while (chosen.length < TRACING_EXERCISES_PER_SESSION && fallbackLevel > 1) {
    fallbackLevel -= 1;
    chosen.push(
      ...shuffleTracingItems(
        TRACING_EXERCISES.filter(
          (exercise) => exercise.level === fallbackLevel,
        ),
      ),
    );
  }

  return chosen.slice(0, TRACING_EXERCISES_PER_SESSION);
}
