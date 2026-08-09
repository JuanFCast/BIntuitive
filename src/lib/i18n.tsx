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

const LANGUAGE_KEY = "beesmart-language";

const messages = {
  en: {
    switchLanguage: "Cambiar a español",
    homeTagline: "Listen, think, and tap the correct answer!",
    totalStarsAria: "You have earned {count} stars in total",
    starsEarned: "{count} stars earned",
    play: "Play!",
    homeFooter: "Learn, play, and explore · No ads · Works offline",
    categoriesHeading: "Which world should we visit?",
    back: "Back",
    categoryPlayAria: "Play in the {name} world",
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
    anotherWorld: "🌍 Another world",
    mascotHappyAria: "Happy bee celebrating",
    mascotHintAria: "Bee giving a hint",
    mascotNormalAria: "Friendly bee",
  },
  es: {
    switchLanguage: "Switch to English",
    homeTagline: "Escucha, piensa y ¡toca la respuesta correcta!",
    totalStarsAria: "Has ganado {count} estrellas en total",
    starsEarned: "{count} estrellas ganadas",
    play: "¡Jugar!",
    homeFooter: "Aprende, juega y explora · Sin anuncios · Sin conexión",
    categoriesHeading: "¿A qué mundo vamos?",
    back: "Volver",
    categoryPlayAria: "Jugar al mundo de {name}",
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
    anotherWorld: "🌍 Otro mundo",
    mascotHappyAria: "Abejita feliz celebrando",
    mascotHintAria: "Abejita dando una pista",
    mascotNormalAria: "Abejita amigable",
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
