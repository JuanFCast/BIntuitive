import type { GameId } from "@/data/categories";
import type { CategoryId } from "@/data/questions";
import {
  clampDifficulty,
  clampStars,
  type Difficulty,
  type Stars,
} from "./difficulty";
import { UNASSIGNED_GRADE, isGradeKey, type GradeKey } from "./grade";

/**
 * El progreso de una actividad, igual para los nueve hexágonos.
 *
 * Deliberadamente sin `Record<string, number>`: una marca suelta sin nombre ni
 * unidad acaba guardando segundos donde se esperaban aciertos. Cada juego
 * declara abajo exactamente qué mide, y TypeScript no deja escribir la métrica
 * de un juego en otro.
 */
export type GameProgress<Id extends GameId = GameId> = {
  /** El escalón elegido la última vez. */
  difficulty: Difficulty;
  /** El más alto abierto. Nunca baja. */
  unlocked: Difficulty;
  /** La mejor valoración conseguida, de cero a tres. */
  stars: Stars;
  /** Cuántas sesiones se han jugado de esta actividad. */
  sessions: number;
  /** ISO, o `null` si el dato viene de antes de que se registrara. */
  lastPlayedAt: string | null;
  best: BestFor<Id>;
};

/** Las marcas propias de cada juego, con nombre y unidad. */
export type BestByGame = {
  lugares: { firstTryCorrect: number | null };
  numeros: { firstTryCorrect: number | null };
  colores: { firstTryCorrect: number | null };
  scramble: { perfectWords: number | null };
  search: { wordsFound: number | null; fewestMisses: number | null };
  /**
   * `fastestMs` solo tiene sentido junto al escalón en que se hizo: tres
   * parejas se terminan en un tercio del tiempo que ocho, y sin el nivel
   * repetir el primero dejaría un récord imbatible que haría parecer un
   * retroceso cualquier partida seria. `fastestLevel` dice de qué tablero es.
   */
  memory: {
    accuracy: number | null;
    fastestMs: number | null;
    fastestLevel: number | null;
  };
  visual: { fastestMs: number | null; fewestMistakes: number | null };
  typing: {
    wpm: number | null;
    accuracy: number | null;
    correctChars: number | null;
  };
  tracing: {
    accuracy: number | null;
    completed: number | null;
    attempts: number | null;
  };
};

export type BestFor<Id extends GameId> = BestByGame[Id];

/**
 * Hacia dónde es mejor cada métrica. Sin esto, juntar dos marcas es adivinar:
 * en milisegundos gana la más baja y en aciertos la más alta.
 *
 * `completed` y `attempts` de Trazos no son marcas sino acumuladores; quien
 * suma es el juego al cerrar su sesión, y aquí solo se conserva el total más
 * alto de los dos que se comparan.
 */
const BEST_DIRECTION: {
  [Id in GameId]: { [K in keyof BestByGame[Id]]: "higher" | "lower" };
} = {
  lugares: { firstTryCorrect: "higher" },
  numeros: { firstTryCorrect: "higher" },
  colores: { firstTryCorrect: "higher" },
  scramble: { perfectWords: "higher" },
  search: { wordsFound: "higher", fewestMisses: "lower" },
  // Estas dos direcciones solo sirven a la proyección del puente, que junta
  // campo a campo. Parejas no tiene campos de la versión 1, así que nunca le
  // llegan dos fuentes que juntar: el tiempo y su nivel los escribe siempre
  // juntos `saveMemoryResult`, que es quien sabe que van emparejados.
  memory: { accuracy: "higher", fastestMs: "lower", fastestLevel: "higher" },
  visual: { fastestMs: "lower", fewestMistakes: "lower" },
  typing: { wpm: "higher", accuracy: "higher", correctChars: "higher" },
  tracing: { accuracy: "higher", completed: "higher", attempts: "higher" },
};

export type GradeProgress = Partial<{
  [Id in GameId]: GameProgress<Id>;
}>;

export type ByGrade = Partial<Record<GradeKey, GradeProgress>>;

/*
 * Indexar `GradeProgress` con un `GameId` genérico da la intersección de los
 * nueve juegos, que no cumple ninguno: cada hueco guarda las métricas de su
 * juego y solo las suyas. Los dos ayudantes de aquí abajo ponen el tipo bueno
 * en la firma —donde importa, porque es lo que ve quien llama— y dejan el
 * acceso al hueco por detrás, en un solo sitio y no repartido por el archivo.
 */
function readGameProgress(
  grade: GradeProgress,
  id: GameId,
): GameProgress<GameId> | undefined {
  return (grade as Record<GameId, GameProgress<GameId> | undefined>)[id];
}

function writeGameProgress<Id extends GameId>(
  grade: GradeProgress,
  id: Id,
  value: GameProgress<Id>,
): void {
  (grade as Record<GameId, unknown>)[id] = value;
}

/** Todas las marcas del juego a `null`: se jugó o no, pero no se midió nada. */
function emptyBest<Id extends GameId>(id: Id): BestFor<Id> {
  const keys = Object.keys(BEST_DIRECTION[id]);
  return Object.fromEntries(keys.map((key) => [key, null])) as BestFor<Id>;
}

export function createGameProgress<Id extends GameId>(
  id: Id,
  overrides: Partial<GameProgress<Id>> = {},
): GameProgress<Id> {
  return {
    difficulty: 1,
    unlocked: 1,
    stars: 0,
    sessions: 0,
    lastPlayedAt: null,
    best: emptyBest(id),
    ...overrides,
  };
}

function counter(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.floor(value) : 0;
}

function isoOrNull(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

/** Deja una marca guardada en un número o en `null`, nunca en otra cosa. */
function metric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeBest<Id extends GameId>(id: Id, stored: unknown): BestFor<Id> {
  const source = (stored ?? {}) as Record<string, unknown>;
  const keys = Object.keys(BEST_DIRECTION[id]);
  return Object.fromEntries(
    keys.map((key) => [key, metric(source[key])]),
  ) as BestFor<Id>;
}

export function normalizeGameProgress<Id extends GameId>(
  id: Id,
  stored: unknown,
): GameProgress<Id> {
  const source = (stored ?? {}) as Record<string, unknown>;
  const unlocked = clampDifficulty(source.unlocked);
  // Lo elegido nunca puede estar por encima de lo abierto: un dato tocado a
  // mano no debe dejar a nadie jugando un escalón que no ha desbloqueado.
  const difficulty = clampDifficulty(
    Math.min(clampDifficulty(source.difficulty), unlocked),
  );

  return {
    difficulty,
    unlocked,
    stars: clampStars(source.stars),
    sessions: counter(source.sessions),
    lastPlayedAt: isoOrNull(source.lastPlayedAt),
    best: normalizeBest(id, source.best),
  };
}

function betterMetric(
  direction: "higher" | "lower",
  a: number | null,
  b: number | null,
): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return direction === "higher" ? Math.max(a, b) : Math.min(a, b);
}

/**
 * Junta dos versiones del progreso de una misma actividad.
 *
 * `base` es lo que ya estaba guardado en el modelo nuevo y manda en lo que es
 * una elección —el escalón elegido— porque es lo último que hizo quien juega.
 * En lo que es una marca gana la mejor de las dos, y en lo que es un candado
 * gana el más abierto: recordar de menos sería cerrarle a alguien un escalón
 * que ya se había ganado.
 *
 * **Garantía, y es la que sostiene todo el puente con el modelo antiguo: nada
 * que venga de la versión 1 puede rebajar ni sobrescribir lo que ya diga la
 * versión 2.** Las marcas se resuelven con `betterMetric`, que respeta el
 * sentido de cada una —en milisegundos gana la más baja, en aciertos la más
 * alta—; `unlocked`, `stars` y `sessions` solo suben; y una marca que el
 * modelo antiguo nunca supo medir llega como `null` y por tanto no borra la
 * que ya hubiera. Lo peor que puede pasar es que un dato antiguo no aporte
 * nada, nunca que quite.
 */
export function mergeGameProgress<Id extends GameId>(
  id: Id,
  base: GameProgress<Id> | undefined,
  incoming: GameProgress<Id>,
): GameProgress<Id> {
  if (!base) return incoming;

  const unlocked = clampDifficulty(Math.max(base.unlocked, incoming.unlocked));
  const directions = BEST_DIRECTION[id] as Record<string, "higher" | "lower">;
  const baseBest = base.best as Record<string, number | null>;
  const incomingBest = incoming.best as Record<string, number | null>;

  const best = Object.fromEntries(
    Object.keys(directions).map((key) => [
      key,
      betterMetric(directions[key], baseBest[key], incomingBest[key]),
    ]),
  ) as BestFor<Id>;

  const lastPlayedAt =
    base.lastPlayedAt && incoming.lastPlayedAt
      ? base.lastPlayedAt >= incoming.lastPlayedAt
        ? base.lastPlayedAt
        : incoming.lastPlayedAt
      : (base.lastPlayedAt ?? incoming.lastPlayedAt);

  return {
    difficulty: clampDifficulty(Math.min(base.difficulty, unlocked)),
    unlocked,
    stars: clampStars(Math.max(base.stars, incoming.stars)),
    sessions: Math.max(base.sessions, incoming.sessions),
    lastPlayedAt,
    best,
  };
}

/* --------------------------------------------------------------------------
 * Lo guardado antes de que existiera este modelo
 * ----------------------------------------------------------------------- */

/**
 * La forma de los campos antiguos, descrita estructuralmente para no depender
 * de `storage.ts` —que sí toca el navegador— y poder comprobar la migración
 * sin montar la aplicación.
 */
export type LegacySource = {
  sessions: readonly {
    date: string;
    category: CategoryId;
    stars: number;
    total: number;
  }[];
  levelByCategory: Partial<Record<CategoryId, number>>;
  wordScramble?: { level: number; bestPerfectWords: number };
  wordPuzzle?: { level: number; bestPerfectWords: number };
  wordSearch?: { level: number; bestWordsFound: number };
  tracing?: {
    level: number;
    completed: number;
    stars: number;
    bestAccuracy: number;
    attempts: number;
  };
};

/**
 * Las estrellas de una lección jugada con las reglas antiguas.
 *
 * Antes se contaban aciertos al primer intento sobre el total de la sesión;
 * ahora la valoración es de cero a tres. Se traduce con la tabla acordada
 * —todos, uno menos, dos menos— en vez de dar por perdida la única señal de
 * calidad que hay guardada.
 */
export function starsFromLessonSession(stars: number, total: number): Stars {
  if (total <= 0) return 0;
  if (stars >= total) return 3;
  if (stars >= total - 1) return 2;
  if (stars >= total - 2) return 1;
  return 0;
}

/**
 * Proyecta los campos antiguos sobre el modelo nuevo, bajo `unassigned`.
 *
 * **Esto es un puente temporal, no la forma definitiva de leer el progreso.**
 * Existe porque los nueve juegos todavía escriben en los campos de la versión
 * 1 (`levelByCategory`, `wordScramble`, `wordSearch`, `tracing`) y nadie
 * escribe aún en `byGrade`. Mientras dure esa situación hay dos modelos vivos
 * a la vez, y este puente es lo que impide que digan cosas distintas.
 *
 * Por eso no se ejecuta una vez y se da por hecho: se vuelve a calcular en
 * cada lectura y se junta con lo que ya hubiera guardado. Repetirla cuantas
 * veces sea da exactamente el mismo resultado, y una partida recién guardada a
 * la manera antigua aparece en el modelo nuevo en la siguiente lectura sin que
 * haga falta ninguna bandera de "ya migrado". Nada de lo antiguo se toca ni se
 * borra aquí: esta función solo lee.
 *
 * La dirección del puente es una sola, de la versión 1 hacia la 2. Lo que ya
 * esté en la 2 manda siempre: ver la garantía de `mergeGameProgress`.
 *
 * **Cuándo se puede retirar.** Cuando se cumplan las dos cosas:
 *
 * 1. Los nueve juegos tengan su tabla de dificultad y lean y escriban en
 *    `byGrade`, de forma que ningún camino de escritura toque ya los campos
 *    de la versión 1.
 * 2. Una versión publicada con este puente lleve el tiempo suficiente para que
 *    los dispositivos activos la hayan abierto al menos una vez, que es lo que
 *    deja su progreso ya proyectado y guardado en `byGrade`.
 *
 * Entonces, y no antes, se sube `PROGRESS_VERSION` a 3, se borra esta función
 * y se pueden quitar de `Progress` los campos de la versión 1 —incluido el
 * heredado `wordPuzzle`—. Quitarlos antes de (2) le borra el progreso a quien
 * no haya abierto la aplicación en ese intervalo.
 */
export function projectLegacyProgress(
  legacy: LegacySource,
  stored: ByGrade,
): ByGrade {
  const carried: GradeProgress = {};

  for (const [category, level] of Object.entries(legacy.levelByCategory)) {
    if (typeof level !== "number") continue;
    const id = category as CategoryId;
    const played = legacy.sessions.filter((session) => session.category === id);
    const bestStars = played.reduce<Stars>(
      (best, session) =>
        Math.max(
          best,
          starsFromLessonSession(session.stars, session.total),
        ) as Stars,
      0,
    );
    const bestCorrect = played.reduce(
      (best, session) => Math.max(best, session.stars),
      0,
    );

    writeGameProgress(
      carried,
      id,
      createGameProgress(id, {
        difficulty: clampDifficulty(level),
        unlocked: clampDifficulty(level),
        stars: bestStars,
        sessions: played.length,
        lastPlayedAt: isoOrNull(played[played.length - 1]?.date),
        best: { firstTryCorrect: played.length > 0 ? bestCorrect : null },
      }),
    );
  }

  // El nombre antiguo del juego sirve de respaldo, igual que en `storage.ts`.
  const scramble = legacy.wordScramble ?? legacy.wordPuzzle;
  if (scramble) {
    carried.scramble = createGameProgress("scramble", {
      difficulty: clampDifficulty(scramble.level),
      unlocked: clampDifficulty(scramble.level),
      best: { perfectWords: metric(scramble.bestPerfectWords) },
    });
  }

  if (legacy.wordSearch) {
    carried.search = createGameProgress("search", {
      difficulty: clampDifficulty(legacy.wordSearch.level),
      unlocked: clampDifficulty(legacy.wordSearch.level),
      best: {
        wordsFound: metric(legacy.wordSearch.bestWordsFound),
        // Nunca se guardó: no hay forma de inventarlo hacia atrás.
        fewestMisses: null,
      },
    });
  }

  if (legacy.tracing) {
    carried.tracing = createGameProgress("tracing", {
      difficulty: clampDifficulty(legacy.tracing.level),
      unlocked: clampDifficulty(legacy.tracing.level),
      best: {
        accuracy: metric(legacy.tracing.bestAccuracy),
        completed: metric(legacy.tracing.completed),
        attempts: metric(legacy.tracing.attempts),
      },
    });
  }

  const previous = stored[UNASSIGNED_GRADE] ?? {};
  const merged: GradeProgress = { ...previous };

  for (const key of Object.keys(carried)) {
    const id = key as GameId;
    const incoming = readGameProgress(carried, id);
    if (!incoming) continue;
    writeGameProgress(
      merged,
      id,
      mergeGameProgress(id, readGameProgress(previous, id), incoming),
    );
  }

  return { ...stored, [UNASSIGNED_GRADE]: merged };
}

/** Deja en su sitio lo guardado bajo cada grado, descartando claves raras. */
export function normalizeByGrade(stored: unknown): ByGrade {
  if (!stored || typeof stored !== "object") return {};
  const source = stored as Record<string, unknown>;
  const result: ByGrade = {};

  for (const [gradeKey, games] of Object.entries(source)) {
    if (!isGradeKey(gradeKey) || !games || typeof games !== "object") continue;
    const entries = games as Record<string, unknown>;
    const grade: GradeProgress = {};

    for (const gameKey of Object.keys(entries)) {
      if (!(gameKey in BEST_DIRECTION)) continue;
      const id = gameKey as GameId;
      writeGameProgress(grade, id, normalizeGameProgress(id, entries[gameKey]));
    }

    result[gradeKey] = grade;
  }

  return result;
}
