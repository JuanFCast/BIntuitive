/*
 * Comprueba la migración del progreso guardado.
 *
 * El progreso educativo vive solo en el dispositivo de quien juega: si una
 * migración lo pierde, no hay copia en ningún servidor de la que recuperarlo.
 * Por eso esto no es una prueba de cortesía sino la red que sostiene el puente
 * entre la versión 1 del progreso y la 2, y debe seguir en verde hasta que ese
 * puente se retire (ver `projectLegacyProgress` en `src/lib/progressModel.ts`).
 *
 * Ejecuta el `storage.ts` de verdad, no una copia, contra un `localStorage`
 * fingido: lo único que se sustituye es el almacén del navegador. Se lanza con
 * `npm run check:migration` y se compila igual que el validador de contenido.
 */
import {
  PROGRESS_VERSION,
  clearProgress,
  getProgress,
  getUnassignedGameProgress,
  hasGameProgress,
  saveSession,
  saveWordScrambleProgress,
} from "@/lib/storage";
import { UNASSIGNED_GRADE } from "@/lib/grade";

const store = new Map<string, string>();

(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
};

const PROGRESS_KEY = "bintuitive-progress";
let checks = 0;
let failures = 0;

function check(label: string, condition: boolean, detail = ""): void {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`  FALLA ${label}${detail ? ` — ${detail}` : ""}`);
}

function raw(): Record<string, unknown> {
  return JSON.parse(store.get(PROGRESS_KEY) ?? "{}");
}

/** Un dispositivo real de antes del modelo por grado y dificultad. */
const V1 = {
  sessions: [
    { date: "2026-08-01T10:00:00.000Z", category: "lugares", stars: 4, total: 5 },
    { date: "2026-08-03T10:00:00.000Z", category: "lugares", stars: 5, total: 5 },
    { date: "2026-08-04T10:00:00.000Z", category: "colores", stars: 2, total: 5 },
  ],
  totalStars: 11,
  levelByCategory: { lugares: 3, colores: 2 },
  // A propósito el nombre antiguo del juego, que es lo que hay guardado en
  // dispositivos que no han vuelto a abrir la aplicación desde el cambio.
  wordPuzzle: { level: 2, bestPerfectWords: 7 },
  wordSearch: { level: 3, bestWordsFound: 9 },
  tracing: {
    level: 4,
    completed: 12,
    stars: 20,
    bestAccuracy: 91,
    attempts: 15,
  },
};

console.log("\n1. Conserva niveles y mejores marcas de un dispositivo con datos v1");
store.set(PROGRESS_KEY, JSON.stringify(V1));
{
  const p = getProgress();
  const lugares = getUnassignedGameProgress(p, "lugares");
  const colores = getUnassignedGameProgress(p, "colores");
  const scramble = getUnassignedGameProgress(p, "scramble");
  const search = getUnassignedGameProgress(p, "search");
  const tracing = getUnassignedGameProgress(p, "tracing");

  check("version pasa a 2", p.version === PROGRESS_VERSION, `${p.version}`);
  check("lugares conserva el nivel 3", lugares.difficulty === 3 && lugares.unlocked === 3);
  check("lugares conserva su mejor marca (5 aciertos)", lugares.best.firstTryCorrect === 5);
  check("lugares obtiene 3 estrellas de un 5/5", lugares.stars === 3, `${lugares.stars}`);
  check("lugares cuenta sus 2 sesiones", lugares.sessions === 2);
  check("lugares recuerda la última fecha", lugares.lastPlayedAt === "2026-08-03T10:00:00.000Z");
  check("colores conserva el nivel 2", colores.difficulty === 2);
  check("colores obtiene 0 estrellas de un 2/5", colores.stars === 0, `${colores.stars}`);
  check("scramble se lee del campo heredado wordPuzzle", scramble.difficulty === 2);
  check("scramble conserva sus 7 palabras perfectas", scramble.best.perfectWords === 7);
  check("search conserva nivel 3 y 9 palabras", search.difficulty === 3 && search.best.wordsFound === 9);
  check("search deja en null lo que nunca se midió", search.best.fewestMisses === null);
  check("tracing conserva el nivel 4", tracing.difficulty === 4);
  check(
    "tracing conserva precisión, completados e intentos",
    tracing.best.accuracy === 91 && tracing.best.completed === 12 && tracing.best.attempts === 15,
  );
  check("visual sigue sin progreso", !hasGameProgress(p, UNASSIGNED_GRADE, "visual"));
}

console.log("\n2. Todo lo anterior queda en 'unassigned', sin inventar un grado");
{
  const p = getProgress();
  const grades = Object.keys(p.byGrade);
  check(
    "solo existe la clave unassigned",
    grades.length === 1 && grades[0] === UNASSIGNED_GRADE,
    grades.join(","),
  );
  check("no hay ningún grado real creado", !grades.includes("pre-k") && !grades.includes("kindergarten"));
}

console.log("\n3. Repetirla no duplica ni cambia nada");
{
  const first = JSON.stringify(getProgress().byGrade);
  const second = JSON.stringify(getProgress().byGrade);
  const third = JSON.stringify(getProgress().byGrade);
  check("tres lecturas seguidas dan el mismo resultado", first === second && second === third);

  // Guardar el resultado proyectado es lo que pasará en cuanto cualquier juego
  // escriba: a partir de ahí la proyección se junta consigo misma.
  store.set(PROGRESS_KEY, JSON.stringify(getProgress()));
  check("guardar y releer no altera el resultado", JSON.stringify(getProgress().byGrade) === first);
  store.set(PROGRESS_KEY, JSON.stringify(getProgress()));
  check("guardar dos veces tampoco", JSON.stringify(getProgress().byGrade) === first);
  check(
    "no se duplican actividades",
    Object.keys(getProgress().byGrade[UNASSIGNED_GRADE] ?? {}).length === 5,
    Object.keys(getProgress().byGrade[UNASSIGNED_GRADE] ?? {}).join(","),
  );
}

console.log("\n4. No sobrescribe ni borra las claves anteriores");
{
  store.set(PROGRESS_KEY, JSON.stringify(V1));
  getProgress();
  check("una lectura no toca lo guardado", store.get(PROGRESS_KEY) === JSON.stringify(V1));

  // Un juego que todavía escribe a la manera antigua, que es lo que hacen los
  // nueve mientras el puente siga en pie.
  saveSession({ date: "2026-09-20T09:00:00.000Z", category: "numeros", stars: 5, total: 5 }, 2);
  saveWordScrambleProgress({ level: 3, bestPerfectWords: 4 });
  const stored = raw();

  check("sobrevive wordPuzzle", JSON.stringify(stored.wordPuzzle) === JSON.stringify(V1.wordPuzzle));
  check("sobrevive wordSearch", JSON.stringify(stored.wordSearch) === JSON.stringify(V1.wordSearch));
  check("sobrevive tracing", JSON.stringify(stored.tracing) === JSON.stringify(V1.tracing));
  check("sobreviven los niveles por categoría", (stored.levelByCategory as Record<string, number>).lugares === 3);
  check("sobreviven las sesiones anteriores", (stored.sessions as unknown[]).length === 4);
  check(
    "la escritura antigua no baja la mejor marca",
    getUnassignedGameProgress(getProgress(), "scramble").best.perfectWords === 7,
  );

  const after = getProgress();
  check("lo escrito por el juego aparece en el modelo nuevo", getUnassignedGameProgress(after, "numeros").difficulty === 2);
  check("y no se pierde nada de lo anterior", getUnassignedGameProgress(after, "tracing").difficulty === 4);
}

console.log("\n4b. Un dato de la versión 1 nunca rebaja uno de la versión 2");
{
  // Lo que habrá en cuanto los juegos escriban en `byGrade`: el modelo nuevo
  // por delante del antiguo en todo, y el antiguo aún presente.
  store.set(
    PROGRESS_KEY,
    JSON.stringify({
      ...V1,
      wordSearch: { level: 3, bestWordsFound: 9 },
      byGrade: {
        [UNASSIGNED_GRADE]: {
          search: {
            difficulty: 2,
            unlocked: 4,
            stars: 3,
            sessions: 9,
            lastPlayedAt: "2026-09-19T08:00:00.000Z",
            best: { wordsFound: 12, fewestMisses: 1 },
          },
        },
      },
    }),
  );
  const search = getUnassignedGameProgress(getProgress(), "search");

  check("una marca antigua peor no rebaja la nueva", search.best.wordsFound === 12, `${search.best.wordsFound}`);
  check("lo que el modelo antiguo no mide no borra la marca nueva", search.best.fewestMisses === 1);
  check("el desbloqueo nunca baja", search.unlocked === 4, `${search.unlocked}`);
  check("las estrellas nunca bajan", search.stars === 3);
  check("las sesiones nunca bajan", search.sessions === 9);
  check("el escalón elegido lo manda el modelo nuevo", search.difficulty === 2, `${search.difficulty}`);
}

console.log("\n5. Un dispositivo sin progreso anterior empieza bien");
{
  store.clear();
  const p = getProgress();
  check("version 2 desde el primer momento", p.version === PROGRESS_VERSION);
  check("byGrade vacío", Object.keys(p.byGrade).length === 0);
  check("sin sesiones ni estrellas", p.sessions.length === 0 && p.totalStars === 0);
  check("ninguna actividad tiene progreso", !hasGameProgress(p, UNASSIGNED_GRADE, "tracing"));

  const fresh = getUnassignedGameProgress(p, "memory");
  check("preguntar por una actividad nueva da escalón 1", fresh.difficulty === 1 && fresh.unlocked === 1);
  check("sin estrellas y sin marcas", fresh.stars === 0 && fresh.best.accuracy === null);

  clearProgress();
  check("borrar sin datos no rompe", getProgress().version === PROGRESS_VERSION);

  store.set(PROGRESS_KEY, "{ esto no es json");
  check("un guardado corrupto no rompe", getProgress().byGrade !== undefined);
  store.set(PROGRESS_KEY, JSON.stringify({ byGrade: { "curso-inventado": { lugares: {} } } }));
  check("una clave de grado inventada se descarta", Object.keys(getProgress().byGrade).length === 1);
}

console.log(
  failures === 0
    ? `\nMigración comprobada — ${checks} comprobaciones, todas en verde.\n`
    : `\nMigración con fallos — ${failures} de ${checks} comprobaciones.\n`,
);
process.exit(failures === 0 ? 0 : 1);
