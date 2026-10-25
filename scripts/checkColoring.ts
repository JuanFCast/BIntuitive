/*
 * Comprueba las reglas de nivel, estrellas y desbloqueo de Colorear.
 *
 * Es el tercer juego con la escala de dificultad compartida, así que
 * comprueba lo mismo que Parejas —el escalón jugado, el desbloqueo que solo
 * sube, la mejor valoración que no baja y una sesión contada una vez— y
 * además lo suyo: que el reparto de colores no deje dos zonas vecinas del
 * mismo tono, que la paleta de cada escalón se use entera, y que el modo
 * cambie de hablado a numerado donde se dijo.
 *
 * Ejecuta el `storage.ts` de verdad contra un `localStorage` fingido, igual
 * que los otros tres. Se lanza con `npm run check:coloring`.
 */
import {
  getProgress,
  getUnassignedGameProgress,
  saveColoringResult,
  saveMemoryResult,
} from "@/lib/storage";
import {
  buildColoringRound,
  buildColoringSession,
  clampColoringLevel,
  coloringAccuracy,
  coloringSessionStars,
  COLORING_COLORS,
  COLORING_LEVELS,
  COLORING_MAX_LEVEL,
  COLORING_PICTURES,
  COLORING_PICTURES_PER_SESSION,
  picturesForLevel,
  type ColoringLevel,
} from "@/lib/coloringGame";
import type { Difficulty, Stars } from "@/lib/difficulty";

const store = new Map<string, string>();

(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
};

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

function coloring() {
  return getUnassignedGameProgress(getProgress(), "coloring");
}

/** Una sesión terminada del nivel indicado, con la valoración que se diga. */
function play(
  level: Difficulty,
  sessionStars: Stars,
  extra: { accuracy?: number; pictures?: number } = {},
): void {
  saveColoringResult({
    playedLevel: level,
    sessionStars,
    accuracy: extra.accuracy ?? 70,
    pictures: extra.pictures ?? COLORING_PICTURES_PER_SESSION,
    playedAt: "2026-10-25T11:00:00.000Z",
  });
}

const LEVELS = [1, 2, 3, 4, 5] as const;

console.log("\nLa tabla de escalones es la acordada");
{
  const modes = LEVELS.map((level) => COLORING_LEVELS[level].mode);
  check(
    "hablado en 1 y 2, numerado del 3 al 5",
    modes.join(",") === "spoken,spoken,key,key,key",
    modes.join(","),
  );
  const sizes = LEVELS.map((level) => COLORING_LEVELS[level].palette.length);
  check(
    "la paleta nunca encoge al subir de nivel",
    sizes.every((size, index) => index === 0 || size >= sizes[index - 1]),
    sizes.join(","),
  );
  check("cinco escalones", COLORING_MAX_LEVEL === 5);
  check(
    "ningún escalón pide un color que no existe",
    LEVELS.every((level) =>
      COLORING_LEVELS[level].palette.every((id) => Boolean(COLORING_COLORS[id])),
    ),
  );
}

console.log("\nCada escalón tiene láminas para una sesión entera");
for (const level of LEVELS) {
  const pictures = picturesForLevel(level);
  check(
    `nivel ${level}: ${pictures.length} láminas para sesiones de ${COLORING_PICTURES_PER_SESSION}`,
    pictures.length >= COLORING_PICTURES_PER_SESSION,
  );
}

console.log("\nEl reparto de colores");
for (const level of LEVELS) {
  const palette = COLORING_LEVELS[level].palette;
  for (const picture of picturesForLevel(level)) {
    const round = buildColoringRound(picture, level);

    check(
      `${picture.id}: ninguna zona vecina repite color`,
      round.tasks.every(
        (task, index) => index === 0 || task.colorId !== round.tasks[index - 1].colorId,
      ),
    );
    check(
      `${picture.id}: la paleta se usa entera`,
      new Set(round.tasks.map((task) => task.colorId)).size === palette.length,
    );
    check(
      `${picture.id}: cada número apunta a su color de la paleta`,
      round.tasks.every((task) => round.palette[task.key - 1] === task.colorId),
    );
    check(
      `${picture.id}: todas las zonas tienen tarea`,
      round.tasks.length === picture.regions.length,
    );
  }
}

console.log("\nLa sesión");
{
  const session = buildColoringSession(3);
  check(
    "trae tantas láminas como dice la constante",
    session.length === COLORING_PICTURES_PER_SESSION,
    `${session.length}`,
  );
  check(
    "sin repetir lámina dentro de la misma sesión",
    new Set(session.map((round) => round.picture.id)).size === session.length,
  );
  check(
    "y todas son del nivel pedido",
    session.every((round) => round.picture.level === 3),
  );
}

console.log("\nLas estrellas de la sesión");
{
  check("sin terminar no hay estrellas", coloringSessionStars(100, false) === 0);
  check("terminar vale una", coloringSessionStars(50, true) === 1);
  check("66 % vale dos", coloringSessionStars(66, true) === 2);
  check("85 % vale tres", coloringSessionStars(85, true) === 3);
  check("justo por debajo de dos se queda en una", coloringSessionStars(65, true) === 1);
  check("sin toques la precisión es 100", coloringAccuracy(0, 0) === 100);
  check("ocho de diez toques es 80", coloringAccuracy(10, 8) === 80);
}

console.log("\nEl desbloqueo solo sube");
{
  check("se empieza con el nivel 1", coloring().unlocked === 1);

  play(1, 1);
  check("una estrella no abre nada", coloring().unlocked === 1, `${coloring().unlocked}`);

  play(1, 2);
  check("dos estrellas abren el 2", coloring().unlocked === 2);

  play(2, 3);
  check("tres estrellas abren el 3", coloring().unlocked === 3);

  play(1, 3);
  check(
    "bordar un nivel bajo no abre por encima de lo ya abierto",
    coloring().unlocked === 3,
    `${coloring().unlocked}`,
  );

  play(3, 0);
  check("una mala sesión no cierra nada", coloring().unlocked === 3);
  check("y el escalón guardado es el último jugado", coloring().difficulty === 3);
}

console.log("\nLas marcas");
{
  play(3, 3, { accuracy: 95, pictures: 2 });
  const best = coloring().best;
  check("la precisión se queda con la mejor", best.accuracy === 95, `${best.accuracy}`);

  play(3, 1, { accuracy: 40, pictures: 2 });
  check(
    "y una peor no la rebaja",
    coloring().best.accuracy === 95,
    `${coloring().best.accuracy}`,
  );
  check(
    "las láminas se acumulan en vez de sustituirse",
    (coloring().best.pictures ?? 0) >= 12,
    `${coloring().best.pictures}`,
  );
  check("la mejor valoración no baja", coloring().stars === 3);
}

console.log("\nColorear no pisa a nadie");
{
  saveMemoryResult({
    playedLevel: 2,
    sessionStars: 3,
    accuracy: 92,
    timeMs: 30000,
    playedAt: "2026-10-25T12:00:00.000Z",
  });
  const before = coloring();
  play(4, 2);
  check(
    "guardar Colorear deja Parejas como estaba",
    getUnassignedGameProgress(getProgress(), "memory").best.accuracy === 92,
  );
  check(
    "y guardar Parejas no tocó lo de Colorear",
    before.best.accuracy === 95,
    `${before.best.accuracy}`,
  );
}

console.log("\nEl recorte de nivel");
{
  check("por debajo de 1 se recorta a 1", clampColoringLevel(0) === 1);
  check("por encima de 5 se recorta a 5", clampColoringLevel(9) === 5);
  check("un decimal se redondea", clampColoringLevel(2.4) === 2);
  check(
    "toda lámina declara un nivel que existe",
    COLORING_PICTURES.every(
      (picture) => (picture.level as ColoringLevel) in COLORING_LEVELS,
    ),
  );
}

console.log(
  failures === 0
    ? `\nColorear comprobado — ${checks} comprobaciones, todas en verde.\n`
    : `\nColorear con fallos — ${failures} de ${checks} comprobaciones.\n`,
);
process.exit(failures === 0 ? 0 : 1);
