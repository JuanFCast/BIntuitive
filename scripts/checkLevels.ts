/*
 * Comprueba las reglas de nivel, estrellas y desbloqueo de los juegos que
 * entraron en la escala compartida después de Trazos, Parejas y Colorear.
 *
 * Esos tres tienen un script cada uno porque cada uno protege además su propia
 * geometría —el tablero, la forma del camino, el reparto del color—. Estos
 * comparten script a propósito: lo que hay que proteger en los cuatro es la
 * misma escala, y cuatro comandos más dejarían la verificación del proyecto en
 * nueve, que ya nadie corre entera.
 *
 * Ejecuta el `storage.ts` de verdad contra un `localStorage` fingido, igual
 * que los demás. Se lanza con `npm run check:levels`.
 */
import {
  getProgress,
  getUnassignedGameProgress,
  saveTypingResult,
  saveVisualResult,
  saveWordScrambleResult,
  saveWordSearchResult,
  saveTracingResult,
} from "@/lib/storage";
import {
  buildTypingPassage,
  clampTypingLevel,
  getTypingBank,
  typingSessionStars,
  TYPING_CHARS_PER_SECOND,
  TYPING_LEVELS,
  TYPING_MAX_LEVEL,
  type TypingLevel,
} from "@/lib/typingGame";
import {
  clampWordSearchLevel,
  createRng,
  generateBoard,
  getSearchLetters,
  pickSearchWords,
  wordSearchSessionStars,
  WORD_SEARCH_LEGACY_MAX_LEVEL,
  WORD_SEARCH_LEVELS,
  WORD_SEARCH_MAX_LEVEL,
  type WordSearchLevel,
} from "@/lib/wordSearch";
import {
  clampVisualLevel,
  createFirstVisualCard,
  createNextVisualCard,
  visualAccuracy,
  visualSessionStars,
  VISUAL_CARD_SIZES,
  VISUAL_LEVELS,
  VISUAL_MAX_LEVEL,
  VISUAL_ROUNDS,
  VISUAL_SYMBOLS,
  type VisualLevel,
} from "@/lib/visualGame";
import {
  clampWordScrambleLevel,
  createLetterTiles,
  getWordBank,
  getWordLetters,
  wordScrambleSessionStars,
  WORD_SCRAMBLE_LEGACY_MAX_LEVEL,
  WORD_SCRAMBLE_LEVELS,
  WORD_SCRAMBLE_MAX_LEVEL,
  type WordScrambleLevel,
} from "@/lib/wordScramble";
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

const LEVELS = [1, 2, 3, 4, 5] as const;

/* ==========================================================================
 * Agilidad visual
 * ======================================================================= */

function visual() {
  return getUnassignedGameProgress(getProgress(), "visual");
}

console.log("\nAgilidad visual · la tabla de escalones");
{
  const symbols = LEVELS.map((level) => VISUAL_LEVELS[level].symbols);
  const rotation = LEVELS.map((level) => VISUAL_LEVELS[level].rotation);
  const scale = LEVELS.map((level) => VISUAL_LEVELS[level].scale);

  check("cinco escalones", VISUAL_MAX_LEVEL === 5);
  check("símbolos 4, 6, 9, 9, 12", symbols.join(",") === "4,6,9,9,12", symbols.join(","));
  check(
    "la carta nunca encoge al subir de escalón",
    symbols.every((count, index) => index === 0 || count >= symbols[index - 1]),
  );
  check(
    "el giro nunca disminuye al subir",
    rotation.every((deg, index) => index === 0 || deg >= rotation[index - 1]),
  );
  check(
    "el primer escalón no gira ni reescala: el mismo dibujo se ve igual en las dos cartas",
    rotation[0] === 0 && scale[0] === 0,
  );
  check(
    "el cuarto repite las nueve del tercero y solo cambia la presentación",
    symbols[3] === symbols[2] && rotation[3] > rotation[2],
  );
  check(
    "hay rejilla escrita para cada cantidad que algún escalón pide",
    symbols.every((count) => VISUAL_CARD_SIZES.includes(count)),
    `rejillas: ${VISUAL_CARD_SIZES.join(",")}`,
  );
  check(
    "el banco da para la carta más grande y sus distractores",
    VISUAL_SYMBOLS.length >= Math.max(...symbols) * 2 - 1,
    `${VISUAL_SYMBOLS.length} símbolos`,
  );
}

console.log("\nAgilidad visual · las cartas que se generan");
{
  for (const level of LEVELS) {
    const wanted = VISUAL_LEVELS[level].symbols;
    const first = createFirstVisualCard(level);
    const { card, targetId } = createNextVisualCard(first, 2, level);
    const firstIds = new Set(first.symbols.map((symbol) => symbol.id));
    const shared = card.symbols.filter((symbol) => firstIds.has(symbol.id));

    check(
      `nivel ${level}: ${wanted} símbolos en las dos cartas`,
      first.symbols.length === wanted && card.symbols.length === wanted,
      `${first.symbols.length} y ${card.symbols.length}`,
    );
    check(
      `nivel ${level}: exactamente un símbolo en común, y es el que hay que tocar`,
      shared.length === 1 && shared[0].id === targetId,
      `${shared.length} en común`,
    );
    check(
      `nivel ${level}: ningún símbolo repetido dentro de una carta`,
      new Set(card.symbols.map((s) => s.id)).size === wanted,
    );
    check(
      `nivel ${level}: el giro se queda dentro de lo que dice la tabla`,
      card.symbols.every(
        (symbol) => Math.abs(symbol.rotation) <= VISUAL_LEVELS[level].rotation,
      ),
    );
  }
}

console.log("\nAgilidad visual · precisión y estrellas");
{
  check("sin fallos → 100 %", visualAccuracy(0) === 100);
  check("un fallo en diez rondas → 91 %", visualAccuracy(1) === 91);
  check("sin terminar → 0 estrellas", visualSessionStars(100, false) === 0);
  check("74 % → 1", visualSessionStars(74, true) === 1);
  check("75 % justo → 2", visualSessionStars(75, true) === 2);
  check("89 % → 2", visualSessionStars(89, true) === 2);
  check("90 % justo → 3", visualSessionStars(90, true) === 3);
  check(
    "un fallo en una sesión entera todavía vale tres estrellas",
    visualSessionStars(visualAccuracy(1), true) === 3,
  );
  check(
    "cuatro fallos ya no llegan a dos estrellas",
    visualSessionStars(visualAccuracy(4), true) === 1,
    `${visualAccuracy(4)} %`,
  );
  check("diez rondas por sesión", VISUAL_ROUNDS === 10);
  check("el escalón se recorta al rango del juego", clampVisualLevel(9) === 5);
  check("y nunca por debajo de uno", clampVisualLevel(-3) === 1);
}

function playVisual(
  level: VisualLevel,
  stars: Stars,
  extra: { timeMs?: number; mistakes?: number } = {},
): void {
  saveVisualResult({
    playedLevel: level,
    sessionStars: stars,
    timeMs: extra.timeMs ?? 30000,
    mistakes: extra.mistakes ?? 1,
    playedAt: "2026-10-31T10:00:00.000Z",
  });
}

console.log("\nAgilidad visual · el récord va emparejado con su escalón");
{
  store.clear();
  playVisual(3, 3, { timeMs: 40000 });
  check("el primer tiempo es el récord", visual().best.fastestMs === 40000);
  check("y guarda en qué escalón se hizo", visual().best.fastestLevel === 3);

  playVisual(1, 3, { timeMs: 5000 });
  check(
    "un tiempo mucho mejor de un escalón menor no toca el récord",
    visual().best.fastestMs === 40000,
    `${visual().best.fastestMs}`,
  );

  playVisual(4, 3, { timeMs: 90000 });
  check(
    "pero uno de un escalón mayor sustituye siempre, aunque sea más lento",
    visual().best.fastestMs === 90000 && visual().best.fastestLevel === 4,
  );

  playVisual(4, 3, { timeMs: 80000 });
  check("y dentro del mismo escalón gana el más rápido", visual().best.fastestMs === 80000);
}

console.log("\nAgilidad visual · desbloqueo y fallos");
{
  store.clear();
  playVisual(1, 1);
  check("una estrella no abre nada", visual().unlocked === 1, `${visual().unlocked}`);

  playVisual(1, 2);
  check("dos estrellas abren el siguiente", visual().unlocked === 2);

  playVisual(1, 1);
  check("y una mala racha no vuelve a cerrarlo", visual().unlocked === 2);

  check("el escalón elegido se guarda tal cual", visual().difficulty === 1);
  check("las sesiones se cuentan", visual().sessions === 3, `${visual().sessions}`);

  store.clear();
  playVisual(2, 3, { mistakes: 4 });
  playVisual(2, 3, { mistakes: 1 });
  check("los fallos se quedan con el mínimo", visual().best.fewestMistakes === 1);
  playVisual(2, 3, { mistakes: 7 });
  check("y una sesión peor no lo empeora", visual().best.fewestMistakes === 1);
}

/* ==========================================================================
 * Word Scramble
 * ======================================================================= */

function scramble() {
  return getUnassignedGameProgress(getProgress(), "scramble");
}

console.log("\nWord Scramble · la tabla de escalones");
{
  const tiers = LEVELS.map((level) => WORD_SCRAMBLE_LEVELS[level].tier);
  const clues = LEVELS.map((level) => WORD_SCRAMBLE_LEVELS[level].clue);
  const decoys = LEVELS.map((level) => WORD_SCRAMBLE_LEVELS[level].decoys);

  check("cinco escalones", WORD_SCRAMBLE_MAX_LEVEL === 5);
  check("tramos 1, 2, 3, 3, 3", tiers.join(",") === "1,2,3,3,3", tiers.join(","));
  check(
    "la palabra nunca se acorta al subir",
    tiers.every((tier, index) => index === 0 || tier >= tiers[index - 1]),
  );
  check(
    "la pista escrita se retira en el cuarto y no vuelve",
    clues.join(",") === "true,true,true,false,false",
    clues.join(","),
  );
  check(
    "las letras que sobran solo aparecen en el quinto",
    decoys.join(",") === "0,0,0,0,2",
    decoys.join(","),
  );
  check(
    "ninguna ayuda vuelve a aparecer después de quitarse",
    clues.every((clue, index) => index === 0 || Number(clue) <= Number(clues[index - 1])),
  );
  check(
    "los tres escalones altos comparten tramo: lo que los separa son las ayudas",
    tiers[2] === tiers[3] && tiers[3] === tiers[4],
  );
  check("el escalón se recorta al rango del juego", clampWordScrambleLevel(9) === 5);
}

console.log("\nWord Scramble · las fichas que se reparten");
{
  for (const language of ["en", "es"] as const) {
    const word = getWordBank(language).find(
      (candidate) => candidate.level === 3,
    )!;
    const letters = getWordLetters(word.word);

    const plain = createLetterTiles(word.word, 0, language);
    check(
      `${language}: sin señuelos hay una ficha por letra`,
      plain.length === letters.length,
      `${plain.length} fichas para ${letters.length} letras`,
    );

    const withDecoys = createLetterTiles(word.word, 2, language);
    const extra = withDecoys.filter((tile) => tile.id.startsWith("decoy-"));
    check(
      `${language}: con señuelos sobran dos fichas`,
      withDecoys.length === letters.length + 2 && extra.length === 2,
      `${withDecoys.length} fichas`,
    );
    check(
      `${language}: ningún señuelo es una letra de la palabra`,
      extra.every((tile) => !letters.includes(tile.letter)),
      extra.map((tile) => tile.letter).join(","),
    );
    check(
      `${language}: cada ficha tiene su propio id, aunque la letra se repita`,
      new Set(withDecoys.map((tile) => tile.id)).size === withDecoys.length,
    );
    check(
      `${language}: las letras de la palabra siguen estando todas`,
      letters.every(
        (letter) =>
          withDecoys.filter((tile) => tile.letter === letter).length >=
          letters.filter((other) => other === letter).length,
      ),
    );
  }
}

console.log("\nWord Scramble · estrellas de la sesión");
{
  check("sin terminar → 0", wordScrambleSessionStars(100, false) === 0);
  check("74 % → 1", wordScrambleSessionStars(74, true) === 1);
  check("75 % justo → 2", wordScrambleSessionStars(75, true) === 2);
  check("89 % → 2", wordScrambleSessionStars(89, true) === 2);
  check("90 % justo → 3", wordScrambleSessionStars(90, true) === 3);
}

function playScramble(
  level: WordScrambleLevel,
  stars: Stars,
  perfectWords = 5,
): void {
  saveWordScrambleResult({
    playedLevel: level,
    sessionStars: stars,
    perfectWords,
    playedAt: "2026-10-31T11:00:00.000Z",
  });
}

console.log("\nWord Scramble · los dos modelos dicen lo mismo");
{
  store.clear();
  playScramble(2, 3, 7);

  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  check(
    "el modelo nuevo guarda la mejor marca",
    scramble().best.perfectWords === 7,
    `${scramble().best.perfectWords}`,
  );
  check(
    "y el campo de la versión 1 guarda exactamente la misma",
    stored.wordScramble.bestPerfectWords === 7,
    `${stored.wordScramble?.bestPerfectWords}`,
  );
  check(
    "el espejo guarda lo desbloqueado, no lo elegido",
    stored.wordScramble.level === 3,
    `${stored.wordScramble.level}`,
  );

  playScramble(2, 1, 2);
  const worse = JSON.parse(store.get(PROGRESS_KEY)!);
  check("una sesión peor no baja la marca nueva", scramble().best.perfectWords === 7);
  check(
    "ni la del campo antiguo",
    worse.wordScramble.bestPerfectWords === 7,
    `${worse.wordScramble.bestPerfectWords}`,
  );
}

console.log("\nWord Scramble · el espejo no degrada a nadie al revertir");
{
  store.clear();
  // Subir hasta el quinto, que el código de la versión 1 no sabe expresar.
  playScramble(1, 3);
  playScramble(2, 3);
  playScramble(3, 3);
  playScramble(4, 3);
  check("se llega al quinto desbloqueado", scramble().unlocked === 5, `${scramble().unlocked}`);

  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  check(
    "pero el campo de la versión 1 se recorta a su propio tope",
    stored.wordScramble.level === WORD_SCRAMBLE_LEGACY_MAX_LEVEL,
    `${stored.wordScramble.level}`,
  );
  check(
    "nunca escribe ahí un número que el código antiguo daría por inválido",
    stored.wordScramble.level >= 1 &&
      stored.wordScramble.level <= WORD_SCRAMBLE_LEGACY_MAX_LEVEL,
  );
}

console.log("\nWord Scramble · el puente no se lleva nada por delante");
{
  store.clear();
  playScramble(2, 3, 6);

  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  // Un dispositivo con datos antiguos de otro juego: la proyección corre en
  // cada lectura y no puede tocar lo que Word Scramble acaba de guardar.
  stored.levelByCategory = { numeros: 2 };
  stored.tracing = { level: 4, completed: 20, stars: 44, bestAccuracy: 89, attempts: 9 };
  store.set(PROGRESS_KEY, JSON.stringify(stored));

  check("conserva su desbloqueo", scramble().unlocked === 3, `${scramble().unlocked}`);
  check("conserva su marca", scramble().best.perfectWords === 6);
  check("conserva el escalón elegido", scramble().difficulty === 2);
  check(
    "y lo antiguo de los demás sí aparece",
    getUnassignedGameProgress(getProgress(), "tracing").unlocked === 4,
  );
}

/* ==========================================================================
 * Word Search
 * ======================================================================= */

function search() {
  return getUnassignedGameProgress(getProgress(), "search");
}

console.log("\nWord Search · la tabla de escalones");
{
  const sizes = LEVELS.map((level) => WORD_SEARCH_LEVELS[level].size);
  const words = LEVELS.map((level) => WORD_SEARCH_LEVELS[level].words);
  const tiers = LEVELS.map((level) => WORD_SEARCH_LEVELS[level].tier);
  const dirs = LEVELS.map((level) => WORD_SEARCH_LEVELS[level].directions.length);
  const solo = LEVELS.map((level) => WORD_SEARCH_LEVELS[level].oneAtATime);

  check("cinco escalones", WORD_SEARCH_MAX_LEVEL === 5);
  check("tableros 7, 9, 10, 10, 10", sizes.join(",") === "7,9,10,10,10", sizes.join(","));
  check(
    "ningún tablero pasa de diez columnas: más y las celdas no se ven en un móvil",
    sizes.every((size) => size <= 10),
    sizes.join(","),
  );
  check(
    "el tablero nunca encoge al subir",
    sizes.every((size, index) => index === 0 || size >= sizes[index - 1]),
  );
  check("palabras 4, 6, 7, 9, 9", words.join(",") === "4,6,7,9,9", words.join(","));
  check(
    "el cuarto llena más el mismo tablero del tercero",
    sizes[3] === sizes[2] && words[3] > words[2],
  );
  check(
    "las direcciones nunca se reducen al subir",
    dirs.every((count, index) => index === 0 || count >= dirs[index - 1]),
    dirs.join(","),
  );
  check(
    "de una en una solo en el quinto",
    solo.join(",") === "false,false,false,false,true",
    solo.join(","),
  );
  check(
    "el quinto no cambia el tablero del cuarto: lo que cambia es cómo se pide",
    sizes[4] === sizes[3] && words[4] === words[3] && solo[4] && !solo[3],
  );
  check("tramos 1, 2, 3, 3, 3", tiers.join(",") === "1,2,3,3,3", tiers.join(","));
  check("el escalón se recorta al rango del juego", clampWordSearchLevel(9) === 5);
}

console.log("\nWord Search · los tableros se generan de verdad");
{
  for (const language of ["en", "es"] as const) {
    for (const level of LEVELS) {
      const config = WORD_SEARCH_LEVELS[level];
      let allPlaced = true;
      let grew = false;
      let worstSize = 0;

      // Varias semillas: colocar es con azar, y un tablero que cabe una vez de
      // cada diez no sirve. Si el generador tiene que agrandar la cuadrícula es
      // que el escalón pide más palabras de las que caben.
      for (let seed = 1; seed <= 12; seed += 1) {
        const board = generateBoard(language, level, createRng(seed));
        if (board.placements.length < config.words) allPlaced = false;
        if (board.size > config.size) grew = true;
        worstSize = Math.max(worstSize, board.size);
      }

      check(
        `${language} nivel ${level}: entran las ${config.words} palabras`,
        allPlaced,
      );
      check(
        `${language} nivel ${level}: caben sin agrandar el tablero de ${config.size}`,
        !grew,
        `llegó a ${worstSize}`,
      );
    }
  }
}

console.log("\nWord Search · las palabras caben en su tablero");
{
  for (const language of ["en", "es"] as const) {
    for (const level of LEVELS) {
      const config = WORD_SEARCH_LEVELS[level];
      const chosen = pickSearchWords(language, level, config.words, [], createRng(7));
      check(
        `${language} nivel ${level}: ninguna palabra es más larga que el lado`,
        chosen.every(
          (word) => getSearchLetters(word.word).length <= config.size,
        ),
      );
      check(
        `${language} nivel ${level}: se eligen las ${config.words} que pide`,
        chosen.length === config.words,
        `${chosen.length}`,
      );
    }
  }
}

console.log("\nWord Search · estrellas de la sesión");
{
  check("sin terminar → 0", wordSearchSessionStars(100, false) === 0);
  check("74 % → 1", wordSearchSessionStars(74, true) === 1);
  check("75 % justo → 2", wordSearchSessionStars(75, true) === 2);
  check("90 % justo → 3", wordSearchSessionStars(90, true) === 3);
}

function playSearch(
  level: WordSearchLevel,
  stars: Stars,
  extra: { wordsFound?: number; misses?: number } = {},
): void {
  saveWordSearchResult({
    playedLevel: level,
    sessionStars: stars,
    wordsFound: extra.wordsFound ?? 12,
    misses: extra.misses ?? 2,
    playedAt: "2026-10-31T13:00:00.000Z",
  });
}

console.log("\nWord Search · los dos modelos dicen lo mismo");
{
  store.clear();
  playSearch(2, 3, { wordsFound: 15, misses: 3 });

  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  check("el modelo nuevo guarda las palabras", search().best.wordsFound === 15);
  check(
    "y el campo de la versión 1 guarda la misma cifra",
    stored.wordSearch.bestWordsFound === 15,
    `${stored.wordSearch?.bestWordsFound}`,
  );
  check("los fallos se quedan con el mínimo", search().best.fewestMisses === 3);

  playSearch(2, 3, { wordsFound: 9, misses: 1 });
  check("una sesión con menos palabras no baja la marca", search().best.wordsFound === 15);
  check("pero menos fallos sí mejoran los fallos", search().best.fewestMisses === 1);
}

console.log("\nWord Search · el espejo no degrada a nadie al revertir");
{
  store.clear();
  playSearch(1, 3);
  playSearch(2, 3);
  playSearch(3, 3);
  playSearch(4, 3);
  check("se llega al quinto desbloqueado", search().unlocked === 5, `${search().unlocked}`);

  const stored = JSON.parse(store.get(PROGRESS_KEY)!);
  check(
    "el campo de la versión 1 se recorta a su propio tope",
    stored.wordSearch.level === WORD_SEARCH_LEGACY_MAX_LEVEL,
    `${stored.wordSearch.level}`,
  );
}

/* ==========================================================================
 * Type Rush
 * ======================================================================= */

function typing() {
  return getUnassignedGameProgress(getProgress(), "typing");
}

console.log("\nType Rush · la tabla de escalones");
{
  const sources = LEVELS.map((level) => TYPING_LEVELS[level].source);
  const seconds = LEVELS.map((level) => TYPING_LEVELS[level].seconds);

  check("cinco escalones", TYPING_MAX_LEVEL === 5);
  check(
    "palabras, palabras, frases cortas, frases, frases",
    sources.join(",") ===
      "shortWords,longWords,shortPhrases,phrases,phrases",
    sources.join(","),
  );
  check("duración 20, 25, 30, 30, 45", seconds.join(",") === "20,25,30,30,45", seconds.join(","));
  check(
    "la sesión nunca se acorta al subir",
    seconds.every((value, index) => index === 0 || value >= seconds[index - 1]),
  );
  check(
    "el cuarto es el que introduce mayúsculas y signos, no la duración",
    sources[3] === "phrases" && sources[2] !== "phrases" && seconds[3] === seconds[2],
  );
  check(
    "el quinto es el mismo texto con más tiempo",
    sources[4] === sources[3] && seconds[4] > seconds[3],
  );
  check("el escalón se recorta al rango del juego", clampTypingLevel(9) === 5);
}

console.log("\nType Rush · los tres primeros escalones son solo letras");
{
  for (const language of ["en", "es"] as const) {
    for (const level of [1, 2, 3] as const) {
      const entries = getTypingBank(language, level);
      check(
        `${language} nivel ${level}: nada en mayúscula`,
        entries.every((entry) => entry === entry.toLocaleLowerCase(language)),
      );
      check(
        `${language} nivel ${level}: ni un signo de puntuación`,
        entries.every((entry) => !/[.,;:!?¡¿"'()]/.test(entry)),
      );
    }
    // Y el cuarto es justo lo contrario, que es lo que lo hace más difícil.
    const long = getTypingBank(language, 4);
    check(
      `${language}: el cuarto sí trae mayúsculas y puntuación`,
      long.some((entry) => /[A-ZÁÉÍÓÚÑ]/.test(entry)) &&
        long.some((entry) => /[.,]/.test(entry)),
    );
  }
}

console.log("\nType Rush · el texto nunca se acaba antes que el reloj");
{
  for (const language of ["en", "es"] as const) {
    for (const level of LEVELS) {
      const passage = buildTypingPassage(language, level);
      const wanted = TYPING_LEVELS[level].seconds * TYPING_CHARS_PER_SECOND;
      check(
        `${language} nivel ${level}: el texto da para los ${TYPING_LEVELS[level].seconds} s`,
        passage.length >= wanted,
        `${passage.length} de ${wanted}`,
      );
    }
  }
}

console.log("\nType Rush · estrellas de la sesión");
{
  check("sin terminar → 0", typingSessionStars(100, false) === 0);
  check("74 % → 1", typingSessionStars(74, true) === 1);
  check("75 % justo → 2", typingSessionStars(75, true) === 2);
  check("90 % justo → 3", typingSessionStars(90, true) === 3);
}

function playTyping(
  level: TypingLevel,
  stars: Stars,
  extra: { wpm?: number; accuracy?: number; correctChars?: number } = {},
): void {
  saveTypingResult({
    playedLevel: level,
    sessionStars: stars,
    wpm: extra.wpm ?? 20,
    accuracy: extra.accuracy ?? 85,
    correctChars: extra.correctChars ?? 120,
    playedAt: "2026-10-31T14:00:00.000Z",
  });
}

console.log("\nType Rush · las pulsaciones van emparejadas con su escalón");
{
  store.clear();
  playTyping(4, 3, { wpm: 25 });
  check("la primera marca es el récord", typing().best.wpm === 25);
  check("y guarda en qué escalón se hizo", typing().best.wpmLevel === 4);

  playTyping(1, 3, { wpm: 80 });
  check(
    "ochenta pulsaciones en palabras de tres letras no baten el récord de frases",
    typing().best.wpm === 25,
    `${typing().best.wpm}`,
  );

  playTyping(5, 3, { wpm: 18 });
  check(
    "pero un escalón mayor sustituye siempre, aunque sea más lento",
    typing().best.wpm === 18 && typing().best.wpmLevel === 5,
  );
}

console.log("\nType Rush · desbloqueo");
{
  store.clear();
  playTyping(1, 1);
  check("una estrella no abre nada", typing().unlocked === 1);
  playTyping(1, 2);
  check("dos estrellas abren el siguiente", typing().unlocked === 2);
  playTyping(1, 1);
  check("y una mala racha no vuelve a cerrarlo", typing().unlocked === 2);
  check(
    "la precisión y los caracteres se quedan con el mejor valor",
    typing().best.accuracy === 85 && typing().best.correctChars === 120,
  );
}

console.log("\nGuardar un juego no toca el progreso de los demás");
{
  store.clear();
  playVisual(3, 3, { timeMs: 20000 });
  playScramble(2, 3, 9);
  saveTracingResult({
    playedLevel: 2 as Difficulty,
    sessionStars: 3,
    exerciseStars: 9,
    completed: 4,
    accuracy: 90,
    attempts: 5,
    playedAt: "2026-10-31T12:00:00.000Z",
  });

  check("Agilidad visual sigue en lo suyo", visual().best.fastestMs === 20000);
  check("Word Scramble también", scramble().best.perfectWords === 9);
  check(
    "y Trazos no se ha mezclado con ninguno",
    getUnassignedGameProgress(getProgress(), "tracing").best.completed === 4,
  );
  check("cada uno cuenta sus propias sesiones", visual().sessions === 1 && scramble().sessions === 1);
}

console.log(
  failures === 0
    ? `\nEscalones comprobados — ${checks} comprobaciones, todas en verde.\n`
    : `\nEscalones con fallos — ${failures} de ${checks} comprobaciones.\n`,
);
process.exit(failures === 0 ? 0 : 1);
