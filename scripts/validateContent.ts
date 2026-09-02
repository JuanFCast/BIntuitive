/**
 * Validación del contenido educativo del repositorio.
 *
 * Los bancos siguen siendo independientes —preguntas, Word Scramble, Word
 * Search, Typing y Agilidad visual— y este script no los unifica: comprueba las
 * invariantes que cada uno ya asume hoy, para que romperlas falle sola en vez
 * de llegar a producción como una pregunta sin respuesta o una palabra que no
 * cabe en su tablero.
 *
 * Es validación estructural y rápida: no genera tableros ni simula partidas.
 *
 * Se ejecuta con `npm run validate:content`.
 */

import { hexagons } from "../src/data/categories";
import {
  englishHexagons,
  englishOptions,
  englishQuestions,
} from "../src/data/localization";
import { questions, type CategoryId } from "../src/data/questions";
import { ROUNDS_PER_SESSION } from "../src/lib/gameEngine";
import { WORD_ALPHABET, getWordLetters } from "../src/lib/letters";
import type { Language } from "../src/lib/language";
import { getTypingPhrases } from "../src/lib/typingGame";
import { VISUAL_SYMBOLS, VISUAL_SYMBOLS_PER_CARD } from "../src/lib/visualGame";
import {
  WORD_SCRAMBLE_MAX_LEVEL,
  WORD_SCRAMBLE_WORDS_PER_SESSION,
  getWordBank,
} from "../src/lib/wordScramble";
import {
  WORD_SEARCH_LEVELS,
  WORD_SEARCH_MAX_LEVEL,
  getSearchBank,
  type WordSearchLevel,
} from "../src/lib/wordSearch";

const LANGUAGES: Language[] = ["en", "es"];
const CATEGORIES: CategoryId[] = ["lugares", "numeros", "colores"];

/** Longitud de palabra que admite cada nivel de Word Scramble, según su banco. */
const SCRAMBLE_LENGTH_BY_LEVEL: Record<number, [number, number]> = {
  1: [3, 4],
  2: [5, 6],
  3: [7, 8],
};

/** Rango de opciones que `AnswerGrid` sabe repartir en pantalla. */
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

/** Longitud mínima del texto de Type Rush, la que pide `buildTypingPassage`. */
const TYPING_MIN_PASSAGE = 240;

type Issue = { bank: string; item: string; rule: string };

const issues: Issue[] = [];

function fail(bank: string, item: string, rule: string): void {
  issues.push({ bank, item, rule });
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

/** Valores que aparecen más de una vez en la lista. */
function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/* --------------------------------------------------------------------------
 * Preguntas: Lugares, Números y Colores
 *
 * El español es la fuente y el inglés una capa por id. `localizeQuestion` cae
 * en silencio al español cuando falta una traducción, así que una traducción
 * ausente no se nota jugando: solo se nota aquí.
 * ----------------------------------------------------------------------- */

function validateQuestions(): void {
  const bank = "preguntas";

  for (const id of duplicates(questions.map((question) => question.id))) {
    fail(bank, id, "id repetido");
  }

  for (const question of questions) {
    const at = question.id || "(pregunta sin id)";

    if (isBlank(question.id)) fail(bank, at, "id vacío");
    if (!CATEGORIES.includes(question.category)) {
      fail(bank, at, "categoría desconocida: " + question.category);
    }
    if (![1, 2, 3].includes(question.level)) {
      fail(bank, at, "nivel fuera de 1-3: " + question.level);
    }
    if (isBlank(question.instruction)) fail(bank, at, "instrucción vacía");
    if (question.hint !== undefined && isBlank(question.hint)) {
      fail(bank, at, "pista presente pero vacía");
    }
    if (
      question.instructionShort !== undefined &&
      isBlank(question.instructionShort)
    ) {
      fail(bank, at, "instructionShort presente pero vacía");
    }

    const optionIds = question.options.map((option) => option.id);
    if (
      question.options.length < MIN_OPTIONS ||
      question.options.length > MAX_OPTIONS
    ) {
      fail(
        bank,
        at,
        question.options.length +
          " opciones, fuera de " +
          MIN_OPTIONS +
          "-" +
          MAX_OPTIONS,
      );
    }
    for (const repeated of duplicates(optionIds)) {
      fail(bank, at, "id de opción repetido dentro de la pregunta: " + repeated);
    }
    for (const option of question.options) {
      if (isBlank(option.id)) fail(bank, at, "opción con id vacío");
      if (isBlank(option.alt)) {
        fail(bank, at, "opción " + option.id + " sin texto alternativo");
      }
      if (option.label !== undefined && isBlank(option.label)) {
        fail(bank, at, "opción " + option.id + " con etiqueta vacía");
      }
    }

    // Una y solo una respuesta correcta: el answerId señala una opción que
    // existe y, como los ids son únicos, no puede señalar a dos.
    const matches = optionIds.filter((id) => id === question.answerId).length;
    if (matches === 0) {
      fail(
        bank,
        at,
        "answerId " + question.answerId + " no está entre las opciones",
      );
    } else if (matches > 1) {
      fail(
        bank,
        at,
        "answerId " + question.answerId + " señala a " + matches + " opciones",
      );
    }

    // Capa inglesa de la pregunta.
    const copy = englishQuestions[question.id];
    if (!copy) {
      fail(bank, at, "sin traducción al inglés");
    } else {
      if (isBlank(copy.instruction)) {
        fail(bank, at, "traducción inglesa con instrucción vacía");
      }
      if (question.hint !== undefined && isBlank(copy.hint)) {
        fail(bank, at, "la pista no está traducida al inglés");
      }
    }
  }

  // Una sesión son 5 preguntas sin repetir: por debajo de eso la categoría no
  // puede completar una lección.
  for (const category of CATEGORIES) {
    const count = questions.filter((q) => q.category === category).length;
    if (count < ROUNDS_PER_SESSION) {
      fail(
        bank,
        category,
        "solo " +
          count +
          " preguntas, se necesitan " +
          ROUNDS_PER_SESSION +
          " para una sesión",
      );
    }
  }

  const questionIds = new Set(questions.map((question) => question.id));
  for (const id of Object.keys(englishQuestions)) {
    if (!questionIds.has(id)) {
      fail(bank, id, "traducción inglesa huérfana: la pregunta ya no existe");
    }
  }

  // Capa inglesa de las opciones. La etiqueta solo se exige cuando la española
  // es una palabra: un número como 5 se escribe igual en los dos idiomas.
  const usedOptionIds = new Set<string>();
  for (const question of questions) {
    for (const option of question.options) {
      usedOptionIds.add(option.id);
      const copy = englishOptions[option.id];
      if (!copy) {
        fail(bank, option.id, "opción sin traducción al inglés");
        continue;
      }
      if (isBlank(copy.alt)) {
        fail(bank, option.id, "traducción inglesa sin texto alternativo");
      }
      const spanishLabelIsWord =
        option.label !== undefined && /\p{L}/u.test(option.label);
      if (spanishLabelIsWord && copy.label === undefined) {
        fail(
          bank,
          option.id,
          "la etiqueta " + option.label + " no está traducida al inglés",
        );
      }
    }
  }
  for (const id of Object.keys(englishOptions)) {
    if (!usedOptionIds.has(id)) {
      fail(bank, id, "traducción de opción huérfana: ninguna pregunta la usa");
    }
  }
}

/* --------------------------------------------------------------------------
 * Hexágonos de Explore
 * ----------------------------------------------------------------------- */

function validateHexagons(): void {
  const bank = "hexágonos";

  for (const id of duplicates(hexagons.map((hexagon) => hexagon.id))) {
    fail(bank, id, "id repetido");
  }
  for (const hexagon of hexagons) {
    if (isBlank(hexagon.name)) fail(bank, hexagon.id, "nombre vacío");
    if (isBlank(hexagon.description)) {
      fail(bank, hexagon.id, "descripción vacía");
    }
    if (isBlank(hexagon.emoji)) fail(bank, hexagon.id, "emoji vacío");

    const english = englishHexagons[hexagon.id];
    if (!english) {
      fail(bank, hexagon.id, "sin traducción al inglés");
      continue;
    }
    if (isBlank(english.name)) fail(bank, hexagon.id, "nombre inglés vacío");
    if (isBlank(english.description)) {
      fail(bank, hexagon.id, "descripción inglesa vacía");
    }
  }
}

/* --------------------------------------------------------------------------
 * Word Scramble
 *
 * Banco propio por idioma: NO es una traducción, así que no se exige
 * correspondencia entre en y es. Cada idioma se valida por separado.
 * ----------------------------------------------------------------------- */

function validateWordScramble(): void {
  const bank = "word-scramble";
  const allIds: string[] = [];

  for (const language of LANGUAGES) {
    const words = getWordBank(language);
    allIds.push(...words.map((word) => word.id));

    for (const repeated of duplicates(words.map((word) => word.word))) {
      fail(bank, language + "/" + repeated, "palabra repetida en el idioma");
    }

    for (const entry of words) {
      const at = language + "/" + (entry.id || "(sin id)");

      if (isBlank(entry.id)) fail(bank, at, "id vacío");
      if (!entry.id.startsWith(language + "-")) {
        fail(bank, at, "el id no lleva el prefijo " + language + "- de su idioma");
      }
      if (isBlank(entry.word)) {
        fail(bank, at, "palabra vacía");
        continue;
      }
      if (isBlank(entry.clue)) fail(bank, at, "pista vacía");
      if (isBlank(entry.emoji)) fail(bank, at, "emoji vacío");

      if (entry.word !== entry.word.normalize("NFC")) {
        fail(bank, at, entry.word + " no está en NFC");
      }
      if (!WORD_ALPHABET[language].test(entry.word)) {
        fail(
          bank,
          at,
          entry.word + " usa caracteres fuera del alfabeto de " + language,
        );
      }

      if (entry.level < 1 || entry.level > WORD_SCRAMBLE_MAX_LEVEL) {
        fail(
          bank,
          at,
          "nivel fuera de 1-" + WORD_SCRAMBLE_MAX_LEVEL + ": " + entry.level,
        );
      } else {
        // Las tildes, la Ñ y la Ü cuentan como una sola letra.
        const length = getWordLetters(entry.word).length;
        const range = SCRAMBLE_LENGTH_BY_LEVEL[entry.level];
        if (length < range[0] || length > range[1]) {
          fail(
            bank,
            at,
            entry.word +
              " mide " +
              length +
              " letras; el nivel " +
              entry.level +
              " admite " +
              range[0] +
              "-" +
              range[1],
          );
        }
      }
    }

    if (words.length < WORD_SCRAMBLE_WORDS_PER_SESSION) {
      fail(
        bank,
        language,
        "solo " +
          words.length +
          " palabras, se necesitan " +
          WORD_SCRAMBLE_WORDS_PER_SESSION +
          " para una sesión sin repetir",
      );
    }
    for (let level = 1; level <= WORD_SCRAMBLE_MAX_LEVEL; level += 1) {
      if (!words.some((word) => word.level === level)) {
        fail(
          bank,
          language + "/nivel " + level,
          "ninguna palabra en este nivel",
        );
      }
    }
  }

  for (const repeated of duplicates(allIds)) {
    fail(bank, repeated, "id repetido entre idiomas");
  }
}

/* --------------------------------------------------------------------------
 * Word Search
 *
 * Banco separado del de Word Scramble a propósito: comparten reglas de letras,
 * no palabras. Tampoco es una traducción entre idiomas.
 * ----------------------------------------------------------------------- */

function validateWordSearch(): void {
  const bank = "word-search";
  const allIds: string[] = [];

  for (const language of LANGUAGES) {
    const words = getSearchBank(language);
    allIds.push(...words.map((word) => word.id));

    for (const repeated of duplicates(words.map((word) => word.word))) {
      fail(bank, language + "/" + repeated, "palabra repetida en el idioma");
    }

    for (const entry of words) {
      const at = language + "/" + (entry.id || "(sin id)");

      if (isBlank(entry.id)) fail(bank, at, "id vacío");
      if (!entry.id.startsWith(language + "-")) {
        fail(bank, at, "el id no lleva el prefijo " + language + "- de su idioma");
      }
      if (isBlank(entry.word)) {
        fail(bank, at, "palabra vacía");
        continue;
      }
      if (isBlank(entry.emoji)) fail(bank, at, "emoji vacío");

      if (entry.word !== entry.word.normalize("NFC")) {
        fail(bank, at, entry.word + " no está en NFC");
      }
      if (!WORD_ALPHABET[language].test(entry.word)) {
        fail(
          bank,
          at,
          entry.word + " usa caracteres fuera del alfabeto de " + language,
        );
      }

      if (entry.level < 1 || entry.level > WORD_SEARCH_MAX_LEVEL) {
        fail(
          bank,
          at,
          "nivel fuera de 1-" + WORD_SEARCH_MAX_LEVEL + ": " + entry.level,
        );
        continue;
      }

      // La palabra tiene que caber en el tablero de su propio nivel; si no,
      // pickSearchWords la descarta siempre y nunca saldría a jugar.
      const size = WORD_SEARCH_LEVELS[entry.level].size;
      const length = getWordLetters(entry.word).length;
      if (length > size) {
        fail(
          bank,
          at,
          entry.word +
            " mide " +
            length +
            " letras y el tablero del nivel " +
            entry.level +
            " es de " +
            size,
        );
      }
    }

    // Un tablero de nivel N se llena con las palabras que quepan en su tamaño.
    const levels: WordSearchLevel[] = [1, 2, 3];
    for (const level of levels) {
      const config = WORD_SEARCH_LEVELS[level];
      const fitting = words.filter(
        (word) => getWordLetters(word.word).length <= config.size,
      ).length;
      if (fitting < config.words) {
        fail(
          bank,
          language + "/nivel " + level,
          "solo " +
            fitting +
            " palabras caben en un tablero de " +
            config.size +
            "; hacen falta " +
            config.words,
        );
      }
    }
  }

  for (const repeated of duplicates(allIds)) {
    fail(bank, repeated, "id repetido entre idiomas");
  }
}

/* --------------------------------------------------------------------------
 * Type Rush
 *
 * Las frases de cada idioma son contenido propio, no traducciones. Se escriben
 * a teclado, así que no admiten caracteres que no estén en uno.
 * ----------------------------------------------------------------------- */

const TYPING_ALLOWED = /^[\p{L}\p{N} .,;:'"¿?¡!()\-]+$/u;

function validateTyping(): void {
  const bank = "typing";

  for (const language of LANGUAGES) {
    const phrases = getTypingPhrases(language);

    // buildTypingPassage recorre phrases[index % phrases.length]: con el banco
    // vacío la división es por cero y el bucle no termina nunca.
    if (phrases.length === 0) {
      fail(bank, language, "sin frases: el generador de textos no terminaría");
      continue;
    }

    for (const repeated of duplicates(phrases)) {
      fail(bank, language + "/" + repeated.slice(0, 32), "frase repetida");
    }

    phrases.forEach((phrase, index) => {
      const at = language + "/frase " + (index + 1);
      if (isBlank(phrase)) {
        fail(bank, at, "frase vacía");
        return;
      }
      if (phrase !== phrase.trim()) {
        fail(bank, at, "la frase empieza o termina con espacios");
      }
      if (phrase.length > TYPING_MIN_PASSAGE) {
        fail(
          bank,
          at,
          "mide " +
            phrase.length +
            " caracteres y un texto entero son " +
            TYPING_MIN_PASSAGE +
            ": llenaría la ronda ella sola",
        );
      }
      if (!TYPING_ALLOWED.test(phrase)) {
        const offenders = [...phrase].filter(
          (character) => !TYPING_ALLOWED.test(character),
        );
        fail(
          bank,
          at,
          "caracteres que no se escriben con un teclado: " +
            [...new Set(offenders)]
              .map((character) => JSON.stringify(character))
              .join(", "),
        );
      }
    });

    const total = phrases.reduce((sum, phrase) => sum + phrase.length + 1, 0);
    if (total < TYPING_MIN_PASSAGE) {
      fail(
        bank,
        language,
        "las frases suman " +
          total +
          " caracteres y un texto pide " +
          TYPING_MIN_PASSAGE +
          ": se repetirían dentro de la misma ronda",
      );
    }
  }
}

/* --------------------------------------------------------------------------
 * Agilidad visual
 *
 * Contenido neutro: el símbolo es un emoji igual en los dos idiomas y solo la
 * etiqueta accesible se traduce.
 * ----------------------------------------------------------------------- */

function validateVisual(): void {
  const bank = "visual";

  for (const id of duplicates(VISUAL_SYMBOLS.map((symbol) => symbol.id))) {
    fail(bank, id, "id repetido");
  }
  // Dos símbolos con el mismo emoji harían ambigua la carta: el niño ve dos
  // iguales y solo uno cuenta como el correcto.
  for (const emoji of duplicates(
    VISUAL_SYMBOLS.map((symbol) => symbol.emoji),
  )) {
    fail(bank, emoji, "emoji repetido: la carta quedaría ambigua");
  }

  for (const symbol of VISUAL_SYMBOLS) {
    const at = symbol.id || "(símbolo sin id)";
    if (isBlank(symbol.id)) fail(bank, at, "id vacío");
    if (isBlank(symbol.emoji)) fail(bank, at, "emoji vacío");
    for (const language of LANGUAGES) {
      if (isBlank(symbol.label[language])) {
        fail(bank, at, "etiqueta " + language + " vacía");
      }
    }
  }

  // La segunda carta repite un símbolo de la primera y necesita ocho
  // distractores que no estén en ella.
  const needed = VISUAL_SYMBOLS_PER_CARD * 2 - 1;
  if (VISUAL_SYMBOLS.length < needed) {
    fail(
      bank,
      "banco",
      VISUAL_SYMBOLS.length +
        " símbolos; hacen falta " +
        needed +
        " para formar dos cartas con un único símbolo en común",
    );
  }
}

/* ----------------------------------------------------------------------- */

validateQuestions();
validateHexagons();
validateWordScramble();
validateWordSearch();
validateTyping();
validateVisual();

if (issues.length > 0) {
  console.error("Content validation failed — " + issues.length + " issue(s)\n");
  let currentBank = "";
  for (const issue of issues) {
    if (issue.bank !== currentBank) {
      currentBank = issue.bank;
      console.error("  " + currentBank);
    }
    console.error("    " + issue.item + ": " + issue.rule);
  }
  console.error("");
  process.exit(1);
}

const counts = [
  questions.length + " questions",
  hexagons.length + " hexagons",
  LANGUAGES.reduce((sum, l) => sum + getWordBank(l).length, 0) +
    " scramble words",
  LANGUAGES.reduce((sum, l) => sum + getSearchBank(l).length, 0) +
    " search words",
  LANGUAGES.reduce((sum, l) => sum + getTypingPhrases(l).length, 0) +
    " typing phrases",
  VISUAL_SYMBOLS.length + " visual symbols",
].join(", ");

console.log("Content validation passed — " + counts);
