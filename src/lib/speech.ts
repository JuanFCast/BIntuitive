import type { Language } from "./language";

const cachedVoices: Partial<Record<Language, SpeechSynthesisVoice>> = {};

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(language: Language): SpeechSynthesisVoice | null {
  const cachedVoice = cachedVoices[language];
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  const preferences =
    language === "en"
      ? ["en-US", "en-GB", "en"]
      : ["es-CO", "es-419", "es-MX", "es-ES", "es"];

  const voice =
    preferences
      .map((locale) =>
        voices.find((candidate) => candidate.lang.startsWith(locale)),
      )
      .find(Boolean) ?? null;

  if (voice) cachedVoices[language] = voice;
  return voice;
}

export function speak(
  text: string,
  language: Language,
  onEnd?: () => void,
): void {
  if (!isSpeechAvailable()) {
    onEnd?.();
    return;
  }
  const synthesis = window.speechSynthesis;
  // Solo se cancela si de verdad hay algo sonando o en cola. En Safari (iOS
  // incluido) un cancel() con la cola vacía puede dejar el sintetizador en
  // pausa, y entonces la locución siguiente ya no se oye.
  if (synthesis.speaking || synthesis.pending) synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "en" ? "en-US" : "es-ES";
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  const voice = pickVoice(language);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();
  }
  synthesis.speak(utterance);
  // Safari puede quedarse pausado tras un cancel anterior; si no lo está,
  // resume() no hace nada.
  synthesis.resume();
}

export function cancelSpeech(): void {
  if (isSpeechAvailable()) {
    window.speechSynthesis.cancel();
  }
}

/** En iOS/Safari las voces cargan de forma asíncrona; precalentar la lista. */
export function warmUpVoices(): void {
  if (!isSpeechAvailable()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    delete cachedVoices.en;
    delete cachedVoices.es;
    pickVoice("en");
    pickVoice("es");
  };
}
