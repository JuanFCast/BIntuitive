"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AudioButton from "@/components/AudioButton";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import LevelPicker from "@/components/LevelPicker";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import SessionStars from "@/components/SessionStars";
import type { Stars } from "@/lib/difficulty";
import { useGameTimers } from "@/lib/gameTimers";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import { useLanguage } from "@/lib/i18n";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import {
  getProgress,
  getUnassignedGameProgress,
  getWordScrambleRecent,
  saveWordScrambleRecent,
  saveWordScrambleResult,
} from "@/lib/storage";
import {
  clampScrambleLevel,
  computeWordScrambleStats,
  createLetterTiles,
  getWordLetters,
  pickNextWord,
  rememberScrambleWord,
  scrambleSessionStars,
  WORD_SCRAMBLE_LEVELS,
  WORD_SCRAMBLE_MAX_LEVEL,
  WORD_SCRAMBLE_WORDS_PER_SESSION,
  type LetterTile,
  type ScrambleWord,
  type WordScrambleLevel,
  type WordScrambleStats,
} from "@/lib/wordScramble";
import { hexagonImage } from "@/data/categories";

type Phase = "intro" | "playing" | "results";

const SOLVED_PAUSE_MS = 1100;
const WRONG_FLASH_MS = 350;

export default function WordScrambleGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [word, setWord] = useState<ScrambleWord | null>(null);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [placed, setPlaced] = useState<LetterTile[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wrongTileId, setWrongTileId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<WordScrambleStats | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  // El escalón de la partida en curso, fijado al empezar: el juego ya no lo
  // sube ni lo baja solo, como en Parejas y Trazos. Aparte, el elegido en el
  // selector, el más alto abierto y el aviso de haber tocado uno cerrado.
  const [level, setLevel] = useState<WordScrambleLevel>(1);
  const [unlocked, setUnlocked] = useState<WordScrambleLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<WordScrambleLevel>(1);
  const [lockedHint, setLockedHint] = useState<WordScrambleLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<WordScrambleLevel | null>(
    null,
  );

  // Lo mismo que `level`, para `loadWord`, que vive en un `useCallback`.
  const levelRef = useRef<WordScrambleLevel>(1);
  const usedIdsRef = useRef<string[]>([]);
  const recentIdsRef = useRef<string[]>([]);
  const wordMistakesRef = useRef(0);
  const mistakesRef = useRef(0);
  const correctTapsRef = useRef(0);
  const perfectWordsRef = useRef(0);
  const timers = useGameTimers();
  const sessionLanguageRef = useRef(language);

  // Espejo en refs de las letras colocadas y de los bloqueos. Dos toques en el
  // mismo tick (multitouch en iPad, toques muy rápidos) leerían el mismo estado
  // de React y se pisarían entre sí; las refs se actualizan al instante.
  const placedRef = useRef<LetterTile[]>([]);
  const solvedRef = useRef(false);
  const lockedRef = useRef(false);

  const applyPlaced = useCallback((next: LetterTile[]) => {
    placedRef.current = next;
    setPlaced(next);
  }, []);

  const applyLocked = useCallback((next: boolean) => {
    lockedRef.current = next;
    setLocked(next);
  }, []);

  const { later } = timers;
  const { speakAfterSound, cancel: cancelWordSpeech } =
    useSpeakAfterSound(language);

  const clearTimers = useCallback(() => {
    timers.clear();
    cancelWordSpeech();
  }, [timers, cancelWordSpeech]);

  // Con la ayuda o la confirmación de salida abiertas la partida queda quieta:
  // la pausa tras resolver una palabra se congela, así que al cerrar sigue la
  // misma palabra en pantalla. La locución pendiente se descarta en vez de
  // aplazarse: al volver, el niño ya ha visto la palabra y repetirla tarde
  // confunde más que ayuda.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        timers.freeze();
        // La palabra recién resuelta no debe hablar sobre las instrucciones.
        cancelWordSpeech();
      } else {
        timers.resume();
      }
    },
    [timers, cancelWordSpeech],
  );

  useEffect(() => clearTimers, [clearTimers]);

  const loadWord = useCallback(() => {
    const next = pickNextWord(
      language,
      WORD_SCRAMBLE_LEVELS[levelRef.current].tier,
      usedIdsRef.current,
      recentIdsRef.current,
    );
    if (!next) return false;
    usedIdsRef.current.push(next.id);
    recentIdsRef.current = rememberScrambleWord(recentIdsRef.current, next.id);
    saveWordScrambleRecent(recentIdsRef.current);
    wordMistakesRef.current = 0;
    solvedRef.current = false;
    setWord(next);
    setTiles(
      createLetterTiles(
        next.word,
        WORD_SCRAMBLE_LEVELS[levelRef.current].extraLetters,
        language,
      ),
    );
    applyPlaced([]);
    setWrongTileId(null);
    setSolved(false);
    applyLocked(false);
    return true;
  }, [applyLocked, applyPlaced, language]);

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada. Quien llegó a un
  // nivel con el juego de tres niveles lo encuentra aquí abierto, porque
  // `getProgress` proyecta lo antiguo en el modelo nuevo.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "scramble");
    const open = clampScrambleLevel(stored.unlocked);
    setUnlocked(open);
    // El último elegido, salvo que fuera más alto de lo que hoy está abierto.
    setSelectedLevel(clampScrambleLevel(Math.min(stored.difficulty, open)));
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    // El escalón es el elegido en el selector y se queda fijo hasta el final.
    levelRef.current = selectedLevel;
    usedIdsRef.current = [];
    recentIdsRef.current = getWordScrambleRecent();
    mistakesRef.current = 0;
    correctTapsRef.current = 0;
    perfectWordsRef.current = 0;
    setLevel(selectedLevel);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setWordIndex(0);
    setResult(null);
    setIsRecord(false);
    loadWord();
    setPhase("playing");
  }, [clearTimers, loadWord, selectedLevel]);

  // El banco de palabras depende del idioma: si cambia, la sesión vuelve al inicio.
  useEffect(() => {
    if (sessionLanguageRef.current === language) return;
    sessionLanguageRef.current = language;
    clearTimers();
    setPhase("intro");
  }, [clearTimers, language]);

  /**
   * La partida llegó al final, así que hay valoración: la precisión decide
   * cuántas estrellas vale. Abandonar a mitad no pasa por aquí y por eso no
   * desbloquea nada ni guarda nada.
   */
  const finishGame = useCallback(
    (solvedWords: number) => {
      const stats = computeWordScrambleStats(
        solvedWords,
        perfectWordsRef.current,
        correctTapsRef.current,
        mistakesRef.current,
      );
      const played = levelRef.current;
      const rating = scrambleSessionStars(stats.accuracy);
      const nextUnlocked =
        rating >= 2
          ? clampScrambleLevel(Math.max(unlocked, played + 1))
          : unlocked;
      const previousBest =
        getUnassignedGameProgress(getProgress(), "scramble").best
          .perfectWords ?? 0;

      saveWordScrambleResult({
        playedLevel: played,
        sessionStars: rating,
        perfectWords: stats.perfectWords,
        playedAt: new Date().toISOString(),
      });

      setResult(stats);
      setIsRecord(stats.perfectWords > 0 && stats.perfectWords > previousBest);
      setSessionStars(rating);
      // Solo se anuncia lo que se acaba de abrir, no lo que ya estaba abierto.
      setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
      setUnlocked(nextUnlocked);
      setPhase("results");
      playCelebrationSound();
    },
    [unlocked],
  );

  /**
   * Volver a la introducción, donde está el selector, igual que en Parejas:
   * si se acaba de abrir un nivel, lo que se quiere es probarlo, y solo se
   * puede elegir ahí. Empezar sigue estando a un toque.
   */
  const backToIntro = () => {
    clearTimers();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: WordScrambleLevel) => {
    if (option > unlocked) {
      // Un nivel cerrado no se elige: se explica cómo se abre.
      setLockedHint(option);
      playWrongSound();
      return;
    }
    setLockedHint(null);
    setSelectedLevel(option);
    playTapSound();
  };

  const completeWord = useCallback((solvedWord: string) => {
    // Blindaje: la palabra solo puede completarse una vez, aunque dos toques
    // simultáneos alcancen la última letra en el mismo tick.
    if (solvedRef.current) return;
    solvedRef.current = true;

    if (wordMistakesRef.current === 0) perfectWordsRef.current += 1;

    setSolved(true);
    applyLocked(true);
    playCorrectSound();

    // Primero el sonido de acierto, y la palabra en voz alta justo después: se
    // envía con su ortografía real, así que BEBÉ, PIÑA o PINGÜINO se
    // pronuncian como se escriben.
    speakAfterSound(solvedWord);

    later(() => {
      const nextIndex = wordIndex + 1;
      setWordIndex(nextIndex);
      if (nextIndex >= WORD_SCRAMBLE_WORDS_PER_SESSION || !loadWord()) {
        finishGame(nextIndex);
      }
    }, SOLVED_PAUSE_MS);
  }, [applyLocked, finishGame, later, loadWord, speakAfterSound, wordIndex]);

  // Letras reales de la palabra: `Ñ`, `Ü` y las vocales con tilde cuentan como una.
  const letters = word ? getWordLetters(word.word) : [];
  const levelConfig = WORD_SCRAMBLE_LEVELS[level];

  const handleTapLetter = (tile: LetterTile) => {
    if (!word || phase !== "playing" || lockedRef.current || solvedRef.current) {
      return;
    }
    const current = placedRef.current;
    if (current.some((item) => item.id === tile.id)) return;

    const expected = letters[current.length];
    if (tile.letter !== expected) {
      mistakesRef.current += 1;
      wordMistakesRef.current += 1;
      setWrongTileId(tile.id);
      applyLocked(true);
      playWrongSound();
      later(() => {
        setWrongTileId(null);
        applyLocked(false);
      }, WRONG_FLASH_MS);
      return;
    }

    correctTapsRef.current += 1;
    const nextPlaced = [...current, tile];
    applyPlaced(nextPlaced);
    playTapSound();
    if (nextPlaced.length === letters.length) completeWord(word.word);
  };

  const handleUndo = () => {
    const current = placedRef.current;
    if (lockedRef.current || solvedRef.current || current.length === 0) return;
    applyPlaced(current.slice(0, -1));
    playTapSound();
  };

  const handleClear = () => {
    if (lockedRef.current || solvedRef.current || placedRef.current.length === 0) {
      return;
    }
    applyPlaced([]);
    playTapSound();
  };

  const placedIds = new Set(placed.map((tile) => tile.id));
  const answerText = placed.map((tile) => tile.letter).join("");

  return (
    <GameShell
      intro={{
        image: hexagonImage("scramble"),
        title: t("scrambleTitle"),
        goal: t("scrambleIntro"),
        howTo: t("scrambleHowTo"),
        example: <ScrambleExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("scrambleStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={WORD_SCRAMBLE_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampScrambleLevel(option))}
        />
      }
    >
      {phase === "playing" && word && (
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 pb-4 pt-3 sm:min-h-[calc(100svh-6rem)] sm:justify-center sm:gap-8 sm:pt-6">
          <div className="flex w-full items-center justify-between gap-3">
            <span
              className="rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-base font-extrabold tabular-nums text-ink/70 shadow-sm sm:text-lg"
              role="status"
              aria-label={t("scrambleProgressAria", {
                current: Math.min(wordIndex + 1, WORD_SCRAMBLE_WORDS_PER_SESSION),
                total: WORD_SCRAMBLE_WORDS_PER_SESSION,
              })}
            >
              {Math.min(wordIndex + 1, WORD_SCRAMBLE_WORDS_PER_SESSION)} / {WORD_SCRAMBLE_WORDS_PER_SESSION}
            </span>
            <span
              className="flex items-center gap-2 rounded-full border-2 border-mint bg-mintsoft px-4 py-1.5 text-sm font-extrabold text-ink/70 shadow-sm sm:text-base"
              aria-label={t("scrambleLevelAria", {
                level,
                total: WORD_SCRAMBLE_MAX_LEVEL,
              })}
            >
              <span>{t("scrambleLevel")}</span>
              <span aria-hidden="true" className="flex gap-1">
                {Array.from({ length: WORD_SCRAMBLE_MAX_LEVEL }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index < level ? "bg-ink/70" : "bg-ink/15"
                    }`}
                  />
                ))}
              </span>
            </span>
          </div>

          {/*
            En el escalón 5 no hay dibujo: queda la pista. El botón de
            escuchar lee entonces la pista y no la palabra —leerla sería dar
            la respuesta— y así la pista sirve también a quien aún no lee.
          */}
          <div className="flex w-full items-center gap-4 rounded-3xl border-2 border-mint bg-white px-4 py-4 shadow-[0_10px_28px_rgba(74,56,0,0.08)] sm:gap-5 sm:px-6 sm:py-5">
            {levelConfig.showPicture && (
              <span
                className="text-[clamp(3rem,13vw,4.5rem)] leading-none"
                aria-hidden="true"
              >
                {word.emoji}
              </span>
            )}
            <p className="min-w-0 flex-1 text-left text-base font-bold leading-snug text-ink/70 sm:text-xl">
              {word.clue}
            </p>
            {levelConfig.showPicture ? (
              <AudioButton text={word.word} label={t("scrambleListen")} />
            ) : (
              <AudioButton text={word.clue} label={t("scrambleListenClue")} />
            )}
          </div>

          <div className="w-full text-center">
            <p className="text-sm font-extrabold text-[#7a5c00] sm:text-base">
              {t("scrambleInstruction")}
            </p>
            {levelConfig.extraLetters > 0 && (
              <p className="mt-1 text-sm font-bold text-ink/60 sm:text-base">
                {t("scrambleExtraLetters")}
              </p>
            )}

            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3"
              role="status"
              aria-live="polite"
              aria-label={t("scrambleAnswerAria", {
                word: answerText || t("scrambleEmptyAnswer"),
              })}
            >
              {letters.map((_, index) => {
                const tile = placed[index];
                const isNext = index === placed.length && !solved;
                const stateClass = solved
                  ? "animate-pop border-[#e0a800] bg-sun text-black"
                  : tile
                    ? "border-mint bg-mintsoft text-ink"
                    : isNext
                      ? "border-mint bg-white text-ink"
                      : "border-dashed border-ink/20 bg-white text-ink";

                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`flex h-[clamp(3rem,11vw,4.5rem)] w-[clamp(2.6rem,9vw,4rem)] items-center justify-center rounded-2xl border-[3px] text-[clamp(1.5rem,5.5vw,2.5rem)] sm:h-[clamp(4.5rem,10vw,6rem)] sm:w-[clamp(4rem,9vw,5.25rem)] sm:text-[clamp(2.5rem,5vw,3.25rem)] font-extrabold uppercase leading-none shadow-sm transition-colors duration-200 ${stateClass}`}
                  >
                    {tile?.letter ?? ""}
                  </span>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={placed.length === 0 || solved}
                aria-label={t("scrambleUndo")}
                className="flex h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-30"
              >
                <span aria-hidden="true">⌫</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={placed.length === 0 || solved}
                aria-label={t("scrambleClear")}
                className="flex h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-30"
              >
                <span aria-hidden="true">↺</span>
              </button>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            aria-label={t("scrambleLettersAria")}
          >
            {tiles.map((tile) => {
              const used = placedIds.has(tile.id);
              const isWrong = wrongTileId === tile.id;
              const stateClass = isWrong
                ? "animate-shake border-coral bg-coralsoft"
                : "border-ink/15 bg-white";

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTapLetter(tile)}
                  disabled={used || locked}
                  aria-label={t("scrambleLetterAria", { letter: tile.letter })}
                  className={`flex h-[clamp(3.5rem,13vw,5rem)] w-[clamp(3.2rem,12vw,4.75rem)] items-center justify-center rounded-2xl border-[3px] text-[clamp(1.75rem,6.5vw,2.75rem)] sm:h-[clamp(5rem,10.5vw,6.5rem)] sm:w-[clamp(4.75rem,9.5vw,6.25rem)] sm:text-[clamp(2.75rem,5.5vw,3.5rem)] font-extrabold uppercase leading-none text-ink shadow-[0_6px_0_rgba(74,56,0,0.08)] transition-transform duration-150 active:scale-90 disabled:opacity-25 disabled:shadow-none ${stateClass}`}
                >
                  <span aria-hidden="true">{tile.letter}</span>
                </button>
              );
            })}
          </div>

          <p
            className={`min-h-8 text-2xl font-extrabold text-[#27885a] transition-opacity duration-200 ${
              solved ? "animate-fade-up opacity-100" : "opacity-0"
            }`}
            role="status"
            aria-live="polite"
          >
            {solved ? t("feedbackCorrect") : ""}
          </p>
        </section>
      )}

      {phase === "results" && result && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={140}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("scrambleResultsTitle")}
            </h1>
            <p className="mt-2 text-lg font-semibold text-ink/60">
              {t("scrambleResultsText", { total: result.solvedWords })}
            </p>
            <p className="mt-1 text-base font-extrabold text-ink/70">
              {t("scrambleLevelLabel", { level })}
            </p>
            {isRecord && (
              <p className="mt-3 inline-block rounded-full border-2 border-sun bg-sunsoft px-5 py-1.5 text-base font-extrabold text-ink">
                {t("scrambleRecord")}
              </p>
            )}
          </div>
          {/* Aparte de las palabras y la precisión, que van en sus tarjetas. */}
          <SessionStars stars={sessionStars} openedLevel={openedLevel} />
          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              label={t("scramblePerfectWords")}
              value={`${result.perfectWords}/${result.solvedWords}`}
            />
            <ResultStat
              label={t("scrambleAccuracy")}
              value={`${Math.round(result.accuracy * 100)}%`}
            />
            <ResultStat label={t("scrambleMistakes")} value={result.mistakes} />
          </div>
          <ResultActions
            playAgainLabel={t("scramblePlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

/**
 * Ejemplo estático de la intro: las letras sueltas y, debajo, la palabra ya
 * formada. La palabra es propia de cada idioma, no una traducción.
 */
function ScrambleExample() {
  const { t } = useLanguage();
  const word = t("scrambleExampleWord");

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={t("scrambleExampleAria")}
    >
      <p
        className="text-lg font-extrabold tracking-[0.15em] text-ink/60"
        aria-hidden="true"
      >
        {t("scrambleExampleLetters")}
      </p>
      <span aria-hidden="true" className="text-base font-extrabold text-ink/35">
        ↓
      </span>
      <p className="flex gap-1" aria-hidden="true">
        {getWordLetters(word).map((letter, index) => (
          <span
            key={index}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-mint bg-mintsoft text-lg font-extrabold text-ink"
          >
            {letter}
          </span>
        ))}
      </p>
    </div>
  );
}

