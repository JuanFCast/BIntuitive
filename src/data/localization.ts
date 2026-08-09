import type { Category } from "./categories";
import type { CategoryId, Question, QuestionOption } from "./questions";
import type { Language } from "@/lib/language";

const englishCategories: Record<
  CategoryId,
  Pick<Category, "name" | "description">
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
};

type QuestionCopy = {
  instruction: string;
  hint?: string;
};

const englishQuestions: Record<string, QuestionCopy> = {
  "lugares-desierto-01": {
    instruction: "Touch the place with lots of sand and no water.",
    hint: "Look for the dry place with a cactus.",
  },
  "lugares-playa-02": {
    instruction: "Touch the place with the sea and sand.",
    hint: "Look for the blue water.",
  },
  "lugares-casa-03": {
    instruction: "Touch the place where you sleep with your family.",
    hint: "It is where your bed is.",
  },
  "lugares-montana-04": {
    instruction: "Touch the very high place with snow.",
    hint: "Look for the white part on top. It's snow!",
  },
  "lugares-selva-05": {
    instruction: "Touch the place with many trees and wild animals.",
    hint: "Look for the green place with trees.",
  },
  "lugares-granja-06": {
    instruction: "Touch the place where cows and chickens live.",
    hint: "Look for the tractor in the countryside.",
  },
  "lugares-escuela-07": {
    instruction: "Touch the place where children learn.",
    hint: "There are boards and notebooks there.",
  },
  "lugares-hospital-08": {
    instruction: "Touch the place where doctors care for people.",
    hint: "Look for the doctor's cross.",
  },
  "lugares-parque-09": {
    instruction: "Touch the place with swings for playing.",
    hint: "Look for the playground slide.",
  },
  "lugares-ciudad-10": {
    instruction: "Touch the place with many buildings and cars.",
    hint: "Look for the tall buildings.",
  },
  "numeros-cinco-01": {
    instruction: "Touch the number five.",
    hint: "The five has a little hat on top.",
  },
  "numeros-mas-manzanas-02": {
    instruction: "Touch the group with more apples.",
    hint: "More means the group with many.",
  },
  "numeros-dos-perritos-03": {
    instruction: "Touch the group with two puppies.",
    hint: "Count slowly: one, two.",
  },
  "numeros-mayor-04": {
    instruction: "Which number is greater?",
    hint: "The greater number is the biggest of all.",
  },
  "numeros-despues-4-05": {
    instruction: "Which number comes after four?",
    hint: "Count: three, four, and keep going...",
  },
  "numeros-tres-estrellas-06": {
    instruction: "Touch the group with three stars.",
    hint: "Count: one, two, three.",
  },
  "numeros-siete-07": {
    instruction: "Touch the number seven.",
    hint: "The seven looks like a slide.",
  },
  "numeros-menor-08": {
    instruction: "Which number is smaller?",
    hint: "The smaller number is the tiniest.",
  },
  "numeros-antes-3-09": {
    instruction: "Which number comes before three?",
    hint: "Count: one, two... what comes next?",
  },
  "numeros-mas-flores-10": {
    instruction: "Touch the group with more flowers.",
    hint: "Look for the group with lots of little flowers.",
  },
  "colores-fruta-roja-01": {
    instruction: "Touch the red fruit.",
    hint: "It is red like a heart.",
  },
  "colores-corazon-azul-02": {
    instruction: "Touch the blue heart.",
    hint: "Blue like the sky.",
  },
  "colores-animal-verde-03": {
    instruction: "Touch the green animal.",
    hint: "Green like the grass, and it jumps!",
  },
  "colores-fruta-amarilla-04": {
    instruction: "Touch the yellow fruit.",
    hint: "Yellow like the sun.",
  },
  "colores-circulo-verde-05": {
    instruction: "Touch the green circle.",
    hint: "Green like the leaves.",
  },
  "colores-flor-roja-06": {
    instruction: "Touch the red flower.",
    hint: "Red like an apple.",
  },
  "colores-animal-rosado-07": {
    instruction: "Touch the pink animal.",
    hint: "It has long legs and is pink.",
  },
  "colores-cuadrado-amarillo-08": {
    instruction: "Touch the yellow square.",
    hint: "Yellow like a banana.",
  },
  "colores-fruta-morada-09": {
    instruction: "Touch the purple fruit.",
    hint: "They are small and come in a bunch.",
  },
  "colores-corazon-verde-10": {
    instruction: "Touch the green heart.",
    hint: "Green like a frog.",
  },
};

type OptionCopy = Partial<Pick<QuestionOption, "label">> &
  Pick<QuestionOption, "alt">;

const englishOptions: Record<string, OptionCopy> = {
  playa: { label: "Beach", alt: "Beach with sea and an umbrella" },
  desierto: { label: "Desert", alt: "Desert with a cactus" },
  ciudad: { label: "City", alt: "City with buildings" },
  casa: { label: "Home", alt: "Home with a red roof" },
  hospital: { label: "Hospital", alt: "Hospital with a cross" },
  montana: { label: "Mountain", alt: "Mountain with snow" },
  selva: { label: "Jungle", alt: "Jungle with green trees" },
  escuela: { label: "School", alt: "School with a flag" },
  granja: { label: "Farm", alt: "Farm with a tractor" },
  parque: { label: "Park", alt: "Park with a playground slide" },
  n1: { alt: "Number one" },
  n2: { alt: "Number two" },
  n3: { alt: "Number three" },
  n4: { alt: "Number four" },
  n5: { alt: "Number five" },
  n6: { alt: "Number six" },
  n7: { alt: "Number seven" },
  n8: { alt: "Number eight" },
  n9: { alt: "Number nine" },
  "una-manzana": { alt: "One apple" },
  "cuatro-manzanas": { alt: "Four apples" },
  "dos-perritos": { alt: "Two puppies" },
  "cuatro-perritos": { alt: "Four puppies" },
  "una-estrella": { alt: "One star" },
  "tres-estrellas": { alt: "Three stars" },
  "cinco-estrellas": { alt: "Five stars" },
  "una-flor": { alt: "One flower" },
  "dos-flores": { alt: "Two flowers" },
  "tres-flores": { alt: "Three flowers" },
  "cuatro-flores": { alt: "Four flowers" },
  manzana: { label: "Apple", alt: "Red apple" },
  banano: { label: "Banana", alt: "Yellow banana" },
  uvas: { label: "Grapes", alt: "Purple grapes" },
  naranja: { label: "Orange", alt: "Orange fruit" },
  "corazon-rojo": { label: "Red", alt: "Red heart" },
  "corazon-azul": { label: "Blue", alt: "Blue heart" },
  "corazon-verde": { label: "Green", alt: "Green heart" },
  "corazon-amarillo": { label: "Yellow", alt: "Yellow heart" },
  rana: { label: "Frog", alt: "Green frog" },
  flamenco: { label: "Flamingo", alt: "Pink flamingo" },
  oso: { label: "Bear", alt: "Brown bear" },
  "circulo-verde": { label: "Green", alt: "Green circle" },
  "circulo-rojo": { label: "Red", alt: "Red circle" },
  "circulo-amarillo": { label: "Yellow", alt: "Yellow circle" },
  rosa: { label: "Rose", alt: "Red rose" },
  girasol: { label: "Sunflower", alt: "Yellow sunflower" },
  margarita: { label: "Daisy", alt: "White daisy" },
  "cuadrado-amarillo": { label: "Yellow", alt: "Yellow square" },
  "cuadrado-azul": { label: "Blue", alt: "Blue square" },
  "cuadrado-rojo": { label: "Red", alt: "Red square" },
  "cuadrado-verde": { label: "Green", alt: "Green square" },
};

export function localizeCategory(
  category: Category,
  language: Language,
): Category {
  if (language === "es") return category;
  return { ...category, ...englishCategories[category.id] };
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
