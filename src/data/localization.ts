import type { Hexagon } from "./categories";
import type { CategoryId, Question, QuestionOption } from "./questions";
import type { Language } from "@/lib/language";

// Exportado para que `validate:content` pueda comprobar la capa inglesa.
export const englishHexagons: Record<
  Hexagon["id"],
  Pick<Hexagon, "name" | "description">
> = {
  lugares: {
    name: "Places",
    description: "Beaches, mountains, and more",
  },
  numeros: {
    name: "Numbers",
    description: "Count and compare",
  },
  colores: {
    name: "Colors",
    description: "Red, blue, yellow...",
  },
  visual: {
    name: "Visual Agility",
    description: "Find the matching symbol",
  },
  typing: {
    name: "Type Rush",
    description: "Type quickly and accurately",
  },
  scramble: {
    name: "Word Scramble",
    description: "Unscramble the letters to form the word.",
  },
  search: {
    name: "Word Search",
    description: "Find the hidden words in the letter grid.",
  },
  memory: {
    name: "Memory",
    description: "Turn the cards over and find the pairs.",
  },
  tracing: {
    name: "Tracing",
    description: "Follow the dotted path with your finger.",
  },
  coloring: {
    name: "Coloring",
    description: "Paint each area with the colour it needs.",
  },
};

type QuestionCopy = {
  instruction: string;
  hint?: string;
};

export const englishQuestions: Record<string, QuestionCopy> = {
  // ─── PLACES ─────────────────────────────────────────────────
  "lugares-desierto-01": {
    instruction: "Tap the place with lots of sand and no water.",
    hint: "Look for the dry place with a cactus.",
  },
  "lugares-playa-02": {
    instruction: "Tap the place with the sea and sand.",
    hint: "Look for the blue water.",
  },
  "lugares-casa-03": {
    instruction: "Tap the place where you sleep with your family.",
    hint: "It's where your bed is.",
  },
  "lugares-escuela-11": {
    instruction: "Tap the place where you learn to read.",
    hint: "It has a flag and a clock.",
  },
  "lugares-parque-12": {
    instruction: "Tap the place with swings and a slide.",
    hint: "It's where you go to play outside.",
  },
  "lugares-tienda-13": {
    instruction: "Tap the place where you buy food.",
    hint: "It has a striped awning and a shop window.",
  },
  "lugares-montana-04": {
    instruction: "Tap the very high place with snow.",
    hint: "Look for the white part on top. It's snow!",
  },
  "lugares-selva-05": {
    instruction: "Tap the place with many trees and wild animals.",
    hint: "Look for the green place with lots of trees.",
  },
  "lugares-granja-06": {
    instruction: "Tap the place where cows and chickens live.",
    hint: "Look for the red barn out in the fields.",
  },
  "lugares-escuela-07": {
    instruction: "Tap the place where people learn.",
    hint: "Look for the boards and the notebooks.",
  },
  "lugares-hospital-14": {
    instruction: "Tap the place where they take care of you when you are sick.",
    hint: "Look for the red cross.",
  },
  "lugares-ciudad-15": {
    instruction: "Tap the place with very tall buildings.",
    hint: "Look for the lit windows, one above the other.",
  },
  "lugares-playa-16": {
    instruction: "Tap the place with waves where you can swim.",
    hint: "Look for the palm tree next to the water.",
  },
  "lugares-hospital-08": {
    instruction: "Tap the place where doctors take care of people.",
    hint: "Look for the doctor's cross.",
  },
  "lugares-parque-09": {
    instruction: "Tap the place with swings to play on.",
    hint: "The slide is there.",
  },
  "lugares-ciudad-10": {
    instruction: "Tap the place with many buildings and cars.",
    hint: "Look for the tall buildings and the street.",
  },
  "lugares-granja-17": {
    instruction: "Tap the place where food is grown.",
    hint: "Look for the barn in the fields, with the animals.",
  },
  "lugares-montana-18": {
    instruction: "Tap the place where it is very cold at the top.",
    hint: "The white part at the top is snow.",
  },
  "lugares-selva-19": {
    instruction: "Tap the place where monkeys jump between the trees.",
    hint: "It's the greenest place of them all.",
  },
  "lugares-tienda-20": {
    instruction: "Tap the place where you pay for what you take home.",
    hint: "It has a shop window and a striped awning.",
  },

  // ─── NUMBERS ────────────────────────────────────────────────
  "numeros-cinco-01": {
    instruction: "Tap the number five.",
    hint: "Five has a little hat on top.",
  },
  "numeros-mas-manzanas-02": {
    instruction: "Tap the group with more apples.",
    hint: "More is where there are lots.",
  },
  "numeros-dos-perritos-03": {
    instruction: "Tap the group with two puppies.",
    hint: "Count slowly: one, two.",
  },
  "numeros-tres-11": {
    instruction: "Tap the number three.",
    hint: "Three has two little tummies.",
  },
  "numeros-menos-estrellas-12": {
    instruction: "Tap the group with fewer stars.",
    hint: "Fewer is where there are only a few.",
  },
  "numeros-una-flor-13": {
    instruction: "Tap the group with only one flower.",
    hint: "Just one, nothing more.",
  },
  "numeros-mayor-04": {
    instruction: "Which number is the biggest?",
    hint: "The biggest is the largest one of them all.",
  },
  "numeros-despues-4-05": {
    instruction: "Which number comes after four?",
    hint: "Count: three, four, and keep going...",
  },
  "numeros-tres-estrellas-06": {
    instruction: "Tap the group with three stars.",
    hint: "Count: one, two, three.",
  },
  "numeros-siete-07": {
    instruction: "Tap the number seven.",
    hint: "Seven looks like a slide.",
  },
  "numeros-cinco-perritos-14": {
    instruction: "Tap the group with five puppies.",
    hint: "Count them on the fingers of one hand.",
  },
  "numeros-diez-15": {
    instruction: "Tap the number ten.",
    hint: "Ten is written with two digits.",
  },
  "numeros-antes-6-16": {
    instruction: "Which number comes before six?",
    hint: "Count: four, five... and then?",
  },
  "numeros-menor-08": {
    instruction: "Which number is the smallest?",
    hint: "The smallest is the tiniest one.",
  },
  "numeros-antes-3-09": {
    instruction: "Which number comes before three?",
    hint: "Count: one, two... and then?",
  },
  "numeros-mas-flores-10": {
    instruction: "Tap the group with more flowers.",
    hint: "Look for where there are lots of little flowers.",
  },
  "numeros-ocho-17": {
    instruction: "Tap the number eight.",
    hint: "Eight is two little circles, one on top of the other.",
  },
  "numeros-menos-manzanas-18": {
    instruction: "Tap the group with fewer apples.",
    hint: "Fewer is where there are only a few.",
  },
  "numeros-despues-8-19": {
    instruction: "Which number comes after eight?",
    hint: "Count: seven, eight, and keep going...",
  },
  "numeros-seis-estrellas-20": {
    instruction: "Tap the group with six stars.",
    hint: "Count on from five: five and one more.",
  },

  // ─── COLORS ─────────────────────────────────────────────────
  "colores-fruta-roja-01": {
    instruction: "Tap the red fruit.",
    hint: "It's red like a heart.",
  },
  "colores-corazon-azul-02": {
    instruction: "Tap the blue heart.",
    hint: "Blue like the sky.",
  },
  "colores-animal-verde-03": {
    instruction: "Tap the green animal.",
    hint: "Green like the grass, and it hops!",
  },
  "colores-animal-azul-11": {
    instruction: "Tap the blue animal.",
    hint: "Blue, and it lives in the water.",
  },
  "colores-circulo-rojo-12": {
    instruction: "Tap the red circle.",
    hint: "Red like an apple.",
  },
  "colores-animal-negro-13": {
    instruction: "Tap the black animal.",
    hint: "Black like the night, and it says meow.",
  },
  "colores-fruta-amarilla-04": {
    instruction: "Tap the yellow fruit.",
    hint: "Yellow like the sun.",
  },
  "colores-circulo-verde-05": {
    instruction: "Tap the green circle.",
    hint: "Green like the leaves.",
  },
  "colores-flor-roja-06": {
    instruction: "Tap the red flower.",
    hint: "Red like an apple.",
  },
  "colores-animal-rosado-07": {
    instruction: "Tap the pink animal.",
    hint: "It's pink and it has long legs.",
  },
  "colores-cuadrado-naranja-14": {
    instruction: "Tap the orange square.",
    hint: "Orange like the fruit with the same name.",
  },
  "colores-verdura-naranja-15": {
    instruction: "Tap the orange vegetable.",
    hint: "Rabbits love them.",
  },
  "colores-corazon-morado-16": {
    instruction: "Tap the purple heart.",
    hint: "Purple like grapes.",
  },
  "colores-cuadrado-amarillo-08": {
    instruction: "Tap the yellow square.",
    hint: "Yellow like a banana.",
  },
  "colores-fruta-morada-09": {
    instruction: "Tap the purple fruit.",
    hint: "They're small and they grow in a bunch.",
  },
  "colores-corazon-verde-10": {
    instruction: "Tap the green heart.",
    hint: "Green like a frog.",
  },
  "colores-blanco-17": {
    instruction: "Tap the one that is white.",
    hint: "White like milk, and it's up in the sky.",
  },
  "colores-animal-cafe-18": {
    instruction: "Tap the brown animal.",
    hint: "Brown like chocolate, and it's big.",
  },
  "colores-circulo-rosado-19": {
    instruction: "Tap the pink circle.",
    hint: "Pink is a light red, like the flamingo.",
  },
  "colores-cuadrado-negro-20": {
    instruction: "Tap the black square.",
    hint: "Black like the night.",
  },
};

type OptionCopy = Partial<Pick<QuestionOption, "label">> &
  Pick<QuestionOption, "alt">;

/**
 * Las figuras de color y los grupos de contar entran aquí **sin `label`**, y
 * no por descuido: en español tampoco lo llevan. Escribir "Green" bajo el
 * círculo verde, o "4" bajo cuatro manzanas, pondría la respuesta en la
 * opción. Ver `QuestionOption.label` en `questions.ts`.
 */
export const englishOptions: Record<string, OptionCopy> = {
  // Lugares
  playa: { label: "Beach", alt: "Beach with sea and an umbrella" },
  desierto: { label: "Desert", alt: "Desert with a cactus" },
  ciudad: { label: "City", alt: "City with buildings" },
  casa: { label: "House", alt: "House with a red roof" },
  hospital: { label: "Hospital", alt: "Hospital with a cross" },
  montana: { label: "Mountain", alt: "Mountain with snow" },
  selva: { label: "Jungle", alt: "Jungle with green trees" },
  escuela: { label: "School", alt: "School with a flag" },
  granja: { label: "Farm", alt: "Farm with a red barn and a cow" },
  parque: { label: "Park", alt: "Park with swings and a slide" },
  tienda: { label: "Store", alt: "Store with a striped awning" },

  // Números: los numerales sí llevan etiqueta, porque la etiqueta ES el
  // numeral que se pregunta. Los grupos no.
  n1: { alt: "Number one" },
  n2: { alt: "Number two" },
  n3: { alt: "Number three" },
  n4: { alt: "Number four" },
  n5: { alt: "Number five" },
  n6: { alt: "Number six" },
  n7: { alt: "Number seven" },
  n8: { alt: "Number eight" },
  n9: { alt: "Number nine" },
  n10: { alt: "Number ten" },
  "una-manzana": { alt: "One apple" },
  "dos-manzanas": { alt: "Two apples" },
  "tres-manzanas": { alt: "Three apples" },
  "cuatro-manzanas": { alt: "Four apples" },
  "dos-perritos": { alt: "Two puppies" },
  "tres-perritos": { alt: "Three puppies" },
  "cuatro-perritos": { alt: "Four puppies" },
  "cinco-perritos": { alt: "Five puppies" },
  "una-estrella": { alt: "One star" },
  "dos-estrellas": { alt: "Two stars" },
  "tres-estrellas": { alt: "Three stars" },
  "cuatro-estrellas": { alt: "Four stars" },
  "cinco-estrellas": { alt: "Five stars" },
  "seis-estrellas": { alt: "Six stars" },
  "ocho-estrellas": { alt: "Eight stars" },
  "una-flor": { alt: "One flower" },
  "dos-flores": { alt: "Two flowers" },
  "tres-flores": { alt: "Three flowers" },
  "cuatro-flores": { alt: "Four flowers" },

  // Colores: objetos con nombre, figuras sin él.
  manzana: { label: "Apple", alt: "Red apple" },
  banano: { label: "Banana", alt: "Yellow banana" },
  uvas: { label: "Grapes", alt: "Purple grapes" },
  naranja: { label: "Orange", alt: "Orange fruit" },
  zanahoria: { label: "Carrot", alt: "Orange carrot" },
  rana: { label: "Frog", alt: "Green frog" },
  flamenco: { label: "Flamingo", alt: "Pink flamingo" },
  oso: { label: "Bear", alt: "Brown bear" },
  pez: { label: "Fish", alt: "Blue fish" },
  gato: { label: "Cat", alt: "Black cat" },
  nube: { label: "Cloud", alt: "White cloud" },
  rosa: { label: "Rose", alt: "Red rose" },
  girasol: { label: "Sunflower", alt: "Yellow sunflower" },
  margarita: { label: "Daisy", alt: "White daisy" },

  "corazon-rojo": { alt: "Red heart" },
  "corazon-azul": { alt: "Blue heart" },
  "corazon-verde": { alt: "Green heart" },
  "corazon-amarillo": { alt: "Yellow heart" },
  "corazon-morado": { alt: "Purple heart" },
  "corazon-rosado": { alt: "Pink heart" },
  "circulo-rojo": { alt: "Red circle" },
  "circulo-azul": { alt: "Blue circle" },
  "circulo-verde": { alt: "Green circle" },
  "circulo-amarillo": { alt: "Yellow circle" },
  "circulo-morado": { alt: "Purple circle" },
  "circulo-rosado": { alt: "Pink circle" },
  "circulo-naranja": { alt: "Orange circle" },
  "cuadrado-rojo": { alt: "Red square" },
  "cuadrado-azul": { alt: "Blue square" },
  "cuadrado-verde": { alt: "Green square" },
  "cuadrado-amarillo": { alt: "Yellow square" },
  "cuadrado-naranja": { alt: "Orange square" },
  "cuadrado-morado": { alt: "Purple square" },
  "cuadrado-negro": { alt: "Black square" },
  "cuadrado-cafe": { alt: "Brown square" },
};

export function localizeHexagon(
  hexagon: Hexagon,
  language: Language,
): Hexagon {
  if (language === "es") return hexagon;
  return { ...hexagon, ...englishHexagons[hexagon.id] };
}

export function localizeQuestion(
  question: Question,
  language: Language,
): Question {
  if (language === "es") return question;

  const copy = englishQuestions[question.id];
  if (!copy) return question;

  return {
    ...question,
    ...copy,
    options: question.options.map((option) => ({
      ...option,
      ...englishOptions[option.id],
    })),
  };
}
