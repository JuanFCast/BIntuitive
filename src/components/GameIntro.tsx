"use client";

import type { ReactNode } from "react";
import AudioButton from "./AudioButton";
import { useLanguage } from "@/lib/i18n";
import { HEXAGON_CLIP } from "@/lib/hexagon";

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

type GameIntroProps = GameIntroContent & {
  actionLabel: string;
  onAction: () => void;
  /**
   * Lo que el juego pone entre el ejemplo y el botón de empezar: hoy, el
   * selector de nivel de Trazos.
   *
   * Va aparte de `intro` a propósito. `intro` es la explicación, y la ayuda
   * enseña esa misma explicación **encima de una partida en curso**: un
   * selector de nivel ahí invitaría a cambiar de dificultad a mitad de sesión,
   * que es justo lo que no puede pasar. Por eso esto solo llega a la pantalla
   * previa a jugar, y `GameHelp` no lo recibe nunca.
   */
  beforeAction?: ReactNode;
  /**
   * `screen` es la pantalla previa a jugar y ocupa el alto disponible.
   * `dialog` es la misma explicación dentro de la ayuda, sin la celda grande y con la
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
  beforeAction,
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
      {/*
        La pantalla previa enseña el juego, no la marca: quien llega aquí ya
        sabe en qué aplicación está, y lo que necesita reconocer es a qué va a
        jugar. Por eso el dibujo del juego va grande y dentro de una celda del
        mismo panal amarillo del que acaba de salir.
      */}
      {!isDialog && (
        <span
          className="block drop-shadow-[0_10px_18px_rgba(166,121,0,0.18)]"
          aria-hidden="true"
        >
          <span
            className="flex aspect-[0.8660254] w-[clamp(7.5rem,32vw,11rem)] items-center justify-center bg-sun text-[clamp(3.5rem,15vw,5.5rem)] leading-none"
            style={{ clipPath: HEXAGON_CLIP }}
          >
            {emoji}
          </span>
        </span>
      )}

      <div>
        {isDialog && (
          <p className="text-4xl" aria-hidden="true">
            {emoji}
          </p>
        )}
        <h1
          className={`font-extrabold text-ink ${isDialog ? "mt-2" : ""} ${
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
          <figcaption className="text-sm font-extrabold text-[#7a5c00]">
            {t("introExample")}
          </figcaption>
          <div className="mt-2 flex items-center justify-center">{example}</div>
        </figure>
      )}

      {!isDialog && beforeAction}

      {/*
        A 360px el altavoz ocupa 64px fijos y el botón, con "Empezar a jugar"
        y relleno de escritorio, se salía de la pantalla. En móvil el botón
        adelgaza y puede encoger; a partir de 640px queda como estaba.
      */}
      <div className="flex w-full max-w-sm items-center justify-center gap-3 sm:max-w-none sm:gap-4">
        {/*
          Escuchar es siempre a petición: en iOS la voz solo arranca como
          consecuencia directa de un gesto, así que una locución automática al
          abrir esta pantalla quedaría muda justo en el dispositivo objetivo.
        */}
        <AudioButton text={`${goal} ${howTo}`} label={t("introListen")} />
        <button
          type="button"
          onClick={onAction}
          className="min-h-16 min-w-0 flex-1 break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-4 py-3 text-xl font-extrabold leading-snug text-black shadow-xl transition-transform active:scale-95 active:border-b-4 sm:flex-none sm:px-10 sm:text-2xl"
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
