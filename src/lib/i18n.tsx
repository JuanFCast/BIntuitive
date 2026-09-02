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
    navAria: "Main navigation",
    menuAria: "Settings",
    menuTitle: "Settings",
    menuClose: "Close settings",
    menuLanguage: "Language",
    menuSound: "Sound",
    menuSoundOn: "On",
    menuSoundOff: "Off",
    menuText: "Text",
    menuTextNormal: "Normal",
    menuTextLarge: "Large",
    menuTextXLarge: "Extra large",
    menuAbout: "About BIntuitive",
    aboutTagline: "Learning is always fun.",
    aboutDescription:
      "BIntuitive is a learning hub built around microgames that turn short play sessions into opportunities to learn and grow.",
    profilePreferencesSummary:
      "Change them from the settings menu at the top right.",
    categoryStart: "Start playing",
    categoryLevel: "Level {level}",
    placesGoal: "Recognise places and pick the right one.",
    placesHowTo: "Look at the picture or the clue, then tap the place it describes.",
    placesExampleAria: "A beach picture matches the word Beach",
    placesExampleWord: "Beach",
    numbersGoal: "Recognise numbers, amounts and how they compare.",
    numbersHowTo: "Look at the number, the group or the clue, then tap the right answer.",
    numbersExampleAria: "Three apples match the number three",
    colorsGoal: "Recognise colours and pick the right answer.",
    colorsHowTo: "Look at the colour or the clue, then tap the answer that matches.",
    colorsExampleAria: "A blue square matches the word Blue",
    colorsExampleWord: "Blue",
    helpAria: "See how to play",
    helpClose: "Got it",
    introExample: "Example",
    introListen: "Listen to the instructions",
    visualExampleAria: "The two cards share the sun: tap the sun",
    typingExampleAria: "Type the words exactly as they appear",
    scrambleExampleAria: "The letters T, A and C form the word CAT",
    scrambleExampleLetters: "T · A · C",
    scrambleExampleWord: "CAT",
    typingExampleText: "the little bee",
    typingExampleTyped: "the lit",
    searchExampleAria: "The word CAT is hidden in the first row",
    searchExampleWord: "CAT",
    navExplore: "Explore",
    navProgress: "Progress",
    navProfile: "Profile",
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
    progressHeading: "Your progress",
    progressIntro: "See what you have accomplished as you learn.",
    progressEmptyTitle: "Your journey starts here",
    progressEmptyText: "Complete a lesson to see your progress here.",
    progressStars: "Stars earned",
    progressLessons: "Lessons completed",
    progressLocalNote: "Your progress is saved only on this device.",
    profileHeading: "Profile",
    profileIntro: "Make BIntuitive feel right for you.",
    profilePreferences: "Preferences",
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
    scrambleTitle: "Word Scramble",
    scrambleIntro: "Unscramble the letters to form the word.",
    scrambleHowTo: "Look at the picture and tap the letters one by one. Use the arrow to take a letter back.",
    scrambleStart: "Start spelling",
    scrambleInstruction: "Tap the letters in order",
    scrambleProgressAria: "Word {current} of {total}",
    scrambleLevel: "Level",
    scrambleLevelAria: "Difficulty level {level} of {total}",
    scrambleListen: "Listen to the word",
    scrambleAnswerAria: "Your word: {word}",
    scrambleEmptyAnswer: "no letters yet",
    scrambleLettersAria: "Available letters",
    scrambleLetterAria: "Letter {letter}",
    scrambleUndo: "Take back the last letter",
    scrambleClear: "Clear the word",
    scramblePerfectWords: "Perfect words",
    scrambleMistakes: "Mistakes",
    scrambleAccuracy: "Accuracy",
    scrambleResultsTitle: "Words unscrambled!",
    scrambleResultsText: "You built all {total} words.",
    scrambleRecord: "🏆 New record!",
    scramblePlayAgain: "Play again",
    searchTitle: "Word Search",
    searchIntro: "Find the hidden words in the letter grid.",
    searchHowTo: "Slide your finger from the first letter to the last one. Words hide across, down, and diagonally, and some of them run backwards.",
    searchStart: "Start searching",
    searchInstruction: "Slide across the letters to trace a word",
    searchWordsHeading: "Words to find",
    searchProgressAria: "Puzzle {current} of {total}",
    searchLevel: "Level",
    searchLevelAria: "Difficulty level {level} of {total}",
    searchGridAria: "Letter grid, {size} by {size}",
    searchCellAria: "Letter {letter}, row {row}, column {column}",
    searchWordFoundAria: "{word}, found",
    searchWordPendingAria: "{word}, still hidden",
    searchFound: "{word}! 🎉",
    searchBoardDone: "Puzzle complete!",
    searchClearSelection: "Clear the current selection",
    searchTime: "Time",
    searchWordsFound: "Words found",
    searchMisses: "Wrong tries",
    searchAccuracy: "Accuracy",
    searchLevelReached: "Level reached",
    searchResultsTitle: "All words found!",
    searchResultsText: "You found {total} words in {boards} puzzles.",
    searchRecord: "🏆 New record!",
    searchPlayAgain: "Play again",
  },
  es: {
    navAria: "Navegación principal",
    menuAria: "Ajustes",
    menuTitle: "Ajustes",
    menuClose: "Cerrar ajustes",
    menuLanguage: "Idioma",
    menuSound: "Sonido",
    menuSoundOn: "Activado",
    menuSoundOff: "Desactivado",
    menuText: "Texto",
    menuTextNormal: "Normal",
    menuTextLarge: "Grande",
    menuTextXLarge: "Muy grande",
    menuAbout: "Acerca de BIntuitive",
    aboutTagline: "Learning is always fun.",
    aboutDescription:
      "BIntuitive es un centro de aprendizaje basado en microjuegos diseñados para convertir sesiones cortas de juego en oportunidades para aprender y desarrollarse.",
    profilePreferencesSummary:
      "Cámbialas desde el menú de ajustes de la esquina superior derecha.",
    categoryStart: "Empezar a jugar",
    categoryLevel: "Nivel {level}",
    placesGoal: "Reconoce lugares y elige el correcto.",
    placesHowTo: "Mira la imagen o la pista y toca el lugar que le corresponde.",
    placesExampleAria: "La imagen de una playa corresponde a la palabra Playa",
    placesExampleWord: "Playa",
    numbersGoal: "Reconoce números, cantidades y cómo se comparan.",
    numbersHowTo: "Mira el número, el grupo o la pista y toca la respuesta correcta.",
    numbersExampleAria: "Tres manzanas corresponden al número tres",
    colorsGoal: "Reconoce colores y elige la respuesta correcta.",
    colorsHowTo: "Mira el color o la pista y toca la respuesta que le corresponde.",
    colorsExampleAria: "Un cuadro azul corresponde a la palabra Azul",
    colorsExampleWord: "Azul",
    helpAria: "Ver cómo se juega",
    helpClose: "Entendido",
    introExample: "Ejemplo",
    introListen: "Escuchar las instrucciones",
    visualExampleAria: "Las dos cartas comparten el sol: toca el sol",
    typingExampleAria: "Escribe las palabras tal como aparecen",
    scrambleExampleAria: "Las letras T, A, G y O forman la palabra GATO",
    scrambleExampleLetters: "T · A · G · O",
    scrambleExampleWord: "GATO",
    typingExampleText: "la abeja pequeña",
    typingExampleTyped: "la abe",
    searchExampleAria: "La palabra SOL está escondida en la primera fila",
    searchExampleWord: "SOL",
    navExplore: "Explorar",
    navProgress: "Progreso",
    navProfile: "Perfil",
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
    progressHeading: "Tu progreso",
    progressIntro: "Descubre lo que has logrado mientras aprendes.",
    progressEmptyTitle: "Tu recorrido empieza aquí",
    progressEmptyText: "Completa una lección para ver aquí tu progreso.",
    progressStars: "Estrellas ganadas",
    progressLessons: "Lecciones completadas",
    progressLocalNote: "Tu progreso se guarda solamente en este dispositivo.",
    profileHeading: "Perfil",
    profileIntro: "Haz que BIntuitive se adapte a ti.",
    profilePreferences: "Preferencias",
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
    scrambleTitle: "Ordena la palabra",
    scrambleIntro: "Ordena las letras y forma la palabra.",
    scrambleHowTo: "Mira la imagen y toca las letras una por una. Usa la flecha para devolver una letra.",
    scrambleStart: "Empezar a ordenar",
    scrambleInstruction: "Toca las letras en orden",
    scrambleProgressAria: "Palabra {current} de {total}",
    scrambleLevel: "Nivel",
    scrambleLevelAria: "Nivel de dificultad {level} de {total}",
    scrambleListen: "Escuchar la palabra",
    scrambleAnswerAria: "Tu palabra: {word}",
    scrambleEmptyAnswer: "todavía sin letras",
    scrambleLettersAria: "Letras disponibles",
    scrambleLetterAria: "Letra {letter}",
    scrambleUndo: "Devolver la última letra",
    scrambleClear: "Borrar la palabra",
    scramblePerfectWords: "Palabras perfectas",
    scrambleMistakes: "Errores",
    scrambleAccuracy: "Precisión",
    scrambleResultsTitle: "¡Palabras ordenadas!",
    scrambleResultsText: "Formaste las {total} palabras.",
    scrambleRecord: "🏆 ¡Nuevo récord!",
    scramblePlayAgain: "Jugar otra vez",
    searchTitle: "Sopa de letras",
    searchIntro: "Encuentra las palabras escondidas en la cuadrícula.",
    searchHowTo: "Desliza el dedo desde la primera letra hasta la última. Las palabras se esconden en horizontal, vertical y diagonal, y algunas van al revés.",
    searchStart: "Empezar a buscar",
    searchInstruction: "Desliza sobre las letras para marcar una palabra",
    searchWordsHeading: "Palabras por encontrar",
    searchProgressAria: "Sopa {current} de {total}",
    searchLevel: "Nivel",
    searchLevelAria: "Nivel de dificultad {level} de {total}",
    searchGridAria: "Cuadrícula de letras, {size} por {size}",
    searchCellAria: "Letra {letter}, fila {row}, columna {column}",
    searchWordFoundAria: "{word}, encontrada",
    searchWordPendingAria: "{word}, todavía escondida",
    searchFound: "¡{word}! 🎉",
    searchBoardDone: "¡Sopa completa!",
    searchClearSelection: "Borrar la selección",
    searchTime: "Tiempo",
    searchWordsFound: "Palabras encontradas",
    searchMisses: "Intentos fallidos",
    searchAccuracy: "Precisión",
    searchLevelReached: "Nivel alcanzado",
    searchResultsTitle: "¡Encontraste todas!",
    searchResultsText: "Encontraste {total} palabras en {boards} sopas.",
    searchRecord: "🏆 ¡Nuevo récord!",
    searchPlayAgain: "Jugar otra vez",
  },
} as const;

/** Clave válida del diccionario. Se exporta para tablas de contenido que
 *  guardan claves en vez de textos ya traducidos. */
export type MessageKey = keyof (typeof messages)["en"];
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
