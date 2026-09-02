"use client";

import BrandMark from "./BrandMark";

type GameIntroProps = {
  /** Emoji del juego; decorativo, el nombre ya va en el título. */
  emoji: string;
  title: string;
  /** Qué debe lograr el jugador, en una frase. */
  goal: string;
  /** Las acciones concretas del juego. */
  howTo: string;
  startLabel: string;
  onStart: () => void;
  /**
   * Aspecto del botón de empezar. Existe solo porque Agilidad visual llegó a
   * la plantilla con un CTA distinto al de los demás juegos, y unificarlos es
   * una decisión de diseño que aún no está tomada. Cuando se tome, se borra la
   * variante que sobre y con ella esta propiedad.
   */
  startVariant?: StartVariant;
};

type StartVariant = "default" | "round";

const START_VARIANTS: Record<StartVariant, string> = {
  default:
    "rounded-2xl border-[#9b7600] text-black",
  round:
    "rounded-full border-[#e0a800] text-ink",
};

/**
 * Introducción común a todos los juegos: emoji, título, objetivo, cómo jugar y
 * un único botón para empezar. Es la pantalla que ve un niño antes de la
 * primera partida, así que el botón es el único elemento pulsable.
 *
 * El ejemplo visual, el audio y la ayuda para reabrir esta pantalla aún no
 * están aquí: entran más adelante, y este componente es el sitio donde deben
 * llegar una sola vez para todos los juegos.
 */
export default function GameIntro({
  emoji,
  title,
  goal,
  howTo,
  startLabel,
  onStart,
  startVariant = "default",
}: GameIntroProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
      <BrandMark
        size={130}
        className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
      />
      <div>
        <p className="text-5xl" aria-hidden="true">{emoji}</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-xl font-bold text-ink/70">{goal}</p>
        <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-ink/55 sm:text-lg">
          {howTo}
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className={`min-h-16 border-b-8 bg-sun px-10 py-3 text-2xl font-extrabold shadow-xl transition-transform active:scale-95 active:border-b-4 ${START_VARIANTS[startVariant]}`}
      >
        {startLabel}
      </button>
    </section>
  );
}
