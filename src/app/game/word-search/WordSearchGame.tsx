"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import { useClockPause } from "@/lib/clockPause";
import { useGameTimers } from "@/lib/gameTimers";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import { useLanguage } from "@/lib/i18n";
import { getWordLetters } from "@/lib/letters";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import {
  getWordSearchProgress,
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
  const timers = useGameTimers();
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

  // Un gesto de puntero puede ser dos cosas y no se sabe cuál hasta que
  // termina: un toque, que apunta a una celda concreta, o un arrastre, que va
  // por encima de varias. Se apunta dónde se apoyó el dedo y si llegó a salir
  // de esa celda; al soltar, eso decide con qué regla se cierra el recorrido.
  const gestureOriginRef = useRef<Cell | null>(null);
  const movedRef = useRef(false);
  // Si la letra la armó este mismo gesto, soltar sin moverse no puede
  // interpretarse como el segundo toque: sería cancelar lo que se acaba de
  // elegir.
  const armedHereRef = useRef(false);

  const { speakAfterSound, cancel: cancelWordSpeech } =
    useSpeakAfterSound(language);

  const clearTimers = useCallback(() => {
    timers.clear();
    cancelWordSpeech();
  }, [timers, cancelWordSpeech]);

  const { later } = timers;

  useEffect(() => clearTimers, [clearTimers]);

  // El cronómetro se detiene mientras haya algo superpuesto: las palabras ya
  // encontradas, el tablero y la selección en curso siguen intactos.
  const [paused, pauseClock] = useClockPause(
    useCallback((pausedMs: number) => {
      startedAtRef.current += pausedMs;
      setNow(Date.now());
    }, []),
  );

  // Con la ayuda o la confirmación de salida abiertas la partida queda quieta:
  // se congelan el destello del fallo y la espera entre tableros, y se
  // descarta la palabra que estuviera a punto de pronunciarse para no hablar
  // por encima de lo que hay abierto.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        timers.freeze();
        cancelWordSpeech();
      } else {
        timers.resume();
      }
      pauseClock(open);
    },
    [timers, cancelWordSpeech, pauseClock],
  );

  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [phase, paused]);

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
    gestureOriginRef.current = null;
    movedRef.current = false;
    armedHereRef.current = false;
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
    lockedRef.current = false;
    // El banco siguiente es otro: una letra armada del tablero anterior no
    // significa nada en el nuevo y no puede sobrevivir al cambio.
    clearSelection();
    setPhase("intro");
  }, [clearSelection, clearTimers, language]);

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

      // Primero el sonido de acierto, y la palabra en voz alta justo despues.
      speakAfterSound(match.word);

      if (nextFound.length >= current.placements.length) completeBoard();
    },
    [clearSelection, completeBoard, later, speakAfterSound],
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

  /**
   * La regla del toque: la primera pulsación arma la letra inicial y la
   * segunda cierra el recorrido entre las dos. La usan por igual el teclado
   * —Enter o Espacio sobre una letra— y el dedo o el ratón cuando tocan sin
   * arrastrar, así que las dos formas de jugar sin arrastre se comportan
   * exactamente igual.
   *
   * Aquí el recorrido es exacto (`buildLine`), no redondeado: un toque señala
   * una celda concreta y no hay nada que adivinar. Dos letras que no están
   * alineadas tampoco forman ningún recorrido, así que la segunda pasa a ser
   * el nuevo inicio en vez de contar como fallo: quien se equivoca de letra al
   * apuntar no está fallando una palabra.
   *
   * Validar es cosa de `validateSelection`, la misma que cierra el arrastre.
   */
  const activateCell = useCallback(
    (cell: Cell) => {
      const current = boardDataRef.current;
      if (phase !== "playing" || lockedRef.current || !current) return;

      const armed = anchorRef.current;
      if (!armed) {
        applyAnchor(cell);
        applyHead(cell);
        playTapSound();
        return;
      }

      // Volver a tocar la letra inicial deshace la selección.
      if (isSameCell(armed, cell)) {
        clearSelection();
        playTapSound();
        return;
      }

      const line = buildLine(armed, cell);
      if (!line) {
        applyAnchor(cell);
        applyHead(cell);
        playTapSound();
        return;
      }
      validateSelection(line);
    },
    [applyAnchor, applyHead, clearSelection, phase, validateSelection],
  );

  /**
   * Apoyar el dedo todavía no dice si esto va a ser un toque o un arrastre, y
   * por eso aquí solo se anota dónde empezó.
   *
   * Sin nada armado, la letra se marca ya: el destello bajo el dedo es la
   * respuesta inmediata de siempre. Con una letra ya armada no se mueve la
   * cabeza de la selección, porque hacerlo pintaría la línea redondeada del
   * arrastre debajo de un dedo que solo está tocando la última letra.
   */
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "playing" || lockedRef.current || !boardDataRef.current) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Sin captura el gesto sigue funcionando mientras el dedo no salga.
    }
    pointerIdRef.current = event.pointerId;
    draggingRef.current = true;
    gestureOriginRef.current = cell;
    movedRef.current = false;
    armedHereRef.current = false;

    if (!anchorRef.current) {
      armedHereRef.current = true;
      applyAnchor(cell);
      applyHead(cell);
      playTapSound();
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || event.pointerId !== pointerIdRef.current) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;

    const origin = gestureOriginRef.current;
    if (!origin) return;

    // Mientras el dedo no salga de la celda donde se apoyó, esto todavía puede
    // acabar siendo un toque y no hay trazo que mover. En cuanto sale, el
    // gesto es un arrastre, y el arrastre manda sobre cualquier letra que
    // hubiera dejado armada un toque anterior: el trazo empieza donde se apoyó
    // el dedo, no donde quedó aquel toque suelto.
    //
    // La comprobación solo decide eso. Pasar de aquí y seguir moviendo la
    // cabeza es lo que permite deshacer un trazo volviendo sobre los propios
    // pasos, incluso hasta la casilla de partida.
    if (!movedRef.current) {
      if (isSameCell(origin, cell)) return;
      movedRef.current = true;
      if (!armedHereRef.current) applyAnchor(origin);
    }

    const currentHead = headRef.current;
    if (currentHead && isSameCell(currentHead, cell)) return;
    applyHead(cell);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    draggingRef.current = false;
    pointerIdRef.current = null;

    const current = boardDataRef.current;
    const origin = gestureOriginRef.current;
    const moved = movedRef.current;
    gestureOriginRef.current = null;
    movedRef.current = false;
    if (!current || !origin) return;

    // El dedo no salió de su celda: es un toque. Si fue este gesto el que armó
    // la letra, ya está hecho lo que tocaba y se queda esperando la segunda.
    // Si la letra venía de antes, esta es esa segunda pulsación.
    if (!moved) {
      if (!armedHereRef.current) activateCell(origin);
      armedHereRef.current = false;
      return;
    }

    const anchorCell = anchorRef.current;
    const headCell = headRef.current;
    if (!anchorCell || !headCell) return;

    // El arrastre sí se redondea: el dedo no pasa por todas las celdas ni
    // termina encima de la línea.
    const line = snapSelection(anchorCell, headCell, current.size);
    if (line.length < 2) {
      // Volvió al punto de partida: la letra se queda armada y la palabra se
      // puede cerrar con un toque en la última.
      applyHead(anchorCell);
      return;
    }
    validateSelection(line);
  };

  const handlePointerCancel = () => {
    clearSelection();
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
    <GameShell
      intro={{
        emoji: "🔠",
        title: t("searchTitle"),
        goal: t("searchIntro"),
        howTo: t("searchHowTo"),
        example: <SearchExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("searchStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
    >
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
                          // Solo el teclado. Enter y Espacio sobre la letra
                          // llegan como click sin pulsaciones (`detail === 0`);
                          // el ratón y el dedo ya pasaron por los eventos de
                          // puntero, que resolvieron el toque al soltar.
                          if (event.detail === 0) {
                            activateCell({ row: rowIndex, col: colIndex });
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
          <ResultActions
            playAgainLabel={t("searchPlayAgain")}
            onPlayAgain={startGame}
          />
        </section>
      )}
    </GameShell>
  );
}

/** Relleno de la cuadrícula del ejemplo. Son letras, no texto traducible. */
const SEARCH_EXAMPLE_FILLER = ["RMB", "PLD"];

/**
 * Ejemplo estático de la intro: una cuadrícula mínima con la palabra resaltada
 * en la primera fila. No usa el generador real de tableros.
 */
function SearchExample() {
  const { t } = useLanguage();
  const word = getWordLetters(t("searchExampleWord"));

  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={t("searchExampleAria")}
    >
      <ExampleRow letters={word} found />
      {SEARCH_EXAMPLE_FILLER.map((row) => (
        <ExampleRow key={row} letters={getWordLetters(row)} />
      ))}
    </div>
  );
}

function ExampleRow({
  letters,
  found = false,
}: {
  letters: string[];
  found?: boolean;
}) {
  return (
    <p className="flex gap-1" aria-hidden="true">
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-base font-extrabold ${
            found
              ? "border-2 border-mint bg-mintsoft text-ink"
              : "border-2 border-ink/10 bg-cream text-ink/45"
          }`}
        >
          {letter}
        </span>
      ))}
    </p>
  );
}

