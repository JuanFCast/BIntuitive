"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import MuteButton from "@/components/MuteButton";
import { useLanguage } from "@/lib/i18n";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { cancelSpeech, speak, warmUpVoices } from "@/lib/speech";
import {
  getWordSearchProgress,
  isMuted,
  saveWordSearchProgress,
} from "@/lib/storage";
import {
  buildLine,
  cellKey,
  clampSearchLevel,
  computeWordSearchStats,
  findSelection,
  formatSearchTime,
  generateBoard,
  isSameCell,
  nextWordSearchLevel,
  snapSelection,
  WORD_SEARCH_BOARDS_PER_SESSION,
  WORD_SEARCH_MAX_LEVEL,
  type Board,
  type Cell,
  type WordSearchStats,
} from "@/lib/wordSearch";

type Phase = "intro" | "playing" | "results";

const BOARD_PAUSE_MS = 1400;
const MISS_FLASH_MS = 400;

export default function WordSearchGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [board, setBoard] = useState<Board | null>(null);
  const [boardIndex, setBoardIndex] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [head, setHead] = useState<Cell | null>(null);
  const [missCells, setMissCells] = useState<Cell[]>([]);
  const [lastFound, setLastFound] = useState("");
  const [boardDone, setBoardDone] = useState(false);
  const [level, setLevel] = useState(1);
  const [now, setNow] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [result, setResult] = useState<WordSearchStats | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const boardIndexRef = useRef(0);
  const usedIdsRef = useRef<string[]>([]);
  const foundIdsRef = useRef<string[]>([]);
  const wordsFoundRef = useRef(0);
  const totalWordsRef = useRef(0);
  const missesRef = useRef(0);
  const boardMissesRef = useRef(0);
  const startedAtRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionLanguageRef = useRef(language);

  // Espejo en refs del gesto y del bloqueo: los eventos de puntero llegan
  // mucho más rápido que los renders, y leer el estado de React dejaría el
  // trazo un movimiento por detrás del dedo.
  const anchorRef = useRef<Cell | null>(null);
  const headRef = useRef<Cell | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const boardDataRef = useRef<Board | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      cancelSpeech();
    },
    [clearTimers],
  );

  // En iOS las voces cargan de forma asíncrona: precalentar la lista para que
  // la primera palabra encontrada ya suene con la voz del idioma correcto.
  useEffect(() => {
    warmUpVoices();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [phase]);

  const applyAnchor = useCallback((cell: Cell | null) => {
    anchorRef.current = cell;
    setAnchor(cell);
  }, []);

  const applyHead = useCallback((cell: Cell | null) => {
    headRef.current = cell;
    setHead(cell);
  }, []);

  const clearSelection = useCallback(() => {
    applyAnchor(null);
    applyHead(null);
    draggingRef.current = false;
    pointerIdRef.current = null;
  }, [applyAnchor, applyHead]);

  const loadBoard = useCallback(() => {
    const next = generateBoard(
      language,
      clampSearchLevel(levelRef.current),
      Math.random,
      usedIdsRef.current,
    );
    usedIdsRef.current = [
      ...usedIdsRef.current,
      ...next.placements.map((placement) => placement.id),
    ];
    totalWordsRef.current += next.placements.length;
    boardMissesRef.current = 0;
    foundIdsRef.current = [];
    boardDataRef.current = next;
    setBoard(next);
    setFoundIds([]);
    setMissCells([]);
    setLastFound("");
    setBoardDone(false);
    clearSelection();
  }, [clearSelection, language]);

  const startGame = useCallback(() => {
    clearTimers();
    levelRef.current = getWordSearchProgress().level;
    streakRef.current = 0;
    boardIndexRef.current = 0;
    usedIdsRef.current = [];
    wordsFoundRef.current = 0;
    totalWordsRef.current = 0;
    missesRef.current = 0;
    startedAtRef.current = Date.now();
    lockedRef.current = false;
    setLevel(levelRef.current);
    setBoardIndex(0);
    setNow(Date.now());
    setFinalTime(0);
    setResult(null);
    setIsRecord(false);
    loadBoard();
    setPhase("playing");
  }, [clearTimers, loadBoard]);

  // El banco de palabras depende del idioma: si cambia, la sesión vuelve al inicio.
  useEffect(() => {
    if (sessionLanguageRef.current === language) return;
    sessionLanguageRef.current = language;
    clearTimers();
    cancelSpeech();
    lockedRef.current = false;
    setPhase("intro");
  }, [clearTimers, language]);

  const finishGame = useCallback(() => {
    const timeMs = Date.now() - startedAtRef.current;
    const stats = computeWordSearchStats(
      WORD_SEARCH_BOARDS_PER_SESSION,
      wordsFoundRef.current,
      totalWordsRef.current,
      missesRef.current,
      timeMs,
      levelRef.current,
    );
    const previousBest = getWordSearchProgress().bestWordsFound;
    saveWordSearchProgress({
      level: levelRef.current,
      bestWordsFound: stats.wordsFound,
    });
    setFinalTime(timeMs);
    setResult(stats);
    setIsRecord(stats.wordsFound > 0 && stats.wordsFound > previousBest);
    setPhase("results");
    playCelebrationSound();
  }, []);

  const completeBoard = useCallback(() => {
    lockedRef.current = true;
    setBoardDone(true);
    playCelebrationSound();

    const progression = nextWordSearchLevel(
      levelRef.current,
      streakRef.current,
      boardMissesRef.current,
    );
    levelRef.current = progression.level;
    streakRef.current = progression.streak;

    later(() => {
      const nextIndex = boardIndexRef.current + 1;
      if (nextIndex >= WORD_SEARCH_BOARDS_PER_SESSION) {
        finishGame();
        return;
      }
      boardIndexRef.current = nextIndex;
      setBoardIndex(nextIndex);
      setLevel(levelRef.current);
      loadBoard();
      lockedRef.current = false;
    }, BOARD_PAUSE_MS);
  }, [finishGame, later, loadBoard]);

  /** Valida una línea ya recta: acierto, repetición o selección fallida. */
  const validateSelection = useCallback(
    (line: Cell[]) => {
      const current = boardDataRef.current;
      if (!current) return;

      // Sin `foundIds`: así una palabra ya encontrada se reconoce como
      // repetición y no se cuenta como error ni se suma dos veces.
      const match = findSelection(current, line, []);
      clearSelection();

      if (!match) {
        missesRef.current += 1;
        boardMissesRef.current += 1;
        setMissCells(line);
        setLastFound("");
        playWrongSound();
        later(() => setMissCells([]), MISS_FLASH_MS);
        return;
      }

      if (foundIdsRef.current.includes(match.id)) return;

      const nextFound = [...foundIdsRef.current, match.id];
      foundIdsRef.current = nextFound;
      wordsFoundRef.current += 1;
      setFoundIds(nextFound);
      setLastFound(match.word);
      playCorrectSound();

      // Pronunciación de la palabra encontrada. Va dentro del mismo gesto que
      // soltó la selección porque iOS solo permite hablar a SpeechSynthesis
      // como consecuencia directa de un gesto. `speak` cancela lo anterior,
      // así que dos hallazgos seguidos no se montan uno sobre otro. El mute se
      // comprueba aquí, igual que hacen AudioButton y ResultsScreen.
      if (!isMuted()) speak(match.word, language);

      if (nextFound.length >= current.placements.length) completeBoard();
    },
    [clearSelection, completeBoard, language, later],
  );

  const cellFromPoint = (clientX: number, clientY: number): Cell | null => {
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest("[data-cell]") ?? null;
    if (!target || !boardRef.current?.contains(target)) return null;
    const raw = target.getAttribute("data-cell");
    if (!raw) return null;
    const [row, col] = raw.split("-").map(Number);
    return { row, col };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "playing" || lockedRef.current || !boardDataRef.current) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;

    event.preventDefault();
    const armed = anchorRef.current;

    // Segundo toque sobre la misma celda de inicio: cancela la selección.
    if (armed && isSameCell(armed, cell)) {
      clearSelection();
      playTapSound();
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Sin captura el gesto sigue funcionando mientras el dedo no salga.
    }
    pointerIdRef.current = event.pointerId;
    draggingRef.current = true;
    if (!armed) {
      applyAnchor(cell);
      playTapSound();
    }
    applyHead(cell);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || event.pointerId !== pointerIdRef.current) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    const currentHead = headRef.current;
    if (currentHead && isSameCell(currentHead, cell)) return;
    applyHead(cell);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    draggingRef.current = false;
    pointerIdRef.current = null;

    const current = boardDataRef.current;
    const anchorCell = anchorRef.current;
    const headCell = headRef.current;
    if (!current || !anchorCell || !headCell) return;

    const line = snapSelection(anchorCell, headCell, current.size);
    if (line.length < 2) {
      // Un toque suelto deja el ancla armada: la palabra se cierra con un
      // segundo toque en la última letra, sin necesidad de arrastrar.
      applyHead(anchorCell);
      return;
    }
    validateSelection(line);
  };

  const handlePointerCancel = () => {
    clearSelection();
  };

  /** Activación por teclado: dos pulsaciones, primera y última letra. */
  const handleCellActivate = (cell: Cell) => {
    const current = boardDataRef.current;
    if (phase !== "playing" || lockedRef.current || !current) return;

    const armed = anchorRef.current;
    if (!armed) {
      applyAnchor(cell);
      applyHead(cell);
      playTapSound();
      return;
    }
    if (isSameCell(armed, cell)) {
      clearSelection();
      playTapSound();
      return;
    }

    const line = buildLine(armed, cell);
    if (!line) {
      // No están alineadas: la nueva celda pasa a ser el inicio.
      applyAnchor(cell);
      applyHead(cell);
      playTapSound();
      return;
    }
    validateSelection(line);
  };

  const selection =
    board && anchor && head ? snapSelection(anchor, head, board.size) : [];
  const selectionKeys = new Set(selection.map(cellKey));
  const missKeys = new Set(missCells.map(cellKey));
  const foundKeys = new Set(
    board
      ? board.placements
          .filter((placement) => foundIds.includes(placement.id))
          .flatMap((placement) => placement.cells.map(cellKey))
      : [],
  );

  const letterSizeClass = !board
    ? ""
    : board.size <= 7
      ? "text-[clamp(1.1rem,5.2vw,2rem)]"
      : board.size <= 9
        ? "text-[clamp(0.9rem,4.1vw,1.6rem)]"
        : "text-[clamp(0.8rem,3.6vw,1.4rem)]";

  const wordList = board
    ? [...board.placements].sort((a, b) =>
        a.word.localeCompare(b.word, language),
      )
    : [];

  const elapsed =
    phase === "playing" ? Math.max(0, now - startedAtRef.current) : finalTime;

  return (
    <main className="min-h-dvh overflow-y-auto bg-cream px-3 py-3 sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/hexagons"
          aria-label={t("backToHexagons")}
          className="flex min-h-12 items-center rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95"
        >
          ← <span className="hidden sm:inline">{t("backToHexagons")}</span>
        </Link>
        <MuteButton />
      </header>

      {phase === "intro" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={130}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <p className="text-5xl" aria-hidden="true">🔠</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
              {t("searchTitle")}
            </h1>
            <p className="mt-3 text-xl font-bold text-ink/70">
              {t("searchIntro")}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-ink/55 sm:text-lg">
              {t("searchHowTo")}
            </p>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="min-h-16 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-10 py-3 text-2xl font-extrabold text-black shadow-xl transition-transform active:scale-95 active:border-b-4"
          >
            {t("searchStart")}
          </button>
        </section>
      )}

      {phase === "playing" && board && (
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 pb-6 pt-3 sm:gap-4 sm:pt-5">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span
              className="rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 font-mono text-base font-extrabold tabular-nums text-ink/70 shadow-sm sm:text-lg"
              role="status"
              aria-label={t("searchProgressAria", {
                current: boardIndex + 1,
                total: WORD_SEARCH_BOARDS_PER_SESSION,
              })}
            >
              {boardIndex + 1} / {WORD_SEARCH_BOARDS_PER_SESSION}
            </span>
            <span
              className="rounded-full border-2 border-sky bg-skysoft px-4 py-1.5 font-mono text-base font-extrabold tabular-nums text-ink/70 shadow-sm sm:text-lg"
              aria-hidden="true"
            >
              {formatSearchTime(elapsed)}
            </span>
            <span
              className="flex items-center gap-2 rounded-full border-2 border-mint bg-mintsoft px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-ink/70 shadow-sm sm:text-base"
              aria-label={t("searchLevelAria", {
                level,
                total: WORD_SEARCH_MAX_LEVEL,
              })}
            >
              <span>{t("searchLevel")}</span>
              <span aria-hidden="true" className="flex gap-1">
                {Array.from({ length: WORD_SEARCH_MAX_LEVEL }, (_, index) => (
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

          <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
            <div className="w-full lg:order-2 lg:w-64">
              <p className="text-center text-sm font-extrabold uppercase tracking-[0.2em] text-[#9b7400] lg:text-left">
                {t("searchWordsHeading")}
              </p>
              <ul className="mt-2 flex flex-wrap justify-center gap-2 lg:flex-col lg:justify-start">
                {wordList.map((placement) => {
                  const found = foundIds.includes(placement.id);
                  return (
                    <li
                      key={placement.id}
                      className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-base font-extrabold uppercase tracking-wide shadow-sm transition-colors duration-200 sm:text-lg ${
                        found
                          ? "border-mint bg-mintsoft text-ink/45 line-through"
                          : "border-ink/10 bg-white text-ink"
                      }`}
                    >
                      {/* El texto visible lleva emoji y tachado; el estado se
                          anuncia aparte para que se lea "encontrada". */}
                      <span className="sr-only">
                        {t(
                          found ? "searchWordFoundAria" : "searchWordPendingAria",
                          { word: placement.word },
                        )}
                      </span>
                      <span aria-hidden="true">{placement.emoji}</span>
                      <span aria-hidden="true">{placement.word}</span>
                      {found && (
                        <span aria-hidden="true" className="text-[#27885a]">
                          ✓
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col items-center gap-3 lg:order-1">
              <div
                ref={boardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                role="group"
                aria-label={t("searchGridAria", { size: board.size })}
                className="word-search-board rounded-3xl border-2 border-ink/10 bg-white p-2 shadow-[0_10px_28px_rgba(74,56,0,0.08)]"
                style={{
                  gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`,
                }}
              >
                {board.grid.map((row, rowIndex) =>
                  row.map((letter, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const isMiss = missKeys.has(key);
                    const isSelected = selectionKeys.has(key);
                    const isFound = foundKeys.has(key);
                    const stateClass = isMiss
                      ? "animate-shake border-coral bg-coralsoft text-ink"
                      : isSelected
                        ? "border-sky bg-skysoft text-ink"
                        : isFound
                          ? "border-mint bg-mintsoft text-ink"
                          : "border-ink/10 bg-white text-ink";

                    return (
                      <button
                        key={key}
                        type="button"
                        data-cell={key}
                        onClick={(event) => {
                          // Solo el teclado: el ratón y el dedo usan los
                          // eventos de puntero y ya validaron al soltar.
                          if (event.detail === 0) {
                            handleCellActivate({ row: rowIndex, col: colIndex });
                          }
                        }}
                        aria-label={t("searchCellAria", {
                          letter,
                          row: rowIndex + 1,
                          column: colIndex + 1,
                        })}
                        className={`flex aspect-square touch-none select-none items-center justify-center rounded-lg border-2 font-extrabold uppercase leading-none transition-colors duration-150 ${letterSizeClass} ${stateClass}`}
                      >
                        <span aria-hidden="true">{letter}</span>
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="flex items-center gap-3">
                <p className="text-center text-sm font-bold text-ink/55 sm:text-base">
                  {t("searchInstruction")}
                </p>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selection.length === 0}
                  aria-label={t("searchClearSelection")}
                  className="flex h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-30"
                >
                  <span aria-hidden="true">↺</span>
                </button>
              </div>

              <p
                className={`min-h-8 text-xl font-extrabold text-[#27885a] transition-opacity duration-200 sm:text-2xl ${
                  lastFound || boardDone ? "animate-fade-up opacity-100" : "opacity-0"
                }`}
                role="status"
                aria-live="polite"
              >
                {boardDone
                  ? t("searchBoardDone")
                  : lastFound
                    ? t("searchFound", { word: lastFound })
                    : ""}
              </p>
            </div>
          </div>
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
              {t("searchResultsTitle")}
            </h1>
            <p className="mt-2 text-lg font-semibold text-ink/60">
              {t("searchResultsText", {
                total: result.wordsFound,
                boards: result.boards,
              })}
            </p>
            {isRecord && (
              <p className="mt-3 inline-block rounded-full border-2 border-sun bg-sunsoft px-5 py-1.5 text-base font-extrabold text-ink">
                {t("searchRecord")}
              </p>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            <ResultStat
              label={t("searchWordsFound")}
              value={`${result.wordsFound}/${result.totalWords}`}
            />
            <ResultStat
              label={t("searchTime")}
              value={formatSearchTime(result.timeMs)}
            />
            <ResultStat
              label={t("searchAccuracy")}
              value={`${Math.round(result.accuracy * 100)}%`}
            />
            <ResultStat label={t("searchMisses")} value={result.misses} />
            <ResultStat
              label={t("searchLevelReached")}
              value={`${result.level}/${WORD_SEARCH_MAX_LEVEL}`}
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startGame}
              className="min-h-14 flex-1 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-6 py-3 text-xl font-extrabold text-black shadow-lg active:scale-95 active:border-b-4"
            >
              {t("searchPlayAgain")}
            </button>
            <Link
              href="/hexagons"
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-b-8 border-black/30 bg-black px-6 py-3 text-xl font-extrabold text-white shadow-lg active:scale-95 active:border-b-4"
            >
              {t("backToHexagons")}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-mint bg-white px-2 py-4 shadow-sm">
      <p className="text-2xl font-extrabold text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/50 sm:text-sm">
        {label}
      </p>
    </div>
  );
}
