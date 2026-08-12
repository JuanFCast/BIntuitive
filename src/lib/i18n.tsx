"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "./language";

const LANGUAGE_KEY = "bintuitive-language";

const messages = {
  en: {
    switchLanguage: "Cambiar a español",
    homeTagline: "Learn, practice, and challenge yourself.",
    totalStarsAria: "You have earned {count} stars in total",
    starsEarned: "{count} stars earned",
    play: "Play!",
    homeFooter: "Learn, play, and explore · No ads · Works offline",
    hexagonsHeading: "Choose a hexagon",
    back: "Back",
    hexagonPlayAria: "Open the {name} hexagon",
    starsProgressAria: "You have {stars} out of {total} stars",
    exitGameAria: "Exit the lesson",
    listenAgain: "Listen to the instruction again",
    enableSounds: "Turn sounds on",
    muteSounds: "Mute sounds",
    feedbackCorrect: "Great job! 🎉",
    feedbackAlmost: "Almost... Try again!",
    hintLabel: "Hint: {hint}",
    feedbackReveal: "Look, this was the answer! You'll get it next time 💪",
    exitDialogAria: "Confirmation to exit the lesson",
    exitTitle: "Exit the lesson?",
    exitMessage: "Your progress in this lesson will not be saved.",
    leaveLesson: "Exit lesson",
    continuePlaying: "Keep playing",
    progressQuestion: "Question {current} of {total}",
    resultsPerfect: "Amazing! You got them all!",
    resultsAlmostPerfect: "Awesome! Almost perfect!",
    resultsGood: "Great job! Keep it up!",
    resultsTryAgain: "Good try! You're getting better every time!",
    resultsStarsAria: "You earned {stars} out of {total} stars",
    goldMedal: "🏅 Gold medal!",
    playAgain: "🔁 Play again",
    anotherHexagon: "⬡ Another hexagon",
    backToHexagons: "Back to hexagons",
    visualTitle: "Visual Agility",
    visualIntro: "Find the one symbol shared by both cards.",
    visualHowTo: "Look at the reference card, then tap the matching symbol on your card. A wrong tap adds one second.",
    visualStart: "Start challenge",
    visualInstruction: "Tap the matching symbol",
    visualProgress: "Card {current} of {total}",
    visualReference: "Reference",
    visualYourCard: "Tap this card",
    visualCards: "Cards",
    visualTime: "Time",
    visualMistakes: "Mistakes",
    visualPenalty: "+1 second",
    visualAccuracy: "Accuracy",
    visualResultsTitle: "Great focus!",
    visualResultsText: "You completed all {total} cards.",
    visualPlayAgain: "Play again",
    typingTitle: "Type Rush",
    typingIntro: "Build speed and accuracy by typing the text before time runs out.",
    typingHowTo: "Tap Start, type exactly what you see, and correct mistakes as you go. Pasting is disabled.",
    typingStart: "Start typing",
    typingStartHint: "The timer starts with your first character.",
    typingTime: "Time",
    typingWpm: "WPM",
    typingAccuracy: "Accuracy",
    typingMistakes: "Mistakes",
    typingInputLabel: "Type the text shown above",
    typingInputPlaceholder: "Start typing here...",
    typingResultsTitle: "Race complete!",
    typingResultsText: "Keep practicing to improve your speed and accuracy.",
    typingPlayAgain: "Try another text",
  },
  es: {
    switchLanguage: "Switch to English",
    homeTagline: "Aprende, practica y supera nuevos retos.",
    totalStarsAria: "Has ganado {count} estrellas en total",
    starsEarned: "{count} estrellas ganadas",
    play: "¡Jugar!",
    homeFooter: "Aprende, juega y explora · Sin anuncios · Sin conexión",
    hexagonsHeading: "Elige un hexágono",
    back: "Volver",
    hexagonPlayAria: "Abrir el hexágono {name}",
    starsProgressAria: "Llevas {stars} estrellas de {total}",
    exitGameAria: "Salir de la lección",
    listenAgain: "Escuchar la instrucción otra vez",
    enableSounds: "Activar sonidos",
    muteSounds: "Silenciar sonidos",
    feedbackCorrect: "¡Muy bien! 🎉",
    feedbackAlmost: "Casi... ¡intenta otra vez!",
    hintLabel: "Pista: {hint}",
    feedbackReveal: "¡Mira, esta era! La próxima la logras 💪",
    exitDialogAria: "Confirmación para salir de la lección",
    exitTitle: "¿Salir de la lección?",
    exitMessage: "Tu progreso en esta lección no se guardará.",
    leaveLesson: "Salir de la lección",
    continuePlaying: "Seguir jugando",
    progressQuestion: "Pregunta {current} de {total}",
    resultsPerfect: "¡Increíble! ¡Lo lograste todo!",
    resultsAlmostPerfect: "¡Súper! ¡Casi perfecto!",
    resultsGood: "¡Muy bien! ¡Sigue así!",
    resultsTryAgain: "¡Buen intento! ¡Cada vez lo haces mejor!",
    resultsStarsAria: "Ganaste {stars} de {total} estrellas",
    goldMedal: "🏅 ¡Medalla de oro!",
    playAgain: "🔁 Jugar otra vez",
    anotherHexagon: "⬡ Otro hexágono",
    backToHexagons: "Volver a los hexágonos",
    visualTitle: "Agilidad visual",
    visualIntro: "Encuentra el único símbolo que comparten las dos cartas.",
    visualHowTo: "Mira la carta de referencia y toca el símbolo igual en tu carta. Cada error suma un segundo.",
    visualStart: "Empezar reto",
    visualInstruction: "Toca el símbolo en común",
    visualProgress: "Carta {current} de {total}",
    visualReference: "Referencia",
    visualYourCard: "Toca esta carta",
    visualCards: "Cartas",
    visualTime: "Tiempo",
    visualMistakes: "Errores",
    visualPenalty: "+1 segundo",
    visualAccuracy: "Precisión",
    visualResultsTitle: "¡Qué buena concentración!",
    visualResultsText: "Completaste las {total} cartas.",
    visualPlayAgain: "Jugar otra vez",
    typingTitle: "Type Rush",
    typingIntro: "Mejora tu velocidad y precisión escribiendo el texto antes de que se acabe el tiempo.",
    typingHowTo: "Toca Empezar, escribe exactamente lo que ves y corrige los errores. No se puede pegar texto.",
    typingStart: "Empezar a escribir",
    typingStartHint: "El tiempo comienza con tu primer carácter.",
    typingTime: "Tiempo",
    typingWpm: "PPM",
    typingAccuracy: "Precisión",
    typingMistakes: "Errores",
    typingInputLabel: "Escribe el texto que aparece arriba",
    typingInputPlaceholder: "Empieza a escribir aquí...",
    typingResultsTitle: "¡Carrera terminada!",
    typingResultsText: "Sigue practicando para mejorar tu velocidad y precisión.",
    typingPlayAgain: "Probar otro texto",
  },
} as const;

type MessageKey = keyof (typeof messages)["en"];
type MessageParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: MessageKey, params?: MessageParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_KEY);
      if (saved === "en" || saved === "es") {
        setLanguageState(saved);
      }
    } catch {
      // English remains the default when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    } catch {
      // The language still changes for the current session.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "es" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: MessageKey, params: MessageParams = {}) => {
      let result: string = messages[language][key];
      Object.entries(params).forEach(([name, value]) => {
        result = result.replaceAll(`{${name}}`, String(value));
      });
      return result;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
