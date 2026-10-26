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
import { useLanguage } from "@/lib/i18n";
import {
  buildColoringSession,
  clampColoringLevel,
  coloringAccuracy,
  coloringAttemptKey,
  coloringBrushesForLevel,
  coloringBrushRadius,
  coloringRegionCells,
  coloringRegionIsFull,
  coloringRunsPath,
  coloringSampleGrid,
  coloringSessionStars,
  coloringStrokeCovers,
  COLORING_BRUSHES,
  COLORING_COLORS,
  COLORING_DEFAULT_BRUSH,
  COLORING_FILL_MS,
  COLORING_GRID,
  COLORING_MAX_LEVEL,
  COLORING_MIN_STEP,
  COLORING_PICTURES_PER_SESSION,
  type ColorId,
  type ColoringBrushId,
  type ColoringLevel,
  type ColoringPicture,
  type ColoringPoint,
  type ColoringRound,
  type ColoringTask,
} from "@/lib/coloringGame";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import {
  getProgress,
  getUnassignedGameProgress,
  saveColoringResult,
} from "@/lib/storage";
import { hexagonImage } from "@/data/categories";

type Phase = "intro" | "playing" | "results";

/**
 * Una pasada de pincel, guardada entera.
 *
 * El lienzo se queda en blanco cada vez que cambia de tamaño —girar el iPad,
 * abrir el teclado, cambiar el tamaño de letra—, así que lo pintado tiene que
 * poder repintarse: la verdad son los trazos, no los píxeles.
 */
type Stroke = {
  regionIndex: number;
  colorId: ColorId;
  radius: number;
  points: ColoringPoint[];
};

/** El papel del dibujo, y la tinta de los botones de pincel sin color. */
const PAPER = "#ffffff";
const OUTLINE = "#171717";

/**
 * Lo que cuenta como tinta al leer la imagen en la rejilla: 0,4 de opacidad.
 * El borde suavizado de la línea queda a medias, y con este corte la línea
 * sigue cerrada sin engordar.
 */
const INK_ALPHA = 102;

/**
 * Las zonas de cada lámina, como caminos, ya calculadas: leer la imagen y
 * buscar sus zonas se hace una vez por lámina y por visita, no cada vez que
 * vuelve a salir. Se guarda la promesa y no el resultado para que dos rondas
 * que piden la misma imagen a la vez no la lean dos veces.
 */
const shapesCache = new Map<string, Promise<string[]>>();

/**
 * Lee la tinta de la lámina en la rejilla del juego y devuelve el camino de
 * cada zona, en el orden de sus zonas.
 */
function loadPictureShapes(picture: ColoringPicture): Promise<string[]> {
  const cached = shapesCache.get(picture.id);
  if (cached) return cached;

  const promise = new Promise<string[]>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = COLORING_GRID;
      canvas.height = COLORING_GRID;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("sin lienzo"));
        return;
      }
      ctx.drawImage(image, 0, 0, COLORING_GRID, COLORING_GRID);
      const { data } = ctx.getImageData(0, 0, COLORING_GRID, COLORING_GRID);
      const ink = new Uint8Array(COLORING_GRID * COLORING_GRID);
      for (let cell = 0; cell < ink.length; cell += 1) {
        ink[cell] = data[cell * 4 + 3] > INK_ALPHA ? 1 : 0;
      }

      const { runs, problems } = coloringRegionCells(
        ink,
        COLORING_GRID,
        picture.regions,
      );
      // No rompe la partida —la zona afectada simplemente no se puede
      // pintar—, pero quien cambió la imagen tiene que enterarse.
      for (const problem of problems) {
        console.warn(`Colorear, ${picture.id}: ${problem}`);
      }
      resolve(runs.map((zone) => coloringRunsPath(zone, COLORING_GRID)));
    };
    image.onerror = () => reject(new Error(`no carga ${picture.image}`));
    image.src = picture.image;
  });

  // Un fallo de red no puede quedarse guardado: la próxima vez se reintenta.
  promise.catch(() => shapesCache.delete(picture.id));
  shapesCache.set(picture.id, promise);
  return promise;
}

/** El tope del lienzo: por encima pesa cuatro veces más y no se nota. */
const MAX_PIXEL_RATIO = 2;

export default function ColoringGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");

  const [rounds, setRounds] = useState<ColoringRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  /** Qué color lleva ya cada zona terminada de la lámina en curso. */
  const [filled, setFilled] = useState<Record<string, ColorId>>({});
  /**
   * El camino de cada zona de la lámina en curso, o `null` mientras se lee la
   * imagen: hasta entonces no hay zonas que tocar ni números que enseñar.
   */
  const [shapes, setShapes] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<ColorId | null>(null);
  const [brush, setBrush] = useState<ColoringBrushId>(COLORING_DEFAULT_BRUSH);
  /** En los escalones hablados, qué zona toca ahora. */
  const [step, setStep] = useState(0);
  const [wrongRegion, setWrongRegion] = useState<string | null>(null);
  /** Decisiones tomadas —zona y color—, que es lo que mide la precisión. */
  const [attempts, setAttempts] = useState(0);
  const [painted, setPainted] = useState(0);
  const [locked, setLocked] = useState(false);
  /** Aviso de "elige un color primero", que aparece y se va solo. */
  const [needsColor, setNeedsColor] = useState(false);

  const [level, setLevel] = useState<ColoringLevel>(1);
  const [unlocked, setUnlocked] = useState<ColoringLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<ColoringLevel>(1);
  const [lockedHint, setLockedHint] = useState<ColoringLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<ColoringLevel | null>(null);
  const timers = useGameTimers();
  const { speakAfterSound, cancel: cancelSpeaking } =
    useSpeakAfterSound(language);

  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Los caminos de las zonas, en el mismo orden que la lámina. */
  const pathsRef = useRef<Path2D[]>([]);
  /** Los puntos con los que se mide cada zona. */
  const samplesRef = useRef<ColoringPoint[][]>([]);
  const coveredRef = useRef<Set<number>[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const filledRef = useRef<Map<number, ColorId>>(new Map());
  const activeRef = useRef<{
    index: number;
    stroke: Stroke;
    last: ColoringPoint;
  } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  /** Las decisiones ya contadas, para no cobrar dos veces la misma. */
  const attemptedRef = useRef<Set<string>>(new Set());
  /**
   * Un lienzo aparte, sin escala y sin pintar nada, solo para preguntarle si un
   * punto cae dentro de un camino. Con la escala puesta, `isPointInPath` mide
   * contra el lienzo y no contra el dibujo.
   */
  const measureRef = useRef<CanvasRenderingContext2D | null>(null);

  const round = rounds[roundIndex];
  const currentTask: ColoringTask | undefined =
    round && round.mode === "spoken" ? round.tasks[step] : undefined;

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "coloring");
    const open = clampColoringLevel(stored.unlocked);
    setUnlocked(open);
    setSelectedLevel(clampColoringLevel(Math.min(stored.difficulty, open)));
  }, []);

  const measuringContext = () => {
    if (measureRef.current) return measureRef.current;
    if (typeof document === "undefined") return null;
    measureRef.current = document.createElement("canvas").getContext("2d");
    return measureRef.current;
  };

  /* ───────────────────── Pintar el lienzo ────────────────────── */

  /**
   * Todo se dibuja en el lienzo de 100 × 100 del dibujo, no en píxeles: así las
   * zonas, los radios del pincel y los puntos de medida hablan en la misma
   * unidad y el lienzo puede tener la resolución que quiera.
   */
  const scaleToPicture = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    const scale = canvas.width / 100;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  };

  /** Una zona ya terminada, rellena entera de su color. */
  const paintRegion = (ctx: CanvasRenderingContext2D, index: number) => {
    const path = pathsRef.current[index];
    const done = filledRef.current.get(index);
    if (!path || !done) return;
    ctx.fillStyle = COLORING_COLORS[done].hex;
    ctx.fill(path);
  };

  const strokeBrush = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const hex = COLORING_COLORS[stroke.colorId].hex;
    ctx.strokeStyle = hex;
    ctx.fillStyle = hex;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.radius * 2;

    const [first, ...rest] = stroke.points;
    if (!first) return;

    // Un toque sin arrastre deja una mancha redonda: un segmento de longitud
    // cero no dibuja nada por mucho grosor que lleve.
    if (rest.length === 0) {
      ctx.beginPath();
      ctx.arc(first.x, first.y, stroke.radius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const point of rest) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  /** Las pasadas que haya dentro de una zona, recortadas a ella. */
  const paintStrokes = (ctx: CanvasRenderingContext2D, index: number) => {
    const path = pathsRef.current[index];
    if (!path || filledRef.current.has(index)) return;
    ctx.save();
    ctx.clip(path);
    for (const stroke of strokesRef.current) {
      if (stroke.regionIndex === index) strokeBrush(ctx, stroke);
    }
    ctx.restore();
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    scaleToPicture(ctx, canvas);

    // Las zonas salen de la imagen y no se pisan entre sí, así que el orden
    // da igual: las líneas no van aquí, sino en la imagen que hay encima.
    for (let index = 0; index < pathsRef.current.length; index += 1) {
      paintRegion(ctx, index);
      paintStrokes(ctx, index);
    }
  }, []);

  /**
   * Un tramo de pincel, nada más, para que el trazo vaya al ritmo del dedo: un
   * repintado entero por movimiento sí se notaría en un iPad viejo. No hay que
   * rehacer nada alrededor, porque el recorte deja la pintura en su zona y las
   * líneas están en otra capa, por encima del lienzo.
   */
  const drawSegment = (
    index: number,
    stroke: Stroke,
    from: ColoringPoint,
    to: ColoringPoint,
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const path = pathsRef.current[index];
    if (!canvas || !ctx || !path) return;

    scaleToPicture(ctx, canvas);
    ctx.save();
    ctx.clip(path);
    strokeBrush(ctx, { ...stroke, points: [from, to] });
    ctx.restore();
  };

  /**
   * El lienzo, a la resolución de la pantalla. Cambiarle el tamaño lo borra, así
   * que repintar es parte de redimensionar.
   */
  const resizeCanvas = useCallback(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return;

    const rect = board.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height);
    if (side <= 0) return;

    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const pixels = Math.round(side * ratio);
    if (canvas.width === pixels && canvas.height === pixels) return;

    canvas.width = pixels;
    canvas.height = pixels;
    redraw();
  }, [redraw]);

  // Cada lámina nueva trae sus zonas y sus puntos de medida. Sacarlas de la
  // imagen y sembrarlas cuesta una vez por dibujo y ahorra leer los píxeles
  // del lienzo en cada movimiento del dedo.
  useEffect(() => {
    if (!round) return;

    pathsRef.current = [];
    samplesRef.current = [];
    coveredRef.current = [];
    setShapes(null);
    strokesRef.current = [];
    filledRef.current = new Map();
    activeRef.current = null;
    pointerIdRef.current = null;
    // Las zonas se llaman igual en varias láminas —"el cuerpo" está en el pez,
    // en el cohete y en el tren—, así que las decisiones se cuentan por lámina.
    attemptedRef.current = new Set();

    resizeCanvas();
    redraw();

    let current = true;
    loadPictureShapes(round.picture)
      .then((paths) => {
        if (!current) return;
        const measure = measuringContext();
        pathsRef.current = paths.map((d) => new Path2D(d));
        samplesRef.current = pathsRef.current.map((path) =>
          measure
            ? coloringSampleGrid((x, y) => measure.isPointInPath(path, x, y))
            : [],
        );
        coveredRef.current = pathsRef.current.map(() => new Set<number>());
        setShapes(paths);
        redraw();
      })
      // Sin imagen no hay lámina: el tablero se queda en blanco y sin zonas,
      // que es lo mismo que pasaría con cualquier otro dibujo que no cargue.
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [round, resizeCanvas, redraw]);

  useEffect(() => {
    if (phase !== "playing") return;
    const board = boardRef.current;
    if (!board) return;

    resizeCanvas();
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(board);
    return () => observer.disconnect();
  }, [phase, resizeCanvas]);

  /* ─────────────────────── El pincel ─────────────────────────── */

  const releaseStroke = () => {
    activeRef.current = null;
    pointerIdRef.current = null;
  };

  // Con la ayuda o la confirmación de salida abiertas la lámina queda quieta:
  // la espera que enseña la zona recién terminada no puede correr detrás de un
  // overlay, y el trazo a medias se suelta en vez de seguir al dedo que ya no
  // está mirando el dibujo.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        releaseStroke();
        timers.freeze();
        cancelSpeaking();
      } else {
        timers.resume();
      }
    },
    [timers, cancelSpeaking],
  );

  const pointFromClient = (clientX: number, clientY: number) => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // El tablero es cuadrado, así que las dos escalas son la misma.
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  /**
   * Los puntos de un movimiento. El navegador junta varios en un solo evento
   * cuando la mano va más rápido que la pantalla —y el Apple Pencil va mucho
   * más rápido—: pedirlos todos es lo que convierte una recta a trompicones en
   * una curva.
   */
  const pointsFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const native = event.nativeEvent as PointerEvent & {
      getCoalescedEvents?: () => PointerEvent[];
    };
    const coalesced =
      typeof native.getCoalescedEvents === "function"
        ? native.getCoalescedEvents()
        : [];
    const source = coalesced.length > 0 ? coalesced : [native];

    const points: ColoringPoint[] = [];
    for (const item of source) {
      const point = pointFromClient(item.clientX, item.clientY);
      if (point) points.push(point);
    }
    return points;
  };

  /** La zona de encima que hay bajo el dedo, o -1 si es papel de nadie. */
  const regionAt = (point: ColoringPoint) => {
    const measure = measuringContext();
    if (!measure) return -1;
    // Las zonas no se pisan, salvo una celda en el centro de la línea que las
    // separa: ahí gana cualquiera, porque es tinta y no se ve el color.
    for (let index = pathsRef.current.length - 1; index >= 0; index -= 1) {
      if (measure.isPointInPath(pathsRef.current[index], point.x, point.y)) {
        return index;
      }
    }
    return -1;
  };

  /** Marca los puntos que tapa el tramo y dice si la zona ya está cubierta. */
  const addCoverage = (
    index: number,
    from: ColoringPoint,
    to: ColoringPoint,
    radius: number,
  ) => {
    const samples = samplesRef.current[index] ?? [];
    let covered = coveredRef.current[index];
    if (!covered) {
      covered = new Set<number>();
      coveredRef.current[index] = covered;
    }

    for (let sample = 0; sample < samples.length; sample += 1) {
      if (covered.has(sample)) continue;
      if (coloringStrokeCovers(samples[sample], from, to, radius)) {
        covered.add(sample);
      }
    }
    return coloringRegionIsFull(covered.size, samples.length, level);
  };

  /**
   * Cuenta la decisión —esta zona de este color— y dice si es la buena. Una
   * pareja ya contada no vuelve a contar: cubrir una zona son varias pasadas.
   */
  const judgeAttempt = (task: ColoringTask, colorId: ColorId) => {
    const key = coloringAttemptKey(task.id, colorId);
    if (!attemptedRef.current.has(key)) {
      attemptedRef.current.add(key);
      setAttempts((current) => current + 1);
    }

    const isTheRegionAsked =
      round?.mode === "key" || task.id === currentTask?.id;
    return isTheRegionAsked && colorId === task.colorId;
  };

  const rejectRegion = (task: ColoringTask) => {
    playWrongSound();
    setWrongRegion(task.id);
    timers.later(() => setWrongRegion(null), 500);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (locked || !round || phase !== "playing") return;

    const point = pointFromClient(event.clientX, event.clientY);
    if (!point) return;

    const index = regionAt(point);
    if (index < 0) return;

    const task = round.tasks[index];
    if (filled[task.id]) return;

    // Sin color elegido no hay nada que pintar; se dice en vez de no hacer
    // nada, que es lo que deja al niño frotando la pantalla sin entender.
    if (!selected) {
      setNeedsColor(true);
      playTapSound();
      return;
    }

    if (!judgeAttempt(task, selected)) {
      // La pintura no agarra: el color que no es no deja marca, así que
      // equivocarse nunca estropea el dibujo.
      rejectRegion(task);
      return;
    }

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Sin captura el trazo sigue funcionando mientras el dedo no se salga.
    }

    const stroke: Stroke = {
      regionIndex: index,
      colorId: task.colorId,
      radius: coloringBrushRadius(brush),
      points: [point],
    };
    strokesRef.current = [...strokesRef.current, stroke];
    activeRef.current = { index, stroke, last: point };
    pointerIdRef.current = event.pointerId;
    setNeedsColor(false);
    playTapSound();

    drawSegment(index, stroke, point, point);
    if (addCoverage(index, point, point, stroke.radius)) {
      completeRegion(index, task);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = activeRef.current;
    if (!active || event.pointerId !== pointerIdRef.current) return;
    const task = round?.tasks[active.index];
    if (!task) return;

    let full = false;
    for (const point of pointsFromEvent(event)) {
      const moved = Math.hypot(point.x - active.last.x, point.y - active.last.y);
      if (moved < COLORING_MIN_STEP) continue;

      active.stroke.points.push(point);
      drawSegment(active.index, active.stroke, active.last, point);
      if (addCoverage(active.index, active.last, point, active.stroke.radius)) {
        full = true;
      }
      active.last = point;
    }

    if (full) completeRegion(active.index, task);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    releaseStroke();
  };

  /**
   * El camino sin puntero.
   *
   * Con teclado o con lector de pantalla no hay arrastre, así que activar la
   * zona la pinta entera. No es un atajo escondido —un dedo o un ratón generan
   * un trazo, nunca una pulsación de tecla— y es lo que mantiene el juego
   * jugable sin puntero.
   */
  const paintWithoutPointer = (index: number, task: ColoringTask) => {
    if (locked || !round || phase !== "playing" || filled[task.id]) return;
    if (!selected) {
      setNeedsColor(true);
      playTapSound();
      return;
    }
    if (!judgeAttempt(task, selected)) {
      rejectRegion(task);
      return;
    }
    setNeedsColor(false);
    completeRegion(index, task);
  };

  /** La zona llegó al umbral: se rellena entera y la lámina sigue. */
  const completeRegion = (index: number, task: ColoringTask) => {
    if (!round || filledRef.current.has(index)) return;

    releaseStroke();
    filledRef.current.set(index, task.colorId);
    // Las pasadas ya no pintan nada que no tape el relleno, y un trazo menos es
    // un trazo menos que repintar al girar la pantalla.
    strokesRef.current = strokesRef.current.filter(
      (stroke) => stroke.regionIndex !== index,
    );
    redraw();

    const nextFilled = { ...filled, [task.id]: task.colorId };
    const nextPainted = painted + 1;
    setFilled(nextFilled);
    setPainted(nextPainted);
    setLocked(true);
    playCorrectSound();

    const done = Object.keys(nextFilled).length >= round.tasks.length;

    timers.later(() => {
      setLocked(false);
      if (done) {
        finishRound(nextPainted);
        return;
      }
      if (round.mode === "spoken") {
        const nextStep = step + 1;
        setStep(nextStep);
        // La siguiente consigna se dice sola, pero solo porque viene detrás
        // de un acierto, que es un gesto: en iOS la voz no arranca de otra
        // forma. `useSpeakAfterSound` ya espera al sonido de acierto.
        const next = round.tasks[nextStep];
        if (next) {
          speakAfterSound(
            t("coloringSpokenInstruction", {
              region: next.label[language],
              color: COLORING_COLORS[next.colorId].label[language],
            }),
          );
        }
      }
    }, COLORING_FILL_MS);
  };

  /* ───────────────────── Sesión y resultados ─────────────────── */

  const startGame = () => {
    timers.clear();
    cancelSpeaking();
    releaseStroke();
    const startingLevel = selectedLevel;
    const session = buildColoringSession(startingLevel);
    // La segunda lámina se lee ya, mientras se pinta la primera.
    for (const next of session) {
      loadPictureShapes(next.picture).catch(() => undefined);
    }
    setLevel(startingLevel);
    setRounds(session);
    setRoundIndex(0);
    setFilled({});
    setSelected(null);
    setBrush(COLORING_DEFAULT_BRUSH);
    setStep(0);
    setWrongRegion(null);
    setAttempts(0);
    setPainted(0);
    setLocked(false);
    setNeedsColor(false);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setPhase("playing");
  };

  const pickColor = (colorId: ColorId) => {
    if (locked) return;
    setNeedsColor(false);
    setSelected(colorId);
    playTapSound();
  };

  const pickBrush = (id: ColoringBrushId) => {
    setBrush(id);
    playTapSound();
  };

  /** Lámina terminada: o viene la siguiente o se acaba la sesión. */
  const finishRound = (finalPainted: number) => {
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      setFilled({});
      setSelected(null);
      setStep(0);
      setNeedsColor(false);
      playCelebrationSound();
      return;
    }
    finishSession(finalPainted);
  };

  /**
   * La sesión llegó al final, así que hay valoración. Abandonar a mitad no
   * pasa por aquí y por eso no guarda ni desbloquea nada.
   */
  const finishSession = (finalPainted: number) => {
    const finalAccuracy = coloringAccuracy(attempts, finalPainted);
    const rating = coloringSessionStars(finalAccuracy, true);
    const nextUnlocked =
      rating >= 2 ? clampColoringLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveColoringResult({
      playedLevel: level,
      sessionStars: rating,
      accuracy: finalAccuracy,
      pictures: rounds.length,
      playedAt: new Date().toISOString(),
    });

    setSessionStars(rating);
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setPhase("results");
    playCelebrationSound();
  };

  /**
   * Volver a la introducción, donde está el selector, igual que en Trazos y
   * en Parejas: si se acaba de abrir un nivel, lo que se quiere es probarlo.
   */
  const backToIntro = () => {
    timers.clear();
    cancelSpeaking();
    releaseStroke();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: ColoringLevel) => {
    if (option > unlocked) {
      setLockedHint(option);
      playWrongSound();
      return;
    }
    setLockedHint(null);
    setSelectedLevel(option);
    playTapSound();
  };

  const accuracy = coloringAccuracy(attempts, painted);

  /** Lo que se pide ahora, escrito; en los escalones hablados también se dice. */
  const spokenPrompt = currentTask
    ? t("coloringSpokenInstruction", {
        region: currentTask.label[language],
        color: COLORING_COLORS[currentTask.colorId].label[language],
      })
    : "";

  return (
    <GameShell
      intro={{
        image: hexagonImage("coloring"),
        title: t("coloringTitle"),
        goal: t("coloringIntro"),
        howTo: t("coloringHowTo"),
        example: <ColoringExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("coloringStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={COLORING_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampColoringLevel(option))}
        />
      }
    >
      {phase === "playing" && round && (
        <section className="coloring-play mx-auto flex w-full max-w-xl flex-col items-center gap-2 pt-2 text-center sm:min-h-[calc(100svh-6rem)] sm:max-w-3xl sm:justify-center sm:gap-4 sm:pt-4">
          <p className="text-sm font-extrabold text-ink/70 sm:text-base">
            {t("coloringProgress", {
              current: roundIndex + 1,
              total: rounds.length,
              level,
            })}
          </p>

          {/*
            Una sola línea de consigna, y ocupa sitio fijo tenga una u otra
            forma: si cambiara de alto entre escalones, el dibujo saltaría.
          */}
          <div className="flex min-h-16 w-full items-center justify-center gap-3">
            <h1 className="text-base font-extrabold leading-snug text-ink sm:text-2xl">
              {round.mode === "spoken" ? spokenPrompt : t("coloringKeyInstruction")}
            </h1>
            {round.mode === "spoken" && spokenPrompt && (
              <AudioButton
                text={spokenPrompt}
                label={t("coloringListenAria")}
              />
            )}
          </div>

          {/*
            El dibujo son tres capas sobre el mismo cuadrado. Abajo el lienzo,
            que es el papel y donde se pinta, recortado a cada zona. Encima la
            imagen de la lámina, que es solo tinta sobre transparente: tapa el
            borde de la pintura y hace que el color llegue justo a la línea.
            Arriba un SVG que no recibe toques: los números, y una zona
            enfocable por cada una para que el juego siga siendo jugable con
            teclado o con lector de pantalla.
          */}
          <div
            ref={boardRef}
            className="coloring-board w-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={round.picture.image}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
            />
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-0 h-full w-full"
              role="group"
              aria-label={round.picture.name[language]}
            >
              {shapes && round.tasks.map((task, index) => {
                const paint = filled[task.id];
                const rejected = wrongRegion === task.id;
                return (
                  <g key={task.id}>
                    <path
                      d={shapes[index]}
                      role="button"
                      tabIndex={paint ? -1 : 0}
                      aria-label={
                        paint
                          ? t("coloringRegionDone", {
                              region: task.label[language],
                              color: COLORING_COLORS[paint].label[language],
                            })
                          : task.label[language]
                      }
                      aria-disabled={paint ? true : undefined}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          paintWithoutPointer(index, task);
                        }
                      }}
                      /*
                        El clic que no viene de un dedo ni de un ratón: un
                        lector de pantalla activa la zona con un clic sintético,
                        que llega con `detail` en cero. Los de verdad traen uno
                        o más y se ignoran aquí, porque un toque es un trazo.
                      */
                      onClick={(event) => {
                        if (event.detail !== 0) return;
                        paintWithoutPointer(index, task);
                      }}
                      /*
                        Se marca con relleno y no con contorno: la zona es una
                        pila de franjas de la rejilla, y su contorno dibujaría
                        cada franja. Un velo encima se lee igual de bien.
                      */
                      className={`outline-none focus-visible:fill-sky/45 ${
                        rejected ? "animate-shake" : ""
                      }`}
                      fill={rejected ? "rgba(226, 59, 46, 0.35)" : "transparent"}
                    />
                    {/*
                      El número solo mientras la zona está sin terminar: puesto
                      encima del color sobraría, y sobre un morado oscuro ni se
                      leería.
                    */}
                    {round.mode === "key" &&
                      !paint &&
                      task.labelAt.map((point) => (
                        <text
                          key={`${point.x},${point.y}`}
                          x={point.x}
                          y={point.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none fill-ink/70 font-extrabold"
                          style={{ fontSize: "7px" }}
                          aria-hidden="true"
                        >
                          {task.key}
                        </text>
                      ))}
                  </g>
                );
              })}
            </svg>
          </div>

          {/*
            La paleta. En los escalones numerados cada ficha lleva su número,
            que es la mitad de la mecánica; en los hablados no, porque ahí el
            color se pide por su nombre.
          */}
          <div
            className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3"
            role="group"
            aria-label={t("coloringPaletteAria")}
          >
            {round.palette.map((colorId, index) => {
              const chosen = selected === colorId;
              return (
                <button
                  key={colorId}
                  type="button"
                  onClick={() => pickColor(colorId)}
                  aria-pressed={chosen}
                  aria-label={
                    round.mode === "key"
                      ? t("coloringSwatchKeyAria", {
                          key: index + 1,
                          color: COLORING_COLORS[colorId].label[language],
                        })
                      : COLORING_COLORS[colorId].label[language]
                  }
                  /*
                   * 48 px en móvil: con seis colores —el nivel 5— seis
                   * fichas de 56 no caben en 375 px y la última se iba sola
                   * a una segunda fila. 48 sigue por encima del objetivo
                   * táctil mínimo y las seis entran en una línea.
                   */
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-4 text-lg font-extrabold text-white transition-transform active:scale-95 sm:h-16 sm:w-16 md:h-20 md:w-20 md:text-2xl ${
                    chosen
                      ? "border-ink shadow-lg ring-4 ring-sun"
                      : "border-ink/20 shadow-sm"
                  }`}
                  style={{ backgroundColor: COLORING_COLORS[colorId].hex }}
                >
                  {round.mode === "key" ? (
                    <span
                      aria-hidden="true"
                      className="[text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
                    >
                      {index + 1}
                    </span>
                  ) : (
                    <span aria-hidden="true">{chosen ? "✓" : ""}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/*
            El grosor del pincel. Tres botones y no un deslizador: un
            deslizador pide un gesto fino y no se puede nombrar en voz alta.
            La mancha de cada botón lleva el color elegido, así que el pincel
            que se va a usar se ve antes de usarlo. Del escalón 4 en adelante
            el grueso no está: son solo los grosores que ofrece el escalón.
          */}
          <div
            className="flex w-full items-center justify-center gap-2 sm:gap-3"
            role="group"
            aria-label={t("coloringBrushAria")}
          >
            {coloringBrushesForLevel(level).map(({ id, radius }) => {
              const chosen = brush === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickBrush(id)}
                  aria-pressed={chosen}
                  aria-label={t(BRUSH_LABEL[id])}
                  /*
                   * Un escalón por debajo de la paleta en cada tamaño: el
                   * color es lo que se pregunta y el pincel es la herramienta,
                   * pero en una tableta con fichas de 80 px un botón de 56 se
                   * leería como deshabilitado.
                   */
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-4 bg-white transition-transform active:scale-95 sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                    chosen
                      ? "border-ink shadow-lg ring-4 ring-sun"
                      : "border-ink/20 shadow-sm"
                  }`}
                >
                  {/*
                    El punto guarda la proporción de los tres radios, así que
                    el botón enseña el grosor en vez de describirlo. Va en
                    porcentaje del hueco del botón —40 px de lado en móvil—
                    para crecer con él en los tres tamaños sin repetir aquí
                    cada escalón.
                  */}
                  <span
                    aria-hidden="true"
                    className="aspect-square rounded-full"
                    style={{
                      width: `${((radius * 2.1) / 40) * 100}%`,
                      backgroundColor: selected
                        ? COLORING_COLORS[selected].hex
                        : OUTLINE,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <p
            className="flex min-h-6 items-center text-sm font-bold text-ink/60"
            role="status"
            aria-live="polite"
          >
            {needsColor ? t("coloringPickColorFirst") : ""}
          </p>
        </section>
      )}

      {phase === "results" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={140}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("coloringResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("coloringResultsText", { total: rounds.length })}
            </p>
            <p className="mt-1 text-sm font-extrabold text-ink/70">
              {t("coloringLevelLabel", { level })}
            </p>
          </div>

          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              tone="berry"
              label={t("coloringPictures")}
              value={rounds.length}
            />
            <ResultStat
              tone="berry"
              label={t("coloringAreas")}
              value={painted}
            />
            <ResultStat
              tone="berry"
              label={t("coloringAccuracy")}
              value={`${accuracy}%`}
            />
          </div>
          <ResultActions
            playAgainLabel={t("coloringPlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

/** Cómo se llama cada grosor. El id vive en la lib; el nombre, en los copys. */
const BRUSH_LABEL = {
  fino: "coloringBrushFine",
  medio: "coloringBrushMedium",
  grueso: "coloringBrushThick",
} as const;

/**
 * Ejemplo estático de la intro: una zona a medio pintar con la pasada del
 * pincel a la vista, y los tres grosores al lado. No usa el generador real;
 * solo enseña que aquí se pinta arrastrando y que el pincel se elige.
 */
function ColoringExample() {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("coloringExampleAria")}
    >
      <svg viewBox="0 0 100 100" className="h-12 w-12" aria-hidden="true">
        <path
          d="M50 10 L92 44 L8 44 Z"
          fill="#ffffff"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/*
          Las pasadas del pincel, a la vista: es lo que distingue este juego
          de tocar la zona. Van dentro del techo sin recortarlas —tres rectas
          cortas caben de sobra—, porque un `clipPath` necesita un id y la
          ayuda vuelve a enseñar este mismo ejemplo encima de la partida.
        */}
        <path
          d="M28 40 H72 M33 30.5 H67 M44 21 H56"
          fill="none"
          stroke={COLORING_COLORS.rojo.hex}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M50 10 L92 44 L8 44 Z"
          fill="none"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M16 44 H84 V92 H16 Z"
          fill="#ffffff"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-ink/70 font-extrabold"
          style={{ fontSize: "22px" }}
        >
          2
        </text>
      </svg>
      <span aria-hidden="true" className="text-xl">
        →
      </span>
      <span aria-hidden="true" className="flex items-end gap-1.5">
        {COLORING_BRUSHES.map(({ id, radius }) => (
          <span
            key={id}
            className="rounded-full"
            style={{
              width: `${radius * 2.1}px`,
              height: `${radius * 2.1}px`,
              backgroundColor:
                id === COLORING_DEFAULT_BRUSH
                  ? COLORING_COLORS.azul.hex
                  : "rgba(23,23,23,0.35)",
            }}
          />
        ))}
      </span>
    </div>
  );
}
