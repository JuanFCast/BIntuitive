/*
 * Comprueba las reglas de nivel, estrellas y desbloqueo de Trazos.
 *
 * Trazos es el primer juego que usa la escala de dificultad compartida, así
 * que estas reglas son las que van a copiar los otros ocho. Y lo que está en
 * juego es el progreso de un niño guardado solo en su dispositivo: un
 * desbloqueo que se pierde al recargar, o una mejor marca rebajada por repetir
 * un nivel fácil, no se recupera de ningún servidor.
 *
 * Ejecuta el `storage.ts` de verdad contra un `localStorage` fingido, igual
 * que `check:migration`. Se lanza con `npm run check:tracing`.
 */
import {
  getProgress,
  getUnassignedGameProgress,
  saveTracingResult,
} from "@/lib/storage";
import { tracingSessionStars } from "@/lib/tracingGame";
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

function tracing() {
  return getUnassignedGameProgress(getProgress(), "tracing");
}

/** Una sesión terminada del nivel indicado, con la valoración que se diga. */
function play(
  level: Difficulty,
  sessionStars: Stars,
  extra: { accuracy?: number; attempts?: number; exerciseStars?: number } = {},
): void {
  saveTracingResult({
    playedLevel: level,
    sessionStars,
    exerciseStars: extra.exerciseStars ?? sessionStars * 5,
    completed: 5,
    accuracy: extra.accuracy ?? 80,
    attempts: extra.attempts ?? 2,
    playedAt: "2026-09-21T10:00:00.000Z",
  });
}

console.log("\nEstrellas de la sesión, por la media de cada trazo");
{
  // Cinco trazos: la media es la suma partida por cinco.
  check("media 1,8 → 1 estrella", tracingSessionStars(9, 5, 5) === 1);
  check("media 1,99 → 1 estrella", tracingSessionStars(9.95, 5, 5) === 1);
  check("media 2,0 justa → 2 estrellas", tracingSessionStars(10, 5, 5) === 2);
  check("media 2,4 → 2 estrellas", tracingSessionStars(12, 5, 5) === 2);
  check("media 2,59 → 2 estrellas", tracingSessionStars(12.95, 5, 5) === 2);
  check("media 2,6 justa → 3 estrellas", tracingSessionStars(13, 5, 5) === 3);
  check("media 3,0 → 3 estrellas", tracingSessionStars(15, 5, 5) === 3);
  check(
    "sesión sin terminar → 0 estrellas",
    tracingSessionStars(12, 3, 5) === 0,
  );
}

console.log("\n1. Un usuario nuevo solo tiene el nivel 1");
{
  store.clear();
  const t = tracing();
  check("desbloqueado hasta el 1", t.unlocked === 1, `${t.unlocked}`);
  check("elegido el 1", t.difficulty === 1);
  check("sin estrellas ni sesiones", t.stars === 0 && t.sessions === 0);
  check("sin métricas", t.best.accuracy === null && t.best.completed === null);
}

console.log("\n2. Quien ya iba por el nivel 4 conserva del 1 al 4");
{
  store.clear();
  store.set(
    PROGRESS_KEY,
    JSON.stringify({
      sessions: [],
      totalStars: 0,
      levelByCategory: {},
      tracing: {
        level: 4,
        completed: 20,
        stars: 44,
        bestAccuracy: 89,
        attempts: 9,
      },
    }),
  );
  const t = tracing();
  check("desbloqueado hasta el 4", t.unlocked === 4, `${t.unlocked}`);
  check("conserva la precisión", t.best.accuracy === 89);
  check("conserva los ejercicios", t.best.completed === 20);
  check("conserva los intentos", t.best.attempts === 9);
  check("no inventa un nivel 5", t.unlocked < 5);
}

console.log("\n3. Una estrella no desbloquea");
{
  store.clear();
  play(1, 1);
  const t = tracing();
  check("sigue abierto solo el 1", t.unlocked === 1, `${t.unlocked}`);
  check("la sesión sí se cuenta", t.sessions === 1);
}

console.log("\n4. Dos estrellas desbloquean el siguiente");
{
  store.clear();
  play(1, 2);
  check("se abre el 2", tracing().unlocked === 2, `${tracing().unlocked}`);
}

console.log("\n5. Tres estrellas desbloquean el siguiente");
{
  store.clear();
  play(1, 2);
  play(2, 3);
  const t = tracing();
  check("se abre el 3", t.unlocked === 3, `${t.unlocked}`);
  check("el elegido es el que se jugó", t.difficulty === 2);
}

console.log("\n6. Repetir con peor resultado no rebaja nada");
{
  store.clear();
  play(1, 3, { accuracy: 95, attempts: 1 });
  const before = tracing();
  play(1, 1, { accuracy: 40, attempts: 6 });
  const after = tracing();

  check("la mejor precisión aguanta", after.best.accuracy === 95, `${after.best.accuracy}`);
  check("las mejores estrellas aguantan", after.stars === 3, `${after.stars}`);
  check("lo desbloqueado aguanta", after.unlocked === before.unlocked);
  check("el nivel elegido sí es el último jugado", after.difficulty === 1);
}

console.log("\n7. Repetir no cuenta dos veces la misma sesión");
{
  store.clear();
  play(1, 2, { attempts: 3 });
  const one = tracing();
  check("una sesión", one.sessions === 1, `${one.sessions}`);
  check("cinco ejercicios", one.best.completed === 5, `${one.best.completed}`);
  check("tres intentos", one.best.attempts === 3, `${one.best.attempts}`);

  play(1, 2, { attempts: 4 });
  const two = tracing();
  check("dos sesiones, no cuatro", two.sessions === 2, `${two.sessions}`);
  check("diez ejercicios, no veinte", two.best.completed === 10, `${two.best.completed}`);
  check("siete intentos, no catorce", two.best.attempts === 7, `${two.best.attempts}`);

  // Una lectura más no puede volver a sumar por culpa de la proyección.
  getProgress();
  const three = tracing();
  check("releer no suma nada", three.sessions === 2 && three.best.completed === 10);
}

console.log("\n8. Abandonar una sesión no desbloquea ni da estrellas");
{
  store.clear();
  play(1, 2);
  const before = tracing();
  // El juego no guarda al abandonar; esto comprueba que, aunque llegara una
  // valoración de cero, no abriría nada.
  play(2, tracingSessionStars(9, 3, 5));
  const after = tracing();

  check("no se abre el 3", after.unlocked === before.unlocked, `${after.unlocked}`);
  check("la mejor valoración no baja", after.stars === 2, `${after.stars}`);
}

console.log("\n9. El nivel 5 no crea un nivel 6");
{
  store.clear();
  play(1, 3);
  play(2, 3);
  play(3, 3);
  play(4, 3);
  check("abierto hasta el 5", tracing().unlocked === 5, `${tracing().unlocked}`);
  play(5, 3);
  check("sigue siendo 5", tracing().unlocked === 5, `${tracing().unlocked}`);
  play(5, 3);
  check("insistir tampoco lo sube", tracing().unlocked === 5);
}

console.log("\n10. Recargar conserva nivel, desbloqueo y métricas");
{
  store.clear();
  play(1, 2, { accuracy: 77, attempts: 2 });
  play(2, 1, { accuracy: 91, attempts: 5 });
  const saved = JSON.stringify(tracing());

  // Recargar es exactamente esto: el almacén sigue, la memoria no.
  const reloaded = tracing();
  check("todo idéntico tras recargar", JSON.stringify(reloaded) === saved);
  check("el nivel elegido sobrevive", reloaded.difficulty === 2);
  check("lo desbloqueado sobrevive", reloaded.unlocked === 2);
  check("la mejor precisión sobrevive", reloaded.best.accuracy === 91);
  check("las sesiones sobreviven", reloaded.sessions === 2);
  check("la fecha sobrevive", reloaded.lastPlayedAt === "2026-09-21T10:00:00.000Z");
}

console.log("\n11. La proyección antigua no pisa un resultado nuevo mejor");
{
  store.clear();
  play(1, 3, { accuracy: 96, attempts: 1 });
  play(2, 3, { accuracy: 96, attempts: 1 });

  // Alguien deja a mano un campo de la versión 1 peor que lo ya conseguido,
  // que es lo que pasaría al revertir un despliegue a medias.
  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  stored.tracing = {
    level: 1,
    completed: 5,
    stars: 5,
    bestAccuracy: 30,
    attempts: 1,
  };
  store.set(PROGRESS_KEY, JSON.stringify(stored));

  const t = tracing();
  check("el desbloqueo no baja", t.unlocked === 3, `${t.unlocked}`);
  check("la precisión no baja", t.best.accuracy === 96, `${t.best.accuracy}`);
  check("los ejercicios no bajan", t.best.completed === 10, `${t.best.completed}`);
  check("las estrellas no bajan", t.stars === 3);
  check("las sesiones no bajan", t.sessions === 2);
}

console.log(
  failures === 0
    ? `\nTrazos comprobado — ${checks} comprobaciones, todas en verde.\n`
    : `\nTrazos con fallos — ${failures} de ${checks} comprobaciones.\n`,
);
process.exit(failures === 0 ? 0 : 1);
