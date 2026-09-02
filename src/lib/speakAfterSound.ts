"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Language } from "./language";
import { cancelSpeech, speak, warmUpVoices } from "./speech";
import { isMuted } from "./storage";

/**
 * Espera entre el sonido de acierto y la voz. En iOS el `AudioContext` que
 * suena el acorde se traga la locución si las dos arrancan a la vez, así que la
 * palabra se dice cuando el sonido ya ha terminado. Es el mismo retraso que usa
 * `AudioButton` para su reproducción automática.
 */
export const SPEAK_AFTER_SOUND_MS = 350;

export type SpeakAfterSound = {
  /** Programa la locución para cuando el sonido de acierto haya terminado. */
  speakAfterSound: (text: string) => void;
  /** Descarta lo que estuviera pendiente y calla lo que se esté diciendo. */
  cancel: () => void;
};

/**
 * Decir un texto justo después del sonido de acierto, respetando el silencio.
 *
 * No sabe nada del juego que la usa: recibe un texto y lo dice. La comparten
 * los dos juegos de palabras porque el problema es de iOS, no de la mecánica,
 * y resolverlo dos veces habría significado mantener dos veces las mismas
 * defensas delicadas.
 *
 * Solo hay una locución pendiente a la vez: si llega otra antes de que hable,
 * la anterior se descarta y suena la última, de modo que nunca se acumulan ni
 * se pisan. El silencio se comprueba al disparar, no al programar, para que
 * silenciar entre medias también calle la que ya estaba en camino.
 */
export function useSpeakAfterSound(language: Language): SpeakAfterSound {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En iOS las voces cargan de forma asíncrona: precalentar la lista para que
  // la primera palabra ya suene con la voz del idioma correcto.
  useEffect(() => {
    warmUpVoices();
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    cancelSpeech();
  }, []);

  const speakAfterSound = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!isMuted()) speak(text, language);
      }, SPEAK_AFTER_SOUND_MS);
    },
    [language],
  );

  // Salir del juego no deja hablando una palabra de la pantalla anterior.
  useEffect(() => () => cancel(), [cancel]);

  return { speakAfterSound, cancel };
}
