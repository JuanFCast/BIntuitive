/*
 * Comprueba las reglas de nivel, estrellas y desbloqueo de Parejas.
 *
 * Es el segundo juego con la escala de dificultad compartida y el primero que
 * la estrena sin haber guardado nada antes, así que además de las reglas
 * comprueba que su tabla de escalones sea coherente —un tablero que no reparte
 * en sus columnas se vería roto en pantalla— y que guardar Parejas no toque el
 * progreso de ningún otro juego.
 *
 * Ejecuta el `storage.ts` de verdad contra un `localStorage` fingido, igual
 * que `check:migration` y `check:tracing`. Se lanza con `npm run check:memory`.
 */
import {
  getProgress,
  getUnassignedGameProgress,
  saveMemoryResult,
  saveTracingResult,
} from "@/lib/storage";
import {
  createMemoryBoard,
  memorySessionStars,
  MEMORY_LEVELS,
  MEMORY_MAX_LEVEL,
  MEMORY_MAX_PAIRS,
  MEMORY_SYMBOLS,
} from "@/lib/memoryGame";
import type { Difficulty, Stars } from "@/lib/difficulty";

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

function memory() {
  return getUnassignedGameProgress(getProgress(), "memory");
}

/** Una partida terminada del nivel indicado, con la valoración que se diga. */
function play(
  level: Difficulty,
  sessionStars: Stars,
  extra: { accuracy?: number; timeMs?: number } = {},
): void {
  saveMemoryResult({
    playedLevel: level,
    sessionStars,
    accuracy: extra.accuracy ?? 70,
    timeMs: extra.timeMs ?? 60000,
    playedAt: "2026-09-21T11:00:00.000Z",
  });
}

console.log("\nLa tabla de escalones es la aprobada y coherente");
{
  const levels = [1, 2, 3, 4, 5] as const;
  const pairs = levels.map((level) => MEMORY_LEVELS[level].pairs);
  const columns = levels.map((level) => MEMORY_LEVELS[level].columns);
  const flips = levels.map((level) => MEMORY_LEVELS[level].flipBackMs);

  check("parejas 3, 4, 6, 8, 8", pairs.join(",") === "3,4,6,8,8", pairs.join(","));
  check("columnas 3, 4, 3, 4, 4", columns.join(",") === "3,4,3,4,4", columns.join(","));
  check(
    "destape 1400, 1200, 1000, 850, 700 ms",
    flips.join(",") === "1400,1200,1000,850,700",
    flips.join(","),
  );
  check(
    "el destape nunca se alarga al subir",
    flips.every((ms, index) => index === 0 || ms < flips[index - 1]),
  );
  check(
    "cada tablero reparte entero en sus columnas",
    levels.every(
      (level) => (MEMORY_LEVELS[level].pairs * 2) % MEMORY_LEVELS[level].columns === 0,
    ),
  );
  check("ocho parejas como máximo", MEMORY_MAX_PAIRS === 8, `${MEMORY_MAX_PAIRS}`);
  check("cinco escalones", MEMORY_MAX_LEVEL === 5);
  check(
    "el banco llena el tablero más grande y le sobra",
    MEMORY_SYMBOLS.length > MEMORY_MAX_PAIRS,
    `${MEMORY_SYMBOLS.length} símbolos`,
  );
}

console.log("\nCada tablero tiene exactamente sus parejas");
{
  for (const level of [1, 2, 3, 4, 5] as const) {
    const wanted = MEMORY_LEVELS[level].pairs;
    const board = createMemoryBoard(wanted);
    const bySymbol = new Map<string, number>();
    for (const card of board) {
      bySymbol.set(card.symbol.id, (bySymbol.get(card.symbol.id) ?? 0) + 1);
    }
    check(
      `nivel ${level}: ${wanted * 2} fichas, ${wanted} símbolos, cada uno dos veces`,
      board.length === wanted * 2 &&
        bySymbol.size === wanted &&
        [...bySymbol.values()].every((count) => count === 2),
    );
  }
}

console.log("\nEstrellas de la partida, por la precisión");
{
  check("sin terminar → 0", memorySessionStars(100, false) === 0);
  check("59 % → 1", memorySessionStars(59, true) === 1);
  check("60 % justo → 2", memorySessionStars(60, true) === 2);
  check("79 % → 2", memorySessionStars(79, true) === 2);
  check("80 % justo → 3", memorySessionStars(80, true) === 3);
  check("100 % → 3", memorySessionStars(100, true) === 3);
}

console.log("\n1. Un usuario nuevo solo tiene el nivel 1");
{
  store.clear();
  const m = memory();
  check("desbloqueado hasta el 1", m.unlocked === 1, `${m.unlocked}`);
  check("elegido el 1", m.difficulty === 1);
  check("sin estrellas ni partidas", m.stars === 0 && m.sessions === 0);
  check(
    "sin marcas",
    m.best.accuracy === null && m.best.fastestMs === null && m.best.fastestLevel === null,
  );
}

console.log("\n2. Una estrella no desbloquea");
{
  store.clear();
  play(1, 1, { accuracy: 50 });
  check("sigue abierto solo el 1", memory().unlocked === 1, `${memory().unlocked}`);
  check("la partida sí cuenta", memory().sessions === 1);
}

console.log("\n3. Dos estrellas desbloquean el siguiente");
{
  store.clear();
  play(1, 2, { accuracy: 65 });
  check("se abre el 2", memory().unlocked === 2, `${memory().unlocked}`);
}

console.log("\n4. Tres estrellas desbloquean el siguiente");
{
  store.clear();
  play(1, 3, { accuracy: 90 });
  play(2, 3, { accuracy: 85 });
  check("se abre el 3", memory().unlocked === 3, `${memory().unlocked}`);
  check("el elegido es el último jugado", memory().difficulty === 2);
}

console.log("\n5. Repetir con peor resultado no rebaja nada");
{
  store.clear();
  play(1, 3, { accuracy: 95 });
  const before = memory();
  play(1, 1, { accuracy: 40 });
  const after = memory();

  check("la mejor precisión aguanta", after.best.accuracy === 95, `${after.best.accuracy}`);
  check("las mejores estrellas aguantan", after.stars === 3, `${after.stars}`);
  check("lo desbloqueado aguanta", after.unlocked === before.unlocked);
}

console.log("\n6. Cada partida cuenta una sola vez");
{
  store.clear();
  play(1, 2);
  play(1, 2);
  check("dos partidas", memory().sessions === 2, `${memory().sessions}`);
  getProgress();
  getProgress();
  check("releer no suma nada", memory().sessions === 2);
}

console.log("\n7. Abandonar no desbloquea ni da estrellas");
{
  store.clear();
  play(1, 2);
  const before = memory();
  // El juego no guarda al abandonar; aunque llegara una partida sin terminar,
  // valdría cero y no abriría nada.
  play(2, memorySessionStars(100, false));
  const after = memory();
  check("no se abre el 3", after.unlocked === before.unlocked, `${after.unlocked}`);
  check("la mejor valoración no baja", after.stars === 2);
}

console.log("\n8. El nivel 5 no crea un nivel 6");
{
  store.clear();
  for (const level of [1, 2, 3, 4] as const) play(level, 3);
  check("abierto hasta el 5", memory().unlocked === 5, `${memory().unlocked}`);
  play(5, 3);
  play(5, 3);
  check("sigue siendo 5", memory().unlocked === 5, `${memory().unlocked}`);
}

console.log("\n9. Recargar conserva nivel, desbloqueo y marcas");
{
  store.clear();
  play(1, 2, { accuracy: 70, timeMs: 30000 });
  play(2, 3, { accuracy: 88, timeMs: 45000 });
  const saved = JSON.stringify(memory());
  const reloaded = memory();
  check("todo idéntico tras recargar", JSON.stringify(reloaded) === saved);
  check("el nivel elegido sobrevive", reloaded.difficulty === 2);
  check("lo desbloqueado sobrevive", reloaded.unlocked === 3);
  check("la mejor precisión sobrevive", reloaded.best.accuracy === 88);
  check("la fecha sobrevive", reloaded.lastPlayedAt === "2026-09-21T11:00:00.000Z");
}

console.log("\n10. El mejor tiempo va con su tablero");
{
  store.clear();
  play(3, 2, { timeMs: 50000 });
  check("primer récord, nivel 3", memory().best.fastestMs === 50000 && memory().best.fastestLevel === 3);

  play(1, 2, { timeMs: 9000 });
  check(
    "un tiempo del nivel 1 no pisa el récord del 3",
    memory().best.fastestMs === 50000 && memory().best.fastestLevel === 3,
    `${memory().best.fastestMs} en ${memory().best.fastestLevel}`,
  );

  play(3, 2, { timeMs: 55000 });
  check("uno más lento del mismo nivel tampoco", memory().best.fastestMs === 50000);

  play(3, 2, { timeMs: 42000 });
  check("uno más rápido del mismo nivel sí", memory().best.fastestMs === 42000);

  play(4, 2, { timeMs: 80000 });
  check(
    "un tablero mayor pasa a ser el récord aunque tarde más",
    memory().best.fastestMs === 80000 && memory().best.fastestLevel === 4,
  );
}

console.log("\n11. Guardar Parejas no toca a ningún otro juego");
{
  store.clear();
  saveTracingResult({
    playedLevel: 2,
    sessionStars: 2,
    exerciseStars: 11,
    completed: 5,
    accuracy: 81,
    attempts: 3,
    playedAt: "2026-09-21T10:00:00.000Z",
  });
  const tracingBefore = JSON.stringify(
    getUnassignedGameProgress(getProgress(), "tracing"),
  );
  const legacyTracingBefore = JSON.stringify(
    JSON.parse(store.get(PROGRESS_KEY)!).tracing,
  );

  play(1, 3, { accuracy: 100 });

  check(
    "Trazos sigue igual en el modelo nuevo",
    JSON.stringify(getUnassignedGameProgress(getProgress(), "tracing")) === tracingBefore,
  );
  check(
    "Trazos sigue igual en la versión 1",
    JSON.stringify(JSON.parse(store.get(PROGRESS_KEY)!).tracing) === legacyTracingBefore,
  );
  const raw = JSON.parse(store.get(PROGRESS_KEY)!);
  check(
    "Parejas no inventa un campo de la versión 1",
    !("memory" in raw) && !("memoryGame" in raw),
  );
}

console.log("\n12. El puente con la versión 1 no pisa Parejas");
{
  store.clear();
  play(1, 3, { accuracy: 92 });
  // Un dispositivo con datos antiguos de otros juegos: la proyección corre en
  // cada lectura y no puede llevarse nada de Parejas por delante.
  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  stored.levelByCategory = { lugares: 3 };
  stored.tracing = { level: 4, completed: 20, stars: 44, bestAccuracy: 89, attempts: 9 };
  store.set(PROGRESS_KEY, JSON.stringify(stored));

  const m = memory();
  check("Parejas conserva su desbloqueo", m.unlocked === 2, `${m.unlocked}`);
  check("Parejas conserva su precisión", m.best.accuracy === 92);
  check(
    "y lo antiguo de los demás sí aparece",
    getUnassignedGameProgress(getProgress(), "tracing").unlocked === 4,
  );
}

console.log(
  failures === 0
    ? `\nParejas comprobado — ${checks} comprobaciones, todas en verde.\n`
    : `\nParejas con fallos — ${failures} de ${checks} comprobaciones.\n`,
);
process.exit(failures === 0 ? 0 : 1);
