let cachedVoice: SpeechSynthesisVoice | null = null;

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang.startsWith("es-CO")) ??
    voices.find((v) => v.lang.startsWith("es-419")) ??
    voices.find((v) => v.lang.startsWith("es-MX")) ??
    voices.find((v) => v.lang.startsWith("es")) ??
    null;
  return cachedVoice;
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechAvailable()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  const voice = pickSpanishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();
  }
  window.speechSynthesis.speak(utterance);
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
    cachedVoice = null;
    pickSpanishVoice();
  };
}
