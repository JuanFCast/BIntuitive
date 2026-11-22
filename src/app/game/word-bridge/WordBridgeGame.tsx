"use client";

import { useCallback, useEffect, useState } from "react";
import AudioButton from "@/components/AudioButton";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import LevelPicker from "@/components/LevelPicker";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import SessionStars from "@/components/SessionStars";
import type { Stars } from "@/lib/difficulty";
import { useGameTimers } from "@/lib/gameTimers";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import {
  clampWordBridgeLevel,
  createListenRounds,
  createMatchBoards,
  createSentenceRounds,
  sameWord,
  sentenceText,
  shuffleWordBridge,
  targetLanguage,
  wordBridgeAccuracy,
  wordBridgeSessionStars,
  WORD_BRIDGE_LEVELS,
  WORD_BRIDGE_MATCH_MS,
  WORD_BRIDGE_MAX_LEVEL,
  WORD_BRIDGE_NEXT_MS,
  type ListenRound,
  type SentenceRound,
  type SentenceTile,
  type WordBridgeLevel,
  type WordBridgeWord,
} from "@/lib/wordBridge";
import {
  getProgress,
  getUnassignedGameProgress,
  saveWordBridgeResult,
} from "@/lib/storage";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import { hexagonImage } from "@/data/categories";

type Phase = "intro" | "playing" | "results";

/** Una palabra elegida en el tablero de parejas, y de qué columna es. */
type PickedWord = { side: "mine" | "target"; id: string };

/** Cuánto se sacude lo que se falló antes de volver a estar disponible. */
const WRONG_MS = 500;

/**
 * Puente de palabras: el juego de idiomas de BIntuitive Plus.
 *
 * Tres mecánicas en un mismo juego, una por tramo de escalones (ver
 * `WORD_BRIDGE_LEVELS`): unir parejas, escuchar y elegir, y armar frases. Las
 * tres cuentan igual —aciertos entre intentos— para que la valoración y el
 * desbloqueo no dependan de cuál toque.
 *
 * El idioma que se practica es el contrario al de la interfaz, así que cambiar
 * de idioma en mitad de una partida le daría la vuelta al tablero: el cambio
 * de idioma vive en el menú, que no está aquí, y la sesión se arma al empezar.
 */
export default function WordBridgeGame() {
  const { language, t } = useLanguage();
  const target = targetLanguage(language);
  const [phase, setPhase] = useState<Phase>("intro");

  const [level, setLevel] = useState<WordBridgeLevel>(1);
  const [unlocked, setUnlocked] = useState<WordBridgeLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<WordBridgeLevel>(1);
  const [lockedHint, setLockedHint] = useState<WordBridgeLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<WordBridgeLevel | null>(null);

  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);
  const [locked, setLocked] = useState(false);

  // Parejas
  const [boards, setBoards] = useState<WordBridgeWord[][]>([]);
  const [targetOrder, setTargetOrder] = useState<WordBridgeWord[]>([]);
  const [picked, setPicked] = useState<PickedWord | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<PickedWord[]>([]);

  // Escuchar
  const [listenRounds, setListenRounds] = useState<ListenRound[]>([]);
  const [wrongOptions, setWrongOptions] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  // Frases
  const [sentenceRounds, setSentenceRounds] = useState<SentenceRound[]>([]);
  const [placed, setPlaced] = useState<SentenceTile[]>([]);
  const [wrongTile, setWrongTile] = useState<string | null>(null);

  const timers = useGameTimers();
  // Lo que se dice en voz alta es la palabra del idioma que se practica: es
  // la ocasión de oír cómo suena justo después de acertarla.
  const { speakAfterSound, cancel: cancelSpeaking } = useSpeakAfterSound(target);

  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "bridge");
    const open = clampWordBridgeLevel(stored.unlocked);
    setUnlocked(open);
    setSelectedLevel(clampWordBridgeLevel(Math.min(stored.difficulty, open)));
  }, []);

  const config = WORD_BRIDGE_LEVELS[level];

  // Con la ayuda o la confirmación de salida abiertas, la partida está
  // quieta: ni la pausa tras una pareja ni el paso a la ronda siguiente
  // pueden ocurrir mientras se lee.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        timers.freeze();
        cancelSpeaking();
      } else {
        timers.resume();
      }
    },
    [timers, cancelSpeaking],
  );

  const resetRound = () => {
    setPicked(null);
    setMatched([]);
    setWrongPair([]);
    setWrongOptions([]);
    setSolved(false);
    setPlaced([]);
    setWrongTile(null);
    setLocked(false);
  };

  const startGame = () => {
    timers.clear();
    cancelSpeaking();
    const startingLevel = selectedLevel;
    const startingConfig = WORD_BRIDGE_LEVELS[startingLevel];

    setLevel(startingLevel);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setRound(0);
    setAttempts(0);
    setHits(0);
    resetRound();

    if (startingConfig.mode === "match") {
      const created = createMatchBoards(startingConfig);
      setBoards(created);
      setTargetOrder(shuffleWordBridge(created[0]));
    } else if (startingConfig.mode === "listen") {
      setListenRounds(createListenRounds(startingConfig));
    } else {
      setSentenceRounds(createSentenceRounds(startingConfig, target));
    }

    setPhase("playing");
  };

  const roundsInSession = config.rounds;

  /** Pasa a la ronda siguiente o, si era la última, termina la sesión. */
  const advance = (finalAttempts: number, finalHits: number) => {
    timers.later(() => {
      const next = round + 1;
      if (next >= roundsInSession) {
        finishGame(finalAttempts, finalHits);
        return;
      }
      resetRound();
      setRound(next);
      if (config.mode === "match") setTargetOrder(shuffleWordBridge(boards[next]));
    }, WORD_BRIDGE_NEXT_MS);
  };

  const finishGame = (finalAttempts: number, finalHits: number) => {
    const accuracy = wordBridgeAccuracy(finalAttempts, finalHits);
    const rating = wordBridgeSessionStars(accuracy, true);
    const nextUnlocked =
      rating >= 2 ? clampWordBridgeLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveWordBridgeResult({
      playedLevel: level,
      sessionStars: rating,
      accuracy,
      words: finalHits,
      playedAt: new Date().toISOString(),
    });

    setSessionStars(rating);
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setPhase("results");
    playCelebrationSound();
  };

  /* ---------------------------------------------------------------- Parejas */

  const pickWord = (side: PickedWord["side"], id: string) => {
    if (locked || matched.includes(id)) return;

    // Lo primero que se toca, o cambiar de idea dentro de la misma columna.
    if (!picked || picked.side === side) {
      playTapSound();
      setPicked({ side, id });
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (picked.id === id) {
      const nextHits = hits + 1;
      const nextMatched = [...matched, id];
      const word = boards[round].find((candidate) => candidate.id === id);
      setHits(nextHits);
      setPicked(null);
      playCorrectSound();
      if (word) speakAfterSound(word[target]);
      setMatched(nextMatched);

      if (nextMatched.length >= boards[round].length) {
        setLocked(true);
        timers.later(() => advance(nextAttempts, nextHits), WORD_BRIDGE_MATCH_MS);
      }
      return;
    }

    playWrongSound();
    setLocked(true);
    setWrongPair([picked, { side, id }]);
    timers.later(() => {
      setWrongPair([]);
      setPicked(null);
      setLocked(false);
    }, WRONG_MS);
  };

  /* --------------------------------------------------------------- Escuchar */

  const pickOption = (option: WordBridgeWord) => {
    const current = listenRounds[round];
    if (!current || solved || locked || wrongOptions.includes(option.id)) return;

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (option.id === current.word.id) {
      const nextHits = hits + 1;
      setHits(nextHits);
      setSolved(true);
      setLocked(true);
      playCorrectSound();
      advance(nextAttempts, nextHits);
      return;
    }

    playWrongSound();
    setWrongOptions((list) => [...list, option.id]);
  };

  /* ----------------------------------------------------------------- Frases */

  const pickTile = (tile: SentenceTile) => {
    const current = sentenceRounds[round];
    if (!current || locked || placed.some((item) => item.key === tile.key)) return;

    const words = current.sentence[target];
    const expected = words[placed.length];
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (expected !== undefined && sameWord(tile.text, expected, target)) {
      const nextHits = hits + 1;
      const nextPlaced = [...placed, tile];
      setHits(nextHits);
      setPlaced(nextPlaced);

      if (nextPlaced.length >= words.length) {
        setLocked(true);
        playCorrectSound();
        speakAfterSound(sentenceText(words, target));
        advance(nextAttempts, nextHits);
      } else {
        playTapSound();
      }
      return;
    }

    // Una ficha que no toca no se coloca: se sacude y se queda donde estaba.
    playWrongSound();
    setWrongTile(tile.key);
    timers.later(() => setWrongTile(null), WRONG_MS);
  };

  /* ------------------------------------------------------------ Navegación */

  const backToIntro = () => {
    timers.clear();
    cancelSpeaking();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: WordBridgeLevel) => {
    if (option > unlocked) {
      setLockedHint(option);
      playWrongSound();
      return;
    }
    setLockedHint(null);
    setSelectedLevel(option);
    playTapSound();
  };

  const instruction =
    config.mode === "match"
      ? t("bridgeMatchInstruction")
      : config.mode === "listen"
        ? t("bridgeListenInstruction")
        : t("bridgeSentenceInstruction");

  const accuracy = wordBridgeAccuracy(attempts, hits);

  return (
    <GameShell
      intro={{
        image: hexagonImage("bridge"),
        title: t("bridgeTitle"),
        goal: t("bridgeIntro"),
        howTo: t("bridgeHowTo"),
        example: <BridgeExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("bridgeStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={WORD_BRIDGE_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampWordBridgeLevel(option))}
        />
      }
    >
      {phase === "playing" && (
        <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 pt-2 text-center sm:min-h-[calc(100svh-6rem)] sm:max-w-2xl sm:justify-center sm:gap-5 sm:pt-4">
          <div>
            <h1 className="text-lg font-extrabold text-ink sm:text-2xl">{instruction}</h1>
            <p className="mt-1 text-sm font-extrabold text-ink/70 sm:text-base">
              {t("bridgeLevelLabel", { level })} ·{" "}
              {t("bridgeProgress", { done: round + 1, total: roundsInSession })}
            </p>
          </div>

          {config.mode === "match" && boards[round] && (
            <MatchBoard
              mine={boards[round]}
              theirs={targetOrder}
              language={language}
              target={target}
              pictures={config.pictures}
              picked={picked}
              matched={matched}
              wrongPair={wrongPair}
              locked={locked}
              onPick={pickWord}
            />
          )}

          {config.mode === "listen" && listenRounds[round] && (
            <ListenBoard
              key={round}
              round={listenRounds[round]}
              language={language}
              target={target}
              wrongOptions={wrongOptions}
              solved={solved}
              onPick={pickOption}
            />
          )}

          {config.mode === "sentence" && sentenceRounds[round] && (
            <SentenceBoard
              key={round}
              round={sentenceRounds[round]}
              language={language}
              target={target}
              placed={placed}
              wrongTile={wrongTile}
              onPick={pickTile}
            />
          )}
        </section>
      )}

      {phase === "results" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark size={140} className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]" />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("bridgeResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("bridgeResultsText", { total: hits })}
            </p>
            <p className="mt-1 text-base font-extrabold text-ink/70">
              {t("bridgeLevelLabel", { level })}
            </p>
          </div>

          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat tone="berry" label={t("bridgeAccuracy")} value={`${accuracy}%`} />
            <ResultStat tone="berry" label={t("bridgeRight")} value={hits} />
            <ResultStat tone="berry" label={t("bridgeMistakes")} value={attempts - hits} />
          </div>
          <ResultActions playAgainLabel={t("bridgePlayAgain")} onPlayAgain={backToIntro} />
        </section>
      )}
    </GameShell>
  );
}

/**
 * El tablero de parejas: tu idioma a la izquierda, en el orden en que salen,
 * y el que se practica a la derecha, revuelto. Se toca una de cada columna,
 * en cualquier orden.
 */
function MatchBoard({
  mine,
  theirs,
  language,
  target,
  pictures,
  picked,
  matched,
  wrongPair,
  locked,
  onPick,
}: {
  mine: WordBridgeWord[];
  theirs: WordBridgeWord[];
  language: Language;
  target: Language;
  pictures: boolean;
  picked: PickedWord | null;
  matched: string[];
  wrongPair: PickedWord[];
  locked: boolean;
  onPick: (side: PickedWord["side"], id: string) => void;
}) {
  const { t } = useLanguage();

  const state = (side: PickedWord["side"], id: string) => {
    if (matched.includes(id)) return "matched";
    if (wrongPair.some((item) => item.side === side && item.id === id)) return "wrong";
    if (picked?.side === side && picked.id === id) return "picked";
    return "idle";
  };

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:gap-4">
      <p className="text-sm font-extrabold text-ink/70">{t("bridgeYourLanguage")}</p>
      <p className="text-sm font-extrabold text-ink/70">{t("bridgeTargetLanguage")}</p>

      <div className="flex flex-col gap-2 sm:gap-3">
        {mine.map((word) => (
          <WordButton
            key={word.id}
            state={state("mine", word.id)}
            disabled={locked}
            lang={language}
            onClick={() => onPick("mine", word.id)}
          >
            {pictures && word.emoji && (
              <span aria-hidden="true" className="text-2xl leading-none sm:text-3xl">
                {word.emoji}
              </span>
            )}
            {word[language]}
          </WordButton>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        {theirs.map((word) => (
          <WordButton
            key={word.id}
            state={state("target", word.id)}
            disabled={locked}
            lang={target}
            onClick={() => onPick("target", word.id)}
          >
            {word[target]}
          </WordButton>
        ))}
      </div>
    </div>
  );
}

function WordButton({
  state,
  disabled,
  lang,
  onClick,
  children,
}: {
  state: "idle" | "picked" | "matched" | "wrong";
  disabled: boolean;
  lang: Language;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const look = {
    idle: "border-ink/15 bg-white border-b-[6px] active:border-b-2 active:scale-95",
    picked: "border-sky bg-skysoft border-b-[6px]",
    matched: "border-mint bg-mintsoft text-ink/60",
    wrong: "animate-shake border-coral bg-coralsoft",
  }[state];

  return (
    <button
      type="button"
      lang={lang}
      onClick={onClick}
      disabled={disabled || state === "matched"}
      aria-pressed={state === "picked"}
      className={`flex min-h-14 w-full items-center justify-center gap-2 break-words rounded-2xl border-2 px-2 py-2 text-lg font-extrabold leading-snug text-ink transition-colors sm:min-h-16 sm:text-xl ${look}`}
    >
      {children}
    </button>
  );
}

/**
 * Escuchar: la palabra no se ve, se oye. El botón grande la dice en el idioma
 * que se practica y las respuestas van en el tuyo. La voz no arranca sola —en
 * iOS solo habla tras un toque—, así que la primera vez hay que pulsarlo.
 */
function ListenBoard({
  round,
  language,
  target,
  wrongOptions,
  solved,
  onPick,
}: {
  round: ListenRound;
  language: Language;
  target: Language;
  wrongOptions: string[];
  solved: boolean;
  onPick: (option: WordBridgeWord) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-6">
      <div className="flex flex-col items-center gap-2">
        <AudioButton
          text={round.word[target]}
          speechLanguage={target}
          label={t("bridgeListenWord")}
        />
        <p className="text-sm font-extrabold text-ink/70">{t("bridgeListenWord")}</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {round.options.map((option) => {
          const wrong = wrongOptions.includes(option.id);
          const right = solved && option.id === round.word.id;
          return (
            <button
              key={option.id}
              type="button"
              lang={language}
              onClick={() => onPick(option)}
              disabled={wrong || solved}
              className={`flex min-h-20 w-full flex-col items-center justify-center gap-1 break-words rounded-2xl border-2 px-2 py-3 text-xl font-extrabold leading-snug text-ink transition-colors sm:min-h-24 ${
                right
                  ? "animate-pop border-mint bg-mintsoft"
                  : wrong
                    ? "border-coral bg-coralsoft text-ink/50"
                    : "border-ink/15 border-b-[6px] bg-white active:scale-95 active:border-b-2"
              }`}
            >
              {option.emoji && (
                <span aria-hidden="true" className="text-3xl leading-none">
                  {option.emoji}
                </span>
              )}
              {option[language]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Frases: arriba la frase en tu idioma; en medio, la que se va armando; abajo
 * las fichas, con dos que no van. Una ficha equivocada se sacude y no se
 * coloca, así que no hace falta botón de deshacer ni de comprobar.
 */
function SentenceBoard({
  round,
  language,
  target,
  placed,
  wrongTile,
  onPick,
}: {
  round: SentenceRound;
  language: Language;
  target: Language;
  placed: SentenceTile[];
  wrongTile: string | null;
  onPick: (tile: SentenceTile) => void;
}) {
  const { t } = useLanguage();
  const built = placed.map((tile) => tile.text);

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-6">
      <div className="flex w-full items-center gap-3 rounded-3xl border-2 border-ink/10 bg-white px-4 py-3 text-left shadow-sm">
        <p lang={language} className="flex-1 text-xl font-extrabold leading-snug text-ink sm:text-2xl">
          {sentenceText(round.sentence[language], language)}
        </p>
        <AudioButton
          text={sentenceText(round.sentence[target], target)}
          speechLanguage={target}
          label={t("bridgeListenSentence")}
        />
      </div>

      <div
        lang={target}
        aria-label={t("bridgeAnswerSlot")}
        aria-live="polite"
        className="flex min-h-16 w-full items-center justify-center rounded-2xl border-2 border-dashed border-berry bg-berrysoft px-3 py-2 text-xl font-extrabold text-ink sm:text-2xl"
      >
        {built.length > 0 ? (
          sentenceText(built, target)
        ) : (
          <span className="text-base font-bold text-ink/50">{t("bridgeAnswerSlot")}</span>
        )}
      </div>

      <div className="flex w-full flex-wrap justify-center gap-2 sm:gap-3">
        {round.tiles.map((tile) => {
          const used = placed.some((item) => item.key === tile.key);
          return (
            <button
              key={tile.key}
              type="button"
              lang={target}
              onClick={() => onPick(tile)}
              disabled={used}
              className={`min-h-12 rounded-2xl border-2 px-4 py-2 text-lg font-extrabold text-ink transition-all sm:min-h-14 sm:text-xl ${
                used
                  ? "invisible"
                  : wrongTile === tile.key
                    ? "animate-shake border-coral bg-coralsoft"
                    : "border-ink/15 border-b-[6px] bg-white active:scale-95 active:border-b-2"
              }`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Ejemplo estático de la introducción: una pareja ya unida, tu palabra con su
 * dibujo a un lado y su traducción al otro, con el puente en medio.
 */
function BridgeExample() {
  const { language, t } = useLanguage();
  const target = targetLanguage(language);
  const word = { en: "dog", es: "perro" };

  return (
    <div className="flex items-center gap-2" role="img" aria-label={t("bridgeExampleAria")}>
      <span
        aria-hidden="true"
        className="flex items-center gap-1.5 rounded-xl border-2 border-mint bg-mintsoft px-3 py-2 text-lg font-extrabold"
      >
        <span>🐶</span>
        {word[language]}
      </span>
      <span aria-hidden="true" className="h-1 w-6 rounded-full bg-mint" />
      <span
        aria-hidden="true"
        className="rounded-xl border-2 border-mint bg-mintsoft px-3 py-2 text-lg font-extrabold"
      >
        {word[target]}
      </span>
    </div>
  );
}
