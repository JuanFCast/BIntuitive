import type { Stars } from "./difficulty";
import { shuffle } from "./gameEngine";
import type { Language } from "./language";
import { getWordLetters, WORD_ALPHABET } from "./letters";

export const WORD_SCRAMBLE_WORDS_PER_SESSION = 10;
export const WORD_SCRAMBLE_MAX_LEVEL = 5;

export type WordScrambleLevel = 1 | 2 | 3 | 4 | 5;

/** Largo de las palabras del banco: 3-4, 5-6 y 7-8 letras. */
export type WordTier = 1 | 2 | 3;

/**
 * Qué es cada escalón. Se elige en la introducción y queda fijo toda la
 * partida, como en Trazos, Parejas y Colorear.
 *
 * Del 1 al 3 son los tres niveles que el juego tenía antes de la escala de
 * cinco, con las mismas palabras: quien llegó al 3 lo encuentra abierto y
 * con lo mismo que jugaba, así que no pierde nada al cambiar de modelo. El 4
 * y el 5 crecen cambiando de mecánica, no de largo —no hay palabras de nueve
 * letras que quepan en un móvil—: entre las fichas aparecen letras que no son
 * de la palabra, y en el 5 además desaparece el dibujo y queda solo la pista,
 * que hay que leer o escuchar.
 */
export const WORD_SCRAMBLE_LEVELS: Record<
  WordScrambleLevel,
  { tier: WordTier; extraLetters: number; showPicture: boolean }
> = {
  1: { tier: 1, extraLetters: 0, showPicture: true },
  2: { tier: 2, extraLetters: 0, showPicture: true },
  3: { tier: 3, extraLetters: 0, showPicture: true },
  4: { tier: 3, extraLetters: 2, showPicture: true },
  5: { tier: 3, extraLetters: 3, showPicture: false },
};

export function clampScrambleLevel(level: number): WordScrambleLevel {
  const rounded = Math.round(level);
  if (!(rounded >= 1)) return 1;
  if (rounded >= WORD_SCRAMBLE_MAX_LEVEL) return WORD_SCRAMBLE_MAX_LEVEL;
  return rounded as WordScrambleLevel;
}

/**
 * Cuántas palabras recuerda el juego entre partidas para no repetirlas: dos
 * partidas. Con menos, las palabras de la partida en curso echarían de la lista
 * a las de la anterior antes de terminar. Cada nivel del banco tiene al menos
 * estas más una partida entera, así que quien se queda en un nivel juega diez
 * palabras que no vio en las dos anteriores (`validate:content` lo comprueba).
 */
export const WORD_SCRAMBLE_RECENT_LIMIT = 20;

export type ScrambleWord = {
  id: string;
  /** Palabra objetivo en mayúsculas y con su ortografía real, en NFC. */
  word: string;
  emoji: string;
  clue: string;
  tier: WordTier;
};

export type LetterTile = {
  /** Único por ficha: la misma letra puede repetirse en una palabra. */
  id: string;
  letter: string;
};

/** Alfabeto admitido por idioma, con la ortografía real del español. */
export const WORD_SCRAMBLE_ALPHABET: Record<Language, RegExp> = WORD_ALPHABET;

/**
 * Separa la palabra en letras para las fichas. La implementación es compartida
 * (`letters.ts`) porque el manejo de Unicode no es propio de este juego: NFC,
 * nunca eliminación de diacríticos, y `Ñ`, `Ü` y las vocales acentuadas como
 * una única ficha cada una.
 */
export { getWordLetters };

export type WordScrambleStats = {
  solvedWords: number;
  perfectWords: number;
  mistakes: number;
  /** 0 a 1: toques correctos sobre el total de toques. */
  accuracy: number;
};

/**
 * Banco de palabras por idioma. No es una traducción: cada idioma tiene sus
 * propias palabras, elegidas para que sean cortas, concretas e ilustrables.
 *
 * Reglas del banco:
 * - `tier` 1: 3 y 4 letras · 2: 5 y 6 letras · 3: 7 y 8 letras. Es el largo
 *   de la palabra, no el escalón: los escalones 3, 4 y 5 usan las del 3.
 *   La longitud se cuenta en letras, no en bytes: "PINGÜINO" mide 8.
 * - Ortografía real: el español se escribe con `Á É Í Ó Ú Ñ Ü` cuando toca.
 *   Es una app educativa, así que nunca se simplifica una palabra para
 *   evitar un carácter (`ÁRBOL`, no `ARBOL`). Las palabras van en NFC.
 * - Sin palabras ambiguas: cada emoji debe sugerir una sola palabra posible.
 * - Al menos `WORD_SCRAMBLE_WORDS_PER_SESSION + WORD_SCRAMBLE_RECENT_LIMIT`
 *   palabras por largo e idioma, para que no se repitan entre partidas.
 */
const WORD_BANK: Record<Language, ScrambleWord[]> = {
  en: [
    { id: "en-sun", word: "SUN", emoji: "☀️", clue: "It shines in the sky during the day.", tier: 1 },
    { id: "en-cat", word: "CAT", emoji: "🐱", clue: "A pet that says meow.", tier: 1 },
    { id: "en-dog", word: "DOG", emoji: "🐶", clue: "A pet that says woof.", tier: 1 },
    { id: "en-star", word: "STAR", emoji: "⭐", clue: "It twinkles at night.", tier: 1 },
    { id: "en-fish", word: "FISH", emoji: "🐟", clue: "It swims in the water.", tier: 1 },
    { id: "en-tree", word: "TREE", emoji: "🌳", clue: "It is tall and full of leaves.", tier: 1 },
    { id: "en-moon", word: "MOON", emoji: "🌙", clue: "It lights up the night sky.", tier: 1 },
    { id: "en-cake", word: "CAKE", emoji: "🎂", clue: "You eat it on your birthday.", tier: 1 },
    { id: "en-frog", word: "FROG", emoji: "🐸", clue: "A green animal that jumps.", tier: 1 },
    { id: "en-milk", word: "MILK", emoji: "🥛", clue: "A white drink that comes from a cow.", tier: 1 },
    { id: "en-bee", word: "BEE", emoji: "🐝", clue: "A small insect that makes honey.", tier: 1 },
    { id: "en-cow", word: "COW", emoji: "🐄", clue: "A farm animal that says moo.", tier: 1 },
    { id: "en-pig", word: "PIG", emoji: "🐷", clue: "A pink farm animal that says oink.", tier: 1 },
    { id: "en-hat", word: "HAT", emoji: "🎩", clue: "You wear it on your head.", tier: 1 },
    { id: "en-bus", word: "BUS", emoji: "🚌", clue: "A big vehicle that carries many people.", tier: 1 },
    { id: "en-car", word: "CAR", emoji: "🚗", clue: "It has four wheels and someone drives it.", tier: 1 },
    { id: "en-egg", word: "EGG", emoji: "🥚", clue: "A hen lays it.", tier: 1 },
    { id: "en-key", word: "KEY", emoji: "🔑", clue: "It opens a door.", tier: 1 },
    { id: "en-bed", word: "BED", emoji: "🛏️", clue: "You sleep in it at night.", tier: 1 },
    { id: "en-owl", word: "OWL", emoji: "🦉", clue: "A bird that stays awake at night and says hoot.", tier: 1 },
    { id: "en-ant", word: "ANT", emoji: "🐜", clue: "A tiny insect that carries crumbs.", tier: 1 },
    { id: "en-book", word: "BOOK", emoji: "📖", clue: "It has pages for you to read.", tier: 1 },
    { id: "en-ball", word: "BALL", emoji: "⚽", clue: "You kick it or throw it to play.", tier: 1 },
    { id: "en-duck", word: "DUCK", emoji: "🦆", clue: "It swims in the pond and says quack.", tier: 1 },
    { id: "en-boat", word: "BOAT", emoji: "⛵", clue: "It floats on the water.", tier: 1 },
    { id: "en-bear", word: "BEAR", emoji: "🐻", clue: "A big furry animal that sleeps all winter.", tier: 1 },
    { id: "en-lion", word: "LION", emoji: "🦁", clue: "A big cat with a fluffy mane.", tier: 1 },
    { id: "en-sock", word: "SOCK", emoji: "🧦", clue: "You wear it on your foot, inside your shoe.", tier: 1 },
    { id: "en-drum", word: "DRUM", emoji: "🥁", clue: "You hit it to make music.", tier: 1 },
    { id: "en-kite", word: "KITE", emoji: "🪁", clue: "It flies in the wind on a long string.", tier: 1 },
    { id: "en-corn", word: "CORN", emoji: "🌽", clue: "A yellow vegetable that grows on a cob.", tier: 1 },
    { id: "en-snow", word: "SNOW", emoji: "❄️", clue: "Cold white flakes that fall in winter.", tier: 1 },
    { id: "en-house", word: "HOUSE", emoji: "🏠", clue: "The place where you live.", tier: 2 },
    { id: "en-apple", word: "APPLE", emoji: "🍎", clue: "A red fruit that grows on a tree.", tier: 2 },
    { id: "en-tiger", word: "TIGER", emoji: "🐯", clue: "A big cat with orange stripes.", tier: 2 },
    { id: "en-train", word: "TRAIN", emoji: "🚂", clue: "It travels on rails.", tier: 2 },
    { id: "en-flower", word: "FLOWER", emoji: "🌸", clue: "It grows in a garden and smells nice.", tier: 2 },
    { id: "en-pencil", word: "PENCIL", emoji: "✏️", clue: "You use it to write and draw.", tier: 2 },
    { id: "en-rocket", word: "ROCKET", emoji: "🚀", clue: "It flies into space.", tier: 2 },
    { id: "en-guitar", word: "GUITAR", emoji: "🎸", clue: "An instrument with six strings.", tier: 2 },
    { id: "en-banana", word: "BANANA", emoji: "🍌", clue: "A long yellow fruit.", tier: 2 },
    { id: "en-carrot", word: "CARROT", emoji: "🥕", clue: "An orange vegetable that rabbits love.", tier: 2 },
    { id: "en-zebra", word: "ZEBRA", emoji: "🦓", clue: "It looks like a horse with black and white stripes.", tier: 2 },
    { id: "en-horse", word: "HORSE", emoji: "🐴", clue: "A farm animal you can ride.", tier: 2 },
    { id: "en-snake", word: "SNAKE", emoji: "🐍", clue: "A long animal with no legs that hisses.", tier: 2 },
    { id: "en-mouse", word: "MOUSE", emoji: "🐭", clue: "A small animal that loves cheese.", tier: 2 },
    { id: "en-sheep", word: "SHEEP", emoji: "🐑", clue: "Its wool keeps you warm.", tier: 2 },
    { id: "en-clock", word: "CLOCK", emoji: "🕐", clue: "It tells you what time it is.", tier: 2 },
    { id: "en-pizza", word: "PIZZA", emoji: "🍕", clue: "A round food with cheese on top.", tier: 2 },
    { id: "en-bread", word: "BREAD", emoji: "🍞", clue: "You use it to make toast.", tier: 2 },
    { id: "en-grapes", word: "GRAPES", emoji: "🍇", clue: "Small round fruits that grow in a bunch.", tier: 2 },
    { id: "en-lemon", word: "LEMON", emoji: "🍋", clue: "A sour yellow fruit.", tier: 2 },
    { id: "en-cherry", word: "CHERRY", emoji: "🍒", clue: "A small red fruit with a stone inside.", tier: 2 },
    { id: "en-turtle", word: "TURTLE", emoji: "🐢", clue: "It walks slowly and carries its shell.", tier: 2 },
    { id: "en-rabbit", word: "RABBIT", emoji: "🐰", clue: "An animal with long ears that hops.", tier: 2 },
    { id: "en-monkey", word: "MONKEY", emoji: "🐵", clue: "It climbs trees and loves bananas.", tier: 2 },
    { id: "en-spider", word: "SPIDER", emoji: "🕷️", clue: "It has eight legs and spins a web.", tier: 2 },
    { id: "en-castle", word: "CASTLE", emoji: "🏰", clue: "A king and a queen live in it.", tier: 2 },
    { id: "en-cloud", word: "CLOUD", emoji: "☁️", clue: "It floats in the sky and brings rain.", tier: 2 },
    { id: "en-robot", word: "ROBOT", emoji: "🤖", clue: "A machine that can move and talk.", tier: 2 },
    { id: "en-candle", word: "CANDLE", emoji: "🕯️", clue: "You light it and it gives a little flame.", tier: 2 },
    { id: "en-planet", word: "PLANET", emoji: "🪐", clue: "A big round world in space, like Earth.", tier: 2 },
    { id: "en-rainbow", word: "RAINBOW", emoji: "🌈", clue: "Colors in the sky after the rain.", tier: 3 },
    { id: "en-penguin", word: "PENGUIN", emoji: "🐧", clue: "A black and white bird that cannot fly.", tier: 3 },
    { id: "en-dolphin", word: "DOLPHIN", emoji: "🐬", clue: "A clever animal that lives in the sea.", tier: 3 },
    { id: "en-balloon", word: "BALLOON", emoji: "🎈", clue: "It floats when you fill it with air.", tier: 3 },
    { id: "en-giraffe", word: "GIRAFFE", emoji: "🦒", clue: "The animal with the longest neck.", tier: 3 },
    { id: "en-elephant", word: "ELEPHANT", emoji: "🐘", clue: "A huge grey animal with a trunk.", tier: 3 },
    { id: "en-mountain", word: "MOUNTAIN", emoji: "🏔️", clue: "A very high place with snow on top.", tier: 3 },
    { id: "en-umbrella", word: "UMBRELLA", emoji: "☂️", clue: "It keeps you dry in the rain.", tier: 3 },
    { id: "en-airplane", word: "AIRPLANE", emoji: "✈️", clue: "It carries people through the sky.", tier: 3 },
    { id: "en-sandwich", word: "SANDWICH", emoji: "🥪", clue: "Bread with something tasty inside.", tier: 3 },
    { id: "en-octopus", word: "OCTOPUS", emoji: "🐙", clue: "A sea animal with eight arms.", tier: 3 },
    { id: "en-pumpkin", word: "PUMPKIN", emoji: "🎃", clue: "A big orange vegetable for Halloween.", tier: 3 },
    { id: "en-volcano", word: "VOLCANO", emoji: "🌋", clue: "A mountain that can spit hot lava.", tier: 3 },
    { id: "en-dinosaur", word: "DINOSAUR", emoji: "🦕", clue: "A giant animal that lived long, long ago.", tier: 3 },
    { id: "en-kangaroo", word: "KANGAROO", emoji: "🦘", clue: "It jumps and carries its baby in a pouch.", tier: 3 },
    { id: "en-chicken", word: "CHICKEN", emoji: "🐔", clue: "A farm bird that lays eggs.", tier: 3 },
    { id: "en-unicorn", word: "UNICORN", emoji: "🦄", clue: "A magic horse with one horn.", tier: 3 },
    { id: "en-ladybug", word: "LADYBUG", emoji: "🐞", clue: "A small red bug with black spots.", tier: 3 },
    { id: "en-snowman", word: "SNOWMAN", emoji: "☃️", clue: "You build it with snow in winter.", tier: 3 },
    { id: "en-tractor", word: "TRACTOR", emoji: "🚜", clue: "A farm machine that pulls heavy things.", tier: 3 },
    { id: "en-bicycle", word: "BICYCLE", emoji: "🚲", clue: "It has two wheels and pedals.", tier: 3 },
    { id: "en-cupcake", word: "CUPCAKE", emoji: "🧁", clue: "A little cake in a paper cup.", tier: 3 },
    { id: "en-popcorn", word: "POPCORN", emoji: "🍿", clue: "A snack you eat at the movies.", tier: 3 },
    { id: "en-broccoli", word: "BROCCOLI", emoji: "🥦", clue: "A green vegetable that looks like a tiny tree.", tier: 3 },
    { id: "en-scissors", word: "SCISSORS", emoji: "✂️", clue: "You use them to cut paper.", tier: 3 },
    { id: "en-hedgehog", word: "HEDGEHOG", emoji: "🦔", clue: "A small animal covered in spikes.", tier: 3 },
    { id: "en-flamingo", word: "FLAMINGO", emoji: "🦩", clue: "A pink bird that stands on one leg.", tier: 3 },
    { id: "en-peacock", word: "PEACOCK", emoji: "🦚", clue: "A bird with a big, colorful tail.", tier: 3 },
    { id: "en-squirrel", word: "SQUIRREL", emoji: "🐿️", clue: "It has a bushy tail and collects nuts.", tier: 3 },
    { id: "en-gorilla", word: "GORILLA", emoji: "🦍", clue: "A big, strong ape that beats its chest.", tier: 3 },
  ],
  es: [
    { id: "es-sol", word: "SOL", emoji: "☀️", clue: "Brilla en el cielo durante el día.", tier: 1 },
    { id: "es-pan", word: "PAN", emoji: "🍞", clue: "Se come en el desayuno.", tier: 1 },
    { id: "es-oso", word: "OSO", emoji: "🐻", clue: "Animal grande que vive en el bosque.", tier: 1 },
    { id: "es-luna", word: "LUNA", emoji: "🌙", clue: "Ilumina el cielo de noche.", tier: 1 },
    { id: "es-pato", word: "PATO", emoji: "🦆", clue: "Nada en el lago y hace cuac.", tier: 1 },
    { id: "es-casa", word: "CASA", emoji: "🏠", clue: "El lugar donde vives.", tier: 1 },
    { id: "es-gato", word: "GATO", emoji: "🐱", clue: "Mascota que hace miau.", tier: 1 },
    { id: "es-leon", word: "LEÓN", emoji: "🦁", clue: "Tiene melena y es el rey de la selva.", tier: 1 },
    { id: "es-pina", word: "PIÑA", emoji: "🍍", clue: "Fruta amarilla con corona de hojas.", tier: 1 },
    { id: "es-bebe", word: "BEBÉ", emoji: "👶", clue: "Persona muy pequeña que todavía no camina.", tier: 1 },
    { id: "es-pez", word: "PEZ", emoji: "🐟", clue: "Vive en el agua y nada con aletas.", tier: 1 },
    { id: "es-uva", word: "UVA", emoji: "🍇", clue: "Fruta pequeña y redonda que crece en racimos.", tier: 1 },
    { id: "es-ojo", word: "OJO", emoji: "👁️", clue: "Lo usas para ver.", tier: 1 },
    { id: "es-pie", word: "PIE", emoji: "🦶", clue: "Está al final de tu pierna y te sirve para caminar.", tier: 1 },
    { id: "es-rey", word: "REY", emoji: "🤴", clue: "Lleva corona y vive en un castillo.", tier: 1 },
    { id: "es-vaca", word: "VACA", emoji: "🐄", clue: "Animal de granja que hace mu.", tier: 1 },
    { id: "es-rana", word: "RANA", emoji: "🐸", clue: "Animal verde que salta y croa.", tier: 1 },
    { id: "es-cama", word: "CAMA", emoji: "🛏️", clue: "Duermes en ella por la noche.", tier: 1 },
    { id: "es-nube", word: "NUBE", emoji: "☁️", clue: "Flota en el cielo y trae la lluvia.", tier: 1 },
    { id: "es-loro", word: "LORO", emoji: "🦜", clue: "Pájaro de colores que repite lo que dices.", tier: 1 },
    { id: "es-bota", word: "BOTA", emoji: "👢", clue: "Zapato alto para los días de lluvia.", tier: 1 },
    { id: "es-dado", word: "DADO", emoji: "🎲", clue: "Tiene seis caras con puntos.", tier: 1 },
    { id: "es-rosa", word: "ROSA", emoji: "🌹", clue: "Flor roja con espinas en el tallo.", tier: 1 },
    { id: "es-mono", word: "MONO", emoji: "🐵", clue: "Trepa a los árboles y come plátanos.", tier: 1 },
    { id: "es-coco", word: "COCO", emoji: "🥥", clue: "Fruta dura por fuera con agua por dentro.", tier: 1 },
    { id: "es-tren", word: "TREN", emoji: "🚂", clue: "Viaja por las vías.", tier: 1 },
    { id: "es-hada", word: "HADA", emoji: "🧚", clue: "Personaje mágico y pequeño que tiene alas.", tier: 1 },
    { id: "es-miel", word: "MIEL", emoji: "🍯", clue: "Comida dulce que hacen las abejas.", tier: 1 },
    { id: "es-buho", word: "BÚHO", emoji: "🦉", clue: "Ave que está despierta de noche.", tier: 1 },
    { id: "es-sopa", word: "SOPA", emoji: "🍲", clue: "Comida caliente que se toma con cuchara.", tier: 1 },
    { id: "es-perro", word: "PERRO", emoji: "🐶", clue: "Mascota que hace guau.", tier: 2 },
    { id: "es-libro", word: "LIBRO", emoji: "📚", clue: "Tiene páginas para leer.", tier: 2 },
    { id: "es-globo", word: "GLOBO", emoji: "🎈", clue: "Flota cuando lo llenas de aire.", tier: 2 },
    { id: "es-queso", word: "QUESO", emoji: "🧀", clue: "Comida amarilla que sale de la leche.", tier: 2 },
    { id: "es-fresa", word: "FRESA", emoji: "🍓", clue: "Fruta roja, pequeña y dulce.", tier: 2 },
    { id: "es-conejo", word: "CONEJO", emoji: "🐰", clue: "Animal de orejas largas que salta.", tier: 2 },
    { id: "es-zapato", word: "ZAPATO", emoji: "👟", clue: "Se pone en el pie.", tier: 2 },
    { id: "es-arbol", word: "ÁRBOL", emoji: "🌳", clue: "Planta muy alta con tronco y muchas hojas.", tier: 2 },
    { id: "es-arana", word: "ARAÑA", emoji: "🕷️", clue: "Tiene ocho patas y teje una tela.", tier: 2 },
    { id: "es-sandia", word: "SANDÍA", emoji: "🍉", clue: "Fruta verde por fuera y roja por dentro.", tier: 2 },
    { id: "es-cerdo", word: "CERDO", emoji: "🐷", clue: "Animal rosado de granja que hace oinc.", tier: 2 },
    { id: "es-oveja", word: "OVEJA", emoji: "🐑", clue: "Su lana te abriga.", tier: 2 },
    { id: "es-tigre", word: "TIGRE", emoji: "🐯", clue: "Gato grande con rayas negras.", tier: 2 },
    { id: "es-cebra", word: "CEBRA", emoji: "🦓", clue: "Parece un caballo con rayas blancas y negras.", tier: 2 },
    { id: "es-raton", word: "RATÓN", emoji: "🐭", clue: "Animal pequeño al que le encanta el queso.", tier: 2 },
    { id: "es-camion", word: "CAMIÓN", emoji: "🚚", clue: "Vehículo grande que lleva carga.", tier: 2 },
    { id: "es-barco", word: "BARCO", emoji: "🚢", clue: "Navega por el mar.", tier: 2 },
    { id: "es-avion", word: "AVIÓN", emoji: "✈️", clue: "Lleva personas volando por el cielo.", tier: 2 },
    { id: "es-llave", word: "LLAVE", emoji: "🔑", clue: "Abre la puerta de la casa.", tier: 2 },
    { id: "es-pelota", word: "PELOTA", emoji: "⚽", clue: "Se patea o se lanza para jugar.", tier: 2 },
    { id: "es-limon", word: "LIMÓN", emoji: "🍋", clue: "Fruta amarilla y ácida.", tier: 2 },
    { id: "es-cereza", word: "CEREZA", emoji: "🍒", clue: "Fruta pequeña y roja con hueso.", tier: 2 },
    { id: "es-huevo", word: "HUEVO", emoji: "🥚", clue: "Lo pone la gallina.", tier: 2 },
    { id: "es-tambor", word: "TAMBOR", emoji: "🥁", clue: "Se golpea para hacer música.", tier: 2 },
    { id: "es-cohete", word: "COHETE", emoji: "🚀", clue: "Viaja al espacio.", tier: 2 },
    { id: "es-robot", word: "ROBOT", emoji: "🤖", clue: "Máquina que se mueve y habla.", tier: 2 },
    { id: "es-nieve", word: "NIEVE", emoji: "❄️", clue: "Copos blancos y fríos que caen en invierno.", tier: 2 },
    { id: "es-pizza", word: "PIZZA", emoji: "🍕", clue: "Comida redonda con queso encima.", tier: 2 },
    { id: "es-dragon", word: "DRAGÓN", emoji: "🐉", clue: "Animal de los cuentos que echa fuego.", tier: 2 },
    { id: "es-regalo", word: "REGALO", emoji: "🎁", clue: "Lo recibes en tu cumpleaños.", tier: 2 },
    { id: "es-delfin", word: "DELFÍN", emoji: "🐬", clue: "Animal listo que vive en el mar y salta.", tier: 2 },
    { id: "es-pulpo", word: "PULPO", emoji: "🐙", clue: "Animal del mar con ocho brazos.", tier: 2 },
    { id: "es-volcan", word: "VOLCÁN", emoji: "🌋", clue: "Montaña que puede echar lava caliente.", tier: 2 },
    { id: "es-gorila", word: "GORILA", emoji: "🦍", clue: "Mono grande y fuerte que se golpea el pecho.", tier: 2 },
    { id: "es-helado", word: "HELADO", emoji: "🍦", clue: "Postre frío que se derrite al sol.", tier: 2 },
    { id: "es-manzana", word: "MANZANA", emoji: "🍎", clue: "Fruta roja que crece en el árbol.", tier: 3 },
    { id: "es-caballo", word: "CABALLO", emoji: "🐴", clue: "Animal grande que corre y se monta.", tier: 3 },
    { id: "es-tortuga", word: "TORTUGA", emoji: "🐢", clue: "Camina despacio y carga su caparazón.", tier: 3 },
    { id: "es-montana", word: "MONTAÑA", emoji: "🏔️", clue: "Lugar muy alto con nieve en la punta.", tier: 3 },
    { id: "es-corazon", word: "CORAZÓN", emoji: "❤️", clue: "Late dentro de tu pecho.", tier: 3 },
    { id: "es-autobus", word: "AUTOBÚS", emoji: "🚌", clue: "Vehículo grande que lleva muchas personas.", tier: 3 },
    { id: "es-estrella", word: "ESTRELLA", emoji: "⭐", clue: "Brilla en el cielo de noche.", tier: 3 },
    { id: "es-elefante", word: "ELEFANTE", emoji: "🐘", clue: "Animal enorme con trompa larga.", tier: 3 },
    { id: "es-mariposa", word: "MARIPOSA", emoji: "🦋", clue: "Vuela y tiene alas de colores.", tier: 3 },
    { id: "es-pinguino", word: "PINGÜINO", emoji: "🐧", clue: "Ave blanca y negra que no vuela.", tier: 3 },
    { id: "es-gallina", word: "GALLINA", emoji: "🐔", clue: "Ave de granja que pone huevos.", tier: 3 },
    { id: "es-platano", word: "PLÁTANO", emoji: "🍌", clue: "Fruta larga y amarilla.", tier: 3 },
    { id: "es-castillo", word: "CASTILLO", emoji: "🏰", clue: "Allí viven el rey y la reina.", tier: 3 },
    { id: "es-cangrejo", word: "CANGREJO", emoji: "🦀", clue: "Camina de lado por la playa.", tier: 3 },
    { id: "es-calabaza", word: "CALABAZA", emoji: "🎃", clue: "Verdura grande y naranja.", tier: 3 },
    { id: "es-canguro", word: "CANGURO", emoji: "🦘", clue: "Salta y lleva a su cría en una bolsa.", tier: 3 },
    { id: "es-tractor", word: "TRACTOR", emoji: "🚜", clue: "Máquina de granja que tira de cosas pesadas.", tier: 3 },
    { id: "es-paraguas", word: "PARAGUAS", emoji: "☂️", clue: "Te protege de la lluvia.", tier: 3 },
    { id: "es-guitarra", word: "GUITARRA", emoji: "🎸", clue: "Instrumento con seis cuerdas.", tier: 3 },
    { id: "es-arcoiris", word: "ARCOÍRIS", emoji: "🌈", clue: "Colores en el cielo después de la lluvia.", tier: 3 },
    { id: "es-camello", word: "CAMELLO", emoji: "🐫", clue: "Animal del desierto con jorobas.", tier: 3 },
    { id: "es-tiburon", word: "TIBURÓN", emoji: "🦈", clue: "Pez grande con muchos dientes.", tier: 3 },
    { id: "es-ballena", word: "BALLENA", emoji: "🐋", clue: "El animal más grande del mar.", tier: 3 },
    { id: "es-hormiga", word: "HORMIGA", emoji: "🐜", clue: "Insecto pequeño que carga migas.", tier: 3 },
    { id: "es-caracol", word: "CARACOL", emoji: "🐌", clue: "Lleva su casa en la espalda y va muy despacio.", tier: 3 },
    { id: "es-telefono", word: "TELÉFONO", emoji: "📱", clue: "Lo usas para llamar a alguien.", tier: 3 },
    { id: "es-campana", word: "CAMPANA", emoji: "🔔", clue: "Suena din, don.", tier: 3 },
    { id: "es-cebolla", word: "CEBOLLA", emoji: "🧅", clue: "Verdura que te hace llorar al cortarla.", tier: 3 },
    { id: "es-ardilla", word: "ARDILLA", emoji: "🐿️", clue: "Tiene la cola peluda y guarda nueces.", tier: 3 },
    { id: "es-lagarto", word: "LAGARTO", emoji: "🦎", clue: "Reptil pequeño que toma el sol.", tier: 3 },
  ],
};

export function getWordBank(language: Language): ScrambleWord[] {
  return WORD_BANK[language];
}

/**
 * Elige la siguiente palabra del idioma actual, prefiriendo el largo pedido
 * (`tier`) y cayendo al más cercano cuando ya no quedan palabras sin usar.
 * `usedIds` acumula las palabras ya jugadas, así que ninguna se repite dentro
 * de una misma partida. Sigue el mismo criterio de selección que usa
 * `pickNextQuestion` en el motor de lecciones, aplicado a palabras.
 *
 * `recentIds` son las de partidas anteriores, de la más antigua a la más
 * reciente. Pesan menos que el largo: dentro de él se prefiere una que no
 * salió hace poco y, si ya salieron todas, la que lleva más tiempo sin salir.
 * Cambiar de largo para no repetir cambiaría la dificultad del escalón que se
 * eligió.
 */
export function pickNextWord(
  language: Language,
  tier: WordTier,
  usedIds: string[],
  recentIds: string[] = [],
): ScrambleWord | null {
  const available = WORD_BANK[language].filter(
    (candidate) => !usedIds.includes(candidate.id),
  );
  if (available.length === 0) return null;

  const sorted = [...available].sort(
    (a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier),
  );
  const bestDistance = Math.abs(sorted[0].tier - tier);
  const candidates = sorted.filter(
    (candidate) => Math.abs(candidate.tier - tier) === bestDistance,
  );

  const fresh = candidates.filter(
    (candidate) => !recentIds.includes(candidate.id),
  );
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  return candidates.reduce((oldest, candidate) =>
    recentIds.indexOf(candidate.id) < recentIds.indexOf(oldest.id)
      ? candidate
      : oldest,
  );
}

/**
 * Apunta una palabra recién jugada al final de las recientes y olvida las más
 * antiguas por encima de `WORD_SCRAMBLE_RECENT_LIMIT`.
 */
export function rememberScrambleWord(
  recentIds: string[],
  id: string,
): string[] {
  return [...recentIds.filter((recent) => recent !== id), id].slice(
    -WORD_SCRAMBLE_RECENT_LIMIT,
  );
}

/**
 * Letras de las que salen las que sobran en los escalones 4 y 5. Sin tildes ni
 * `Ñ` ni `Ü`: una ficha así destacaría entre las demás y se descartaría a
 * simple vista, sin pensar en la palabra.
 */
const EXTRA_LETTERS: Record<Language, string[]> = {
  en: getWordLetters("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  es: getWordLetters("ABCDEFGHIJLMNOPQRSTUVYZ"),
};

/**
 * Desordena las letras de la palabra. Cada ficha guarda su posición original
 * en el id para que las letras repetidas sigan siendo fichas distintas.
 *
 * `extraLetters` añade fichas que no son de la palabra (escalones 4 y 5).
 * Nunca repiten una letra que la palabra ya tiene: si lo hicieran, tocar la
 * que sobra contaría como acierto y la ficha de verdad se quedaría sin usar,
 * así que lo que se pide —distinguir qué letras forman la palabra— dejaría de
 * pedirse. Tocar una de las que sobran es un error, como cualquier letra que
 * no toca, y la palabra se termina sin usarlas.
 */
export function createLetterTiles(
  word: string,
  extraLetters = 0,
  language: Language = "en",
): LetterTile[] {
  const letters = getWordLetters(word);
  const solution = letters.join("");
  const extras = shuffle(
    EXTRA_LETTERS[language].filter((letter) => !letters.includes(letter)),
  )
    .slice(0, extraLetters)
    .map((letter, index) => ({ id: `extra-${index}-${letter}`, letter }));
  const tiles = [
    ...letters.map((letter, index) => ({
      id: `${index}-${letter}`,
      letter,
    })),
    ...extras,
  ];

  // Evita entregar la palabra ya resuelta, también con las que sobran
  // intercaladas; se rinde si todas las letras son iguales.
  const readsSolution = (order: LetterTile[]) =>
    order
      .filter((tile) => !tile.id.startsWith("extra-"))
      .map((tile) => tile.letter)
      .join("") === solution;
  let shuffled = shuffle(tiles);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!readsSolution(shuffled)) break;
    shuffled = shuffle(tiles);
  }
  return shuffled;
}

/**
 * La valoración de una partida terminada, de 0 a 3, por la precisión de los
 * toques (0 a 1). Dos estrellas abren el escalón siguiente.
 *
 * Una palabra de siete letras con un error es un 0,875, así que el 0,9 de las
 * tres estrellas deja unos siete errores en toda la partida: se puede fallar
 * y seguir siendo una partida excelente. Las letras que sobran en el 4 y el 5
 * no cambian la cuenta: tocar una es un error más, que es lo que deben ser.
 * Abandonar no llega a valorarse.
 */
export function scrambleSessionStars(accuracy: number): Stars {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.75) return 2;
  return 1;
}

export function computeWordScrambleStats(
  solvedWords: number,
  perfectWords: number,
  correctTaps: number,
  mistakes: number,
): WordScrambleStats {
  const totalTaps = correctTaps + mistakes;
  return {
    solvedWords,
    perfectWords,
    mistakes,
    accuracy: totalTaps === 0 ? 1 : correctTaps / totalTaps,
  };
}
