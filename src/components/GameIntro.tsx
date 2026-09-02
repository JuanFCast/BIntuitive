"use client";

import type { ReactNode } from "react";
import AudioButton from "./AudioButton";
import BrandMark from "./BrandMark";
import { useLanguage } from "@/lib/i18n";

/**
 * Lo que explica un juego: la única fuente de contenido de su introducción.
 * `GameShell` la usa dos veces —la pantalla previa a jugar y la ayuda— para
 * que las dos explicaciones no puedan divergir nunca.
 */
export type GameIntroContent = {
  /** Emoji del juego; decorativo, el nombre ya va en el título. */
  emoji: string;
  title: string;
  /** Qué debe lograr el jugador, en una frase. */
  goal: string;
  /** Las acciones concretas del juego. */
  howTo: string;
  /**
   * Muestra pequeña y estática de la mecánica. La plantilla no sabe nada del
   * juego: recibe el ejemplo ya montado y solo lo enmarca.
   */
  example?: ReactNode;
};

export type ActionVariant = "default" | "round";

const ACTION_VARIANTS: Record<ActionVariant, string> = {
  default: "rounded-2xl border-[#9b7600] text-black",
  round: "rounded-full border-[#e0a800] text-ink",
};

type GameIntroProps = GameIntroContent & {
  actionLabel: string;
  onAction: () => void;
  /**
   * Aspecto del botón principal. Existe solo porque Agilidad visual llegó a la
   * plantilla con un CTA distinto al de los demás juegos, y unificarlos es una
   * decisión de diseño que aún no está tomada.
   */
  actionVariant?: ActionVariant;
  /**
   * `screen` es la pantalla previa a jugar y ocupa el alto disponible.
   * `dialog` es la misma explicación dentro de la ayuda, sin la marca y con la
   * altura acotada para que quepa sobre la partida.
   */
  layout?: "screen" | "dialog";
};

export default function GameIntro({
  emoji,
  title,
  goal,
  howTo,
  example,
  actionLabel,
  onAction,
  actionVariant = "default",
  layout = "screen",
}: GameIntroProps) {
  const { t } = useLanguage();
  const isDialog = layout === "dialog";

  return (
    <section
      className={
        isDialog
          ? "flex w-full flex-col items-center gap-4 text-center"
          : "mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-4 py-4 text-center"
      }
    >
      {!isDialog && (
        <BrandMark
          size={130}
          className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
        />
      )}

      <div>
        <p className={isDialog ? "text-4xl" : "text-5xl"} aria-hidden="true">
          {emoji}
        </p>
        <h1
          className={`mt-2 font-extrabold text-ink ${
            isDialog ? "text-3xl" : "text-4xl sm:text-5xl"
          }`}
        >
          {title}
        </h1>
        <p className="mt-3 text-xl font-bold text-ink/70">{goal}</p>
        <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-ink/55 sm:text-lg">
          {howTo}
        </p>
      </div>

      {example && (
        <figure className="w-full max-w-sm rounded-3xl border-2 border-sun/60 bg-white px-4 py-3 shadow-sm">
          <figcaption className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#9b7400]">
            {t("introExample")}
          </figcaption>
          <div className="mt-2 flex items-center justify-center">{example}</div>
        </figure>
      )}

      <div className="flex items-center justify-center gap-4">
        {/*
          Escuchar es siempre a petición: en iOS la voz solo arranca como
          consecuencia directa de un gesto, así que una locución automática al
          abrir esta pantalla quedaría muda justo en el dispositivo objetivo.
        */}
        <AudioButton text={`${goal} ${howTo}`} label={t("introListen")} />
        <button
          type="button"
          onClick={onAction}
          className={`min-h-16 border-b-8 bg-sun px-10 py-3 text-2xl font-extrabold shadow-xl transition-transform active:scale-95 active:border-b-4 ${ACTION_VARIANTS[actionVariant]}`}
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
