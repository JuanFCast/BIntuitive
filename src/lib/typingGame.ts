import type { Language } from "./language";

export const TYPING_DURATION_SECONDS = 30;

export type TypingStats = {
  wpm: number;
  accuracy: number;
  mistakes: number;
  progress: number;
};

const PHRASES: Record<Language, string[]> = {
  en: [
    "Learning a little every day can lead to remarkable progress.",
    "A curious mind turns every question into a new adventure.",
    "Clear ideas grow when we read, practice, and ask why.",
    "A steady rhythm is often faster than a rushed beginning.",
    "Small challenges help the brain become stronger and more flexible.",
    "The best way to improve a skill is to practice it with patience.",
    "Books, music, numbers, and nature are full of patterns to discover.",
    "Accuracy comes first, and speed follows with consistent practice.",
  ],
  es: [
    "Aprender un poco cada día puede producir un progreso sorprendente.",
    "Una mente curiosa convierte cada pregunta en una nueva aventura.",
    "Las ideas claras crecen cuando leemos, practicamos y preguntamos por qué.",
    "Un ritmo constante suele ser más rápido que un comienzo apresurado.",
    "Los pequeños retos ayudan al cerebro a ser más fuerte y flexible.",
    "La mejor manera de mejorar una habilidad es practicar con paciencia.",
    "Los libros, la música y la naturaleza esconden patrones por descubrir.",
    "Primero llega la precisión y luego la velocidad con práctica constante.",
  ],
};

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildTypingPassage(language: Language, minLength = 240): string {
  const phrases = shuffle(PHRASES[language]);
  const selected: string[] = [];
  let length = 0;
  let index = 0;

  while (length < minLength) {
    const phrase = phrases[index % phrases.length];
    selected.push(phrase);
    length += phrase.length + 1;
    index += 1;
  }

  return selected.join(" ");
}

export function computeTypingStats(
  typed: string,
  passage: string,
  elapsedMilliseconds: number,
  mistakeCount: number,
): TypingStats {
  let correct = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === passage[index]) correct += 1;
  }

  const elapsedMinutes = Math.max(elapsedMilliseconds / 60000, 1 / 60);
  const wpm = Math.round(correct / 5 / elapsedMinutes);
  const accuracy = typed.length === 0 ? 1 : correct / typed.length;
  const progress = passage.length === 0 ? 0 : typed.length / passage.length;

  return {
    wpm,
    accuracy,
    mistakes: mistakeCount,
    progress: Math.min(progress, 1),
  };
}
