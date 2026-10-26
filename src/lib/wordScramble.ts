import { nextLevel, shuffle } from "./gameEngine";
import type { Language } from "./language";
import { getWordLetters, WORD_ALPHABET } from "./letters";

export const WORD_SCRAMBLE_WORDS_PER_SESSION = 10;
export const WORD_SCRAMBLE_MAX_LEVEL = 3;

/**
 * Cuántas palabras recuerda el juego entre partidas para no repetirlas: dos
 * partidas. Con menos, las palabras de la partida en curso echarían de la lista
 * a las de la anterior antes de terminar. Cada nivel del banco tiene al menos
 * estas más una partida entera, así que quien se queda en un nivel juega diez
 * palabras que no vio en las dos anteriores (`validate:content` lo comprueba).
 */
export const WORD_SCRAMBLE_RECENT_LIMIT = 20;

/** A partir de esta cantidad de errores en una palabra, el nivel baja. */
export const WORD_SCRAMBLE_DROP_MISTAKES = 3;

export type WordScrambleLevel = 1 | 2 | 3;

export type ScrambleWord = {
  id: string;
  /** Palabra objetivo en mayúsculas y con su ortografía real, en NFC. */
  word: string;
  emoji: string;
  clue: string;
  level: WordScrambleLevel;
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
 * - Nivel 1: 3 y 4 letras · Nivel 2: 5 y 6 letras · Nivel 3: 7 y 8 letras.
 *   La longitud se cuenta en letras, no en bytes: "PINGÜINO" mide 8.
 * - Ortografía real: el español se escribe con `Á É Í Ó Ú Ñ Ü` cuando toca.
 *   Es una app educativa, así que nunca se simplifica una palabra para
 *   evitar un carácter (`ÁRBOL`, no `ARBOL`). Las palabras van en NFC.
 * - Sin palabras ambiguas: cada emoji debe sugerir una sola palabra posible.
 * - Al menos `WORD_SCRAMBLE_WORDS_PER_SESSION + WORD_SCRAMBLE_RECENT_LIMIT`
 *   palabras por nivel e idioma, para que no se repitan entre partidas.
 */
const WORD_BANK: Record<Language, ScrambleWord[]> = {
  en: [
    { id: "en-sun", word: "SUN", emoji: "☀️", clue: "It shines in the sky during the day.", level: 1 },
    { id: "en-cat", word: "CAT", emoji: "🐱", clue: "A pet that says meow.", level: 1 },
    { id: "en-dog", word: "DOG", emoji: "🐶", clue: "A pet that says woof.", level: 1 },
    { id: "en-star", word: "STAR", emoji: "⭐", clue: "It twinkles at night.", level: 1 },
    { id: "en-fish", word: "FISH", emoji: "🐟", clue: "It swims in the water.", level: 1 },
    { id: "en-tree", word: "TREE", emoji: "🌳", clue: "It is tall and full of leaves.", level: 1 },
    { id: "en-moon", word: "MOON", emoji: "🌙", clue: "It lights up the night sky.", level: 1 },
    { id: "en-cake", word: "CAKE", emoji: "🎂", clue: "You eat it on your birthday.", level: 1 },
    { id: "en-frog", word: "FROG", emoji: "🐸", clue: "A green animal that jumps.", level: 1 },
    { id: "en-milk", word: "MILK", emoji: "🥛", clue: "A white drink that comes from a cow.", level: 1 },
    { id: "en-bee", word: "BEE", emoji: "🐝", clue: "A small insect that makes honey.", level: 1 },
    { id: "en-cow", word: "COW", emoji: "🐄", clue: "A farm animal that says moo.", level: 1 },
    { id: "en-pig", word: "PIG", emoji: "🐷", clue: "A pink farm animal that says oink.", level: 1 },
    { id: "en-hat", word: "HAT", emoji: "🎩", clue: "You wear it on your head.", level: 1 },
    { id: "en-bus", word: "BUS", emoji: "🚌", clue: "A big vehicle that carries many people.", level: 1 },
    { id: "en-car", word: "CAR", emoji: "🚗", clue: "It has four wheels and someone drives it.", level: 1 },
    { id: "en-egg", word: "EGG", emoji: "🥚", clue: "A hen lays it.", level: 1 },
    { id: "en-key", word: "KEY", emoji: "🔑", clue: "It opens a door.", level: 1 },
    { id: "en-bed", word: "BED", emoji: "🛏️", clue: "You sleep in it at night.", level: 1 },
    { id: "en-owl", word: "OWL", emoji: "🦉", clue: "A bird that stays awake at night and says hoot.", level: 1 },
    { id: "en-ant", word: "ANT", emoji: "🐜", clue: "A tiny insect that carries crumbs.", level: 1 },
    { id: "en-book", word: "BOOK", emoji: "📖", clue: "It has pages for you to read.", level: 1 },
    { id: "en-ball", word: "BALL", emoji: "⚽", clue: "You kick it or throw it to play.", level: 1 },
    { id: "en-duck", word: "DUCK", emoji: "🦆", clue: "It swims in the pond and says quack.", level: 1 },
    { id: "en-boat", word: "BOAT", emoji: "⛵", clue: "It floats on the water.", level: 1 },
    { id: "en-bear", word: "BEAR", emoji: "🐻", clue: "A big furry animal that sleeps all winter.", level: 1 },
    { id: "en-lion", word: "LION", emoji: "🦁", clue: "A big cat with a fluffy mane.", level: 1 },
    { id: "en-sock", word: "SOCK", emoji: "🧦", clue: "You wear it on your foot, inside your shoe.", level: 1 },
    { id: "en-drum", word: "DRUM", emoji: "🥁", clue: "You hit it to make music.", level: 1 },
    { id: "en-kite", word: "KITE", emoji: "🪁", clue: "It flies in the wind on a long string.", level: 1 },
    { id: "en-corn", word: "CORN", emoji: "🌽", clue: "A yellow vegetable that grows on a cob.", level: 1 },
    { id: "en-snow", word: "SNOW", emoji: "❄️", clue: "Cold white flakes that fall in winter.", level: 1 },
    { id: "en-house", word: "HOUSE", emoji: "🏠", clue: "The place where you live.", level: 2 },
    { id: "en-apple", word: "APPLE", emoji: "🍎", clue: "A red fruit that grows on a tree.", level: 2 },
    { id: "en-tiger", word: "TIGER", emoji: "🐯", clue: "A big cat with orange stripes.", level: 2 },
    { id: "en-train", word: "TRAIN", emoji: "🚂", clue: "It travels on rails.", level: 2 },
    { id: "en-flower", word: "FLOWER", emoji: "🌸", clue: "It grows in a garden and smells nice.", level: 2 },
    { id: "en-pencil", word: "PENCIL", emoji: "✏️", clue: "You use it to write and draw.", level: 2 },
    { id: "en-rocket", word: "ROCKET", emoji: "🚀", clue: "It flies into space.", level: 2 },
    { id: "en-guitar", word: "GUITAR", emoji: "🎸", clue: "An instrument with six strings.", level: 2 },
    { id: "en-banana", word: "BANANA", emoji: "🍌", clue: "A long yellow fruit.", level: 2 },
    { id: "en-carrot", word: "CARROT", emoji: "🥕", clue: "An orange vegetable that rabbits love.", level: 2 },
    { id: "en-zebra", word: "ZEBRA", emoji: "🦓", clue: "It looks like a horse with black and white stripes.", level: 2 },
    { id: "en-horse", word: "HORSE", emoji: "🐴", clue: "A farm animal you can ride.", level: 2 },
    { id: "en-snake", word: "SNAKE", emoji: "🐍", clue: "A long animal with no legs that hisses.", level: 2 },
    { id: "en-mouse", word: "MOUSE", emoji: "🐭", clue: "A small animal that loves cheese.", level: 2 },
    { id: "en-sheep", word: "SHEEP", emoji: "🐑", clue: "Its wool keeps you warm.", level: 2 },
    { id: "en-clock", word: "CLOCK", emoji: "🕐", clue: "It tells you what time it is.", level: 2 },
    { id: "en-pizza", word: "PIZZA", emoji: "🍕", clue: "A round food with cheese on top.", level: 2 },
    { id: "en-bread", word: "BREAD", emoji: "🍞", clue: "You use it to make toast.", level: 2 },
    { id: "en-grapes", word: "GRAPES", emoji: "🍇", clue: "Small round fruits that grow in a bunch.", level: 2 },
    { id: "en-lemon", word: "LEMON", emoji: "🍋", clue: "A sour yellow fruit.", level: 2 },
    { id: "en-cherry", word: "CHERRY", emoji: "🍒", clue: "A small red fruit with a stone inside.", level: 2 },
    { id: "en-turtle", word: "TURTLE", emoji: "🐢", clue: "It walks slowly and carries its shell.", level: 2 },
    { id: "en-rabbit", word: "RABBIT", emoji: "🐰", clue: "An animal with long ears that hops.", level: 2 },
    { id: "en-monkey", word: "MONKEY", emoji: "🐵", clue: "It climbs trees and loves bananas.", level: 2 },
    { id: "en-spider", word: "SPIDER", emoji: "🕷️", clue: "It has eight legs and spins a web.", level: 2 },
    { id: "en-castle", word: "CASTLE", emoji: "🏰", clue: "A king and a queen live in it.", level: 2 },
    { id: "en-cloud", word: "CLOUD", emoji: "☁️", clue: "It floats in the sky and brings rain.", level: 2 },
    { id: "en-robot", word: "ROBOT", emoji: "🤖", clue: "A machine that can move and talk.", level: 2 },
    { id: "en-candle", word: "CANDLE", emoji: "🕯️", clue: "You light it and it gives a little flame.", level: 2 },
    { id: "en-planet", word: "PLANET", emoji: "🪐", clue: "A big round world in space, like Earth.", level: 2 },
    { id: "en-rainbow", word: "RAINBOW", emoji: "🌈", clue: "Colors in the sky after the rain.", level: 3 },
    { id: "en-penguin", word: "PENGUIN", emoji: "🐧", clue: "A black and white bird that cannot fly.", level: 3 },
    { id: "en-dolphin", word: "DOLPHIN", emoji: "🐬", clue: "A clever animal that lives in the sea.", level: 3 },
    { id: "en-balloon", word: "BALLOON", emoji: "🎈", clue: "It floats when you fill it with air.", level: 3 },
    { id: "en-giraffe", word: "GIRAFFE", emoji: "🦒", clue: "The animal with the longest neck.", level: 3 },
    { id: "en-elephant", word: "ELEPHANT", emoji: "🐘", clue: "A huge grey animal with a trunk.", level: 3 },
    { id: "en-mountain", word: "MOUNTAIN", emoji: "🏔️", clue: "A very high place with snow on top.", level: 3 },
    { id: "en-umbrella", word: "UMBRELLA", emoji: "☂️", clue: "It keeps you dry in the rain.", level: 3 },
    { id: "en-airplane", word: "AIRPLANE", emoji: "✈️", clue: "It carries people through the sky.", level: 3 },
    { id: "en-sandwich", word: "SANDWICH", emoji: "🥪", clue: "Bread with something tasty inside.", level: 3 },
    { id: "en-octopus", word: "OCTOPUS", emoji: "🐙", clue: "A sea animal with eight arms.", level: 3 },
    { id: "en-pumpkin", word: "PUMPKIN", emoji: "🎃", clue: "A big orange vegetable for Halloween.", level: 3 },
    { id: "en-volcano", word: "VOLCANO", emoji: "🌋", clue: "A mountain that can spit hot lava.", level: 3 },
    { id: "en-dinosaur", word: "DINOSAUR", emoji: "🦕", clue: "A giant animal that lived long, long ago.", level: 3 },
    { id: "en-kangaroo", word: "KANGAROO", emoji: "🦘", clue: "It jumps and carries its baby in a pouch.", level: 3 },
    { id: "en-chicken", word: "CHICKEN", emoji: "🐔", clue: "A farm bird that lays eggs.", level: 3 },
    { id: "en-unicorn", word: "UNICORN", emoji: "🦄", clue: "A magic horse with one horn.", level: 3 },
    { id: "en-ladybug", word: "LADYBUG", emoji: "🐞", clue: "A small red bug with black spots.", level: 3 },
    { id: "en-snowman", word: "SNOWMAN", emoji: "☃️", clue: "You build it with snow in winter.", level: 3 },
    { id: "en-tractor", word: "TRACTOR", emoji: "🚜", clue: "A farm machine that pulls heavy things.", level: 3 },
    { id: "en-bicycle", word: "BICYCLE", emoji: "🚲", clue: "It has two wheels and pedals.", level: 3 },
    { id: "en-cupcake", word: "CUPCAKE", emoji: "🧁", clue: "A little cake in a paper cup.", level: 3 },
    { id: "en-popcorn", word: "POPCORN", emoji: "🍿", clue: "A snack you eat at the movies.", level: 3 },
    { id: "en-broccoli", word: "BROCCOLI", emoji: "🥦", clue: "A green vegetable that looks like a tiny tree.", level: 3 },
    { id: "en-scissors", word: "SCISSORS", emoji: "✂️", clue: "You use them to cut paper.", level: 3 },
    { id: "en-hedgehog", word: "HEDGEHOG", emoji: "🦔", clue: "A small animal covered in spikes.", level: 3 },
    { id: "en-flamingo", word: "FLAMINGO", emoji: "🦩", clue: "A pink bird that stands on one leg.", level: 3 },
    { id: "en-peacock", word: "PEACOCK", emoji: "🦚", clue: "A bird with a big, colorful tail.", level: 3 },
    { id: "en-squirrel", word: "SQUIRREL", emoji: "🐿️", clue: "It has a bushy tail and collects nuts.", level: 3 },
    { id: "en-gorilla", word: "GORILLA", emoji: "🦍", clue: "A big, strong ape that beats its chest.", level: 3 },
  ],
  es: [
    { id: "es-sol", word: "SOL", emoji: "☀️", clue: "Brilla en el cielo durante el día.", level: 1 },
    { id: "es-pan", word: "PAN", emoji: "🍞", clue: "Se come en el desayuno.", level: 1 },
    { id: "es-oso", word: "OSO", emoji: "🐻", clue: "Animal grande que vive en el bosque.", level: 1 },
    { id: "es-luna", word: "LUNA", emoji: "🌙", clue: "Ilumina el cielo de noche.", level: 1 },
    { id: "es-pato", word: "PATO", emoji: "🦆", clue: "Nada en el lago y hace cuac.", level: 1 },
    { id: "es-casa", word: "CASA", emoji: "🏠", clue: "El lugar donde vives.", level: 1 },
    { id: "es-gato", word: "GATO", emoji: "🐱", clue: "Mascota que hace miau.", level: 1 },
    { id: "es-leon", word: "LEÓN", emoji: "🦁", clue: "Tiene melena y es el rey de la selva.", level: 1 },
    { id: "es-pina", word: "PIÑA", emoji: "🍍", clue: "Fruta amarilla con corona de hojas.", level: 1 },
    { id: "es-bebe", word: "BEBÉ", emoji: "👶", clue: "Persona muy pequeña que todavía no camina.", level: 1 },
    { id: "es-pez", word: "PEZ", emoji: "🐟", clue: "Vive en el agua y nada con aletas.", level: 1 },
    { id: "es-uva", word: "UVA", emoji: "🍇", clue: "Fruta pequeña y redonda que crece en racimos.", level: 1 },
    { id: "es-ojo", word: "OJO", emoji: "👁️", clue: "Lo usas para ver.", level: 1 },
    { id: "es-pie", word: "PIE", emoji: "🦶", clue: "Está al final de tu pierna y te sirve para caminar.", level: 1 },
    { id: "es-rey", word: "REY", emoji: "🤴", clue: "Lleva corona y vive en un castillo.", level: 1 },
    { id: "es-vaca", word: "VACA", emoji: "🐄", clue: "Animal de granja que hace mu.", level: 1 },
    { id: "es-rana", word: "RANA", emoji: "🐸", clue: "Animal verde que salta y croa.", level: 1 },
    { id: "es-cama", word: "CAMA", emoji: "🛏️", clue: "Duermes en ella por la noche.", level: 1 },
    { id: "es-nube", word: "NUBE", emoji: "☁️", clue: "Flota en el cielo y trae la lluvia.", level: 1 },
    { id: "es-loro", word: "LORO", emoji: "🦜", clue: "Pájaro de colores que repite lo que dices.", level: 1 },
    { id: "es-bota", word: "BOTA", emoji: "👢", clue: "Zapato alto para los días de lluvia.", level: 1 },
    { id: "es-dado", word: "DADO", emoji: "🎲", clue: "Tiene seis caras con puntos.", level: 1 },
    { id: "es-rosa", word: "ROSA", emoji: "🌹", clue: "Flor roja con espinas en el tallo.", level: 1 },
    { id: "es-mono", word: "MONO", emoji: "🐵", clue: "Trepa a los árboles y come plátanos.", level: 1 },
    { id: "es-coco", word: "COCO", emoji: "🥥", clue: "Fruta dura por fuera con agua por dentro.", level: 1 },
    { id: "es-tren", word: "TREN", emoji: "🚂", clue: "Viaja por las vías.", level: 1 },
    { id: "es-hada", word: "HADA", emoji: "🧚", clue: "Personaje mágico y pequeño que tiene alas.", level: 1 },
    { id: "es-miel", word: "MIEL", emoji: "🍯", clue: "Comida dulce que hacen las abejas.", level: 1 },
    { id: "es-buho", word: "BÚHO", emoji: "🦉", clue: "Ave que está despierta de noche.", level: 1 },
    { id: "es-sopa", word: "SOPA", emoji: "🍲", clue: "Comida caliente que se toma con cuchara.", level: 1 },
    { id: "es-perro", word: "PERRO", emoji: "🐶", clue: "Mascota que hace guau.", level: 2 },
    { id: "es-libro", word: "LIBRO", emoji: "📚", clue: "Tiene páginas para leer.", level: 2 },
    { id: "es-globo", word: "GLOBO", emoji: "🎈", clue: "Flota cuando lo llenas de aire.", level: 2 },
    { id: "es-queso", word: "QUESO", emoji: "🧀", clue: "Comida amarilla que sale de la leche.", level: 2 },
    { id: "es-fresa", word: "FRESA", emoji: "🍓", clue: "Fruta roja, pequeña y dulce.", level: 2 },
    { id: "es-conejo", word: "CONEJO", emoji: "🐰", clue: "Animal de orejas largas que salta.", level: 2 },
    { id: "es-zapato", word: "ZAPATO", emoji: "👟", clue: "Se pone en el pie.", level: 2 },
    { id: "es-arbol", word: "ÁRBOL", emoji: "🌳", clue: "Planta muy alta con tronco y muchas hojas.", level: 2 },
    { id: "es-arana", word: "ARAÑA", emoji: "🕷️", clue: "Tiene ocho patas y teje una tela.", level: 2 },
    { id: "es-sandia", word: "SANDÍA", emoji: "🍉", clue: "Fruta verde por fuera y roja por dentro.", level: 2 },
    { id: "es-cerdo", word: "CERDO", emoji: "🐷", clue: "Animal rosado de granja que hace oinc.", level: 2 },
    { id: "es-oveja", word: "OVEJA", emoji: "🐑", clue: "Su lana te abriga.", level: 2 },
    { id: "es-tigre", word: "TIGRE", emoji: "🐯", clue: "Gato grande con rayas negras.", level: 2 },
    { id: "es-cebra", word: "CEBRA", emoji: "🦓", clue: "Parece un caballo con rayas blancas y negras.", level: 2 },
    { id: "es-raton", word: "RATÓN", emoji: "🐭", clue: "Animal pequeño al que le encanta el queso.", level: 2 },
    { id: "es-camion", word: "CAMIÓN", emoji: "🚚", clue: "Vehículo grande que lleva carga.", level: 2 },
    { id: "es-barco", word: "BARCO", emoji: "🚢", clue: "Navega por el mar.", level: 2 },
    { id: "es-avion", word: "AVIÓN", emoji: "✈️", clue: "Lleva personas volando por el cielo.", level: 2 },
    { id: "es-llave", word: "LLAVE", emoji: "🔑", clue: "Abre la puerta de la casa.", level: 2 },
    { id: "es-pelota", word: "PELOTA", emoji: "⚽", clue: "Se patea o se lanza para jugar.", level: 2 },
    { id: "es-limon", word: "LIMÓN", emoji: "🍋", clue: "Fruta amarilla y ácida.", level: 2 },
    { id: "es-cereza", word: "CEREZA", emoji: "🍒", clue: "Fruta pequeña y roja con hueso.", level: 2 },
    { id: "es-huevo", word: "HUEVO", emoji: "🥚", clue: "Lo pone la gallina.", level: 2 },
    { id: "es-tambor", word: "TAMBOR", emoji: "🥁", clue: "Se golpea para hacer música.", level: 2 },
    { id: "es-cohete", word: "COHETE", emoji: "🚀", clue: "Viaja al espacio.", level: 2 },
    { id: "es-robot", word: "ROBOT", emoji: "🤖", clue: "Máquina que se mueve y habla.", level: 2 },
    { id: "es-nieve", word: "NIEVE", emoji: "❄️", clue: "Copos blancos y fríos que caen en invierno.", level: 2 },
    { id: "es-pizza", word: "PIZZA", emoji: "🍕", clue: "Comida redonda con queso encima.", level: 2 },
    { id: "es-dragon", word: "DRAGÓN", emoji: "🐉", clue: "Animal de los cuentos que echa fuego.", level: 2 },
    { id: "es-regalo", word: "REGALO", emoji: "🎁", clue: "Lo recibes en tu cumpleaños.", level: 2 },
    { id: "es-delfin", word: "DELFÍN", emoji: "🐬", clue: "Animal listo que vive en el mar y salta.", level: 2 },
    { id: "es-pulpo", word: "PULPO", emoji: "🐙", clue: "Animal del mar con ocho brazos.", level: 2 },
    { id: "es-volcan", word: "VOLCÁN", emoji: "🌋", clue: "Montaña que puede echar lava caliente.", level: 2 },
    { id: "es-gorila", word: "GORILA", emoji: "🦍", clue: "Mono grande y fuerte que se golpea el pecho.", level: 2 },
    { id: "es-helado", word: "HELADO", emoji: "🍦", clue: "Postre frío que se derrite al sol.", level: 2 },
    { id: "es-manzana", word: "MANZANA", emoji: "🍎", clue: "Fruta roja que crece en el árbol.", level: 3 },
    { id: "es-caballo", word: "CABALLO", emoji: "🐴", clue: "Animal grande que corre y se monta.", level: 3 },
    { id: "es-tortuga", word: "TORTUGA", emoji: "🐢", clue: "Camina despacio y carga su caparazón.", level: 3 },
    { id: "es-montana", word: "MONTAÑA", emoji: "🏔️", clue: "Lugar muy alto con nieve en la punta.", level: 3 },
    { id: "es-corazon", word: "CORAZÓN", emoji: "❤️", clue: "Late dentro de tu pecho.", level: 3 },
    { id: "es-autobus", word: "AUTOBÚS", emoji: "🚌", clue: "Vehículo grande que lleva muchas personas.", level: 3 },
    { id: "es-estrella", word: "ESTRELLA", emoji: "⭐", clue: "Brilla en el cielo de noche.", level: 3 },
    { id: "es-elefante", word: "ELEFANTE", emoji: "🐘", clue: "Animal enorme con trompa larga.", level: 3 },
    { id: "es-mariposa", word: "MARIPOSA", emoji: "🦋", clue: "Vuela y tiene alas de colores.", level: 3 },
    { id: "es-pinguino", word: "PINGÜINO", emoji: "🐧", clue: "Ave blanca y negra que no vuela.", level: 3 },
    { id: "es-gallina", word: "GALLINA", emoji: "🐔", clue: "Ave de granja que pone huevos.", level: 3 },
    { id: "es-platano", word: "PLÁTANO", emoji: "🍌", clue: "Fruta larga y amarilla.", level: 3 },
    { id: "es-castillo", word: "CASTILLO", emoji: "🏰", clue: "Allí viven el rey y la reina.", level: 3 },
    { id: "es-cangrejo", word: "CANGREJO", emoji: "🦀", clue: "Camina de lado por la playa.", level: 3 },
    { id: "es-calabaza", word: "CALABAZA", emoji: "🎃", clue: "Verdura grande y naranja.", level: 3 },
    { id: "es-canguro", word: "CANGURO", emoji: "🦘", clue: "Salta y lleva a su cría en una bolsa.", level: 3 },
    { id: "es-tractor", word: "TRACTOR", emoji: "🚜", clue: "Máquina de granja que tira de cosas pesadas.", level: 3 },
    { id: "es-paraguas", word: "PARAGUAS", emoji: "☂️", clue: "Te protege de la lluvia.", level: 3 },
    { id: "es-guitarra", word: "GUITARRA", emoji: "🎸", clue: "Instrumento con seis cuerdas.", level: 3 },
    { id: "es-arcoiris", word: "ARCOÍRIS", emoji: "🌈", clue: "Colores en el cielo después de la lluvia.", level: 3 },
    { id: "es-camello", word: "CAMELLO", emoji: "🐫", clue: "Animal del desierto con jorobas.", level: 3 },
    { id: "es-tiburon", word: "TIBURÓN", emoji: "🦈", clue: "Pez grande con muchos dientes.", level: 3 },
    { id: "es-ballena", word: "BALLENA", emoji: "🐋", clue: "El animal más grande del mar.", level: 3 },
    { id: "es-hormiga", word: "HORMIGA", emoji: "🐜", clue: "Insecto pequeño que carga migas.", level: 3 },
    { id: "es-caracol", word: "CARACOL", emoji: "🐌", clue: "Lleva su casa en la espalda y va muy despacio.", level: 3 },
    { id: "es-telefono", word: "TELÉFONO", emoji: "📱", clue: "Lo usas para llamar a alguien.", level: 3 },
    { id: "es-campana", word: "CAMPANA", emoji: "🔔", clue: "Suena din, don.", level: 3 },
    { id: "es-cebolla", word: "CEBOLLA", emoji: "🧅", clue: "Verdura que te hace llorar al cortarla.", level: 3 },
    { id: "es-ardilla", word: "ARDILLA", emoji: "🐿️", clue: "Tiene la cola peluda y guarda nueces.", level: 3 },
    { id: "es-lagarto", word: "LAGARTO", emoji: "🦎", clue: "Reptil pequeño que toma el sol.", level: 3 },
  ],
};

export function getWordBank(language: Language): ScrambleWord[] {
  return WORD_BANK[language];
}

/**
 * Elige la siguiente palabra del idioma actual, prefiriendo el nivel pedido y
 * cayendo al nivel más cercano cuando ya no quedan palabras sin usar.
 * `usedIds` acumula las palabras ya jugadas, así que ninguna se repite dentro
 * de una misma partida. Sigue el mismo criterio de selección que usa
 * `pickNextQuestion` en el motor de lecciones, aplicado a palabras.
 *
 * `recentIds` son las de partidas anteriores, de la más antigua a la más
 * reciente. Pesan menos que el nivel: dentro del nivel se prefiere una que no
 * salió hace poco y, si ya salieron todas, la que lleva más tiempo sin salir.
 * Saltar de nivel para no repetir cambiaría la dificultad, que es lo que el
 * jugador se ganó.
 */
export function pickNextWord(
  language: Language,
  level: number,
  usedIds: string[],
  recentIds: string[] = [],
): ScrambleWord | null {
  const available = WORD_BANK[language].filter(
    (candidate) => !usedIds.includes(candidate.id),
  );
  if (available.length === 0) return null;

  const sorted = [...available].sort(
    (a, b) => Math.abs(a.level - level) - Math.abs(b.level - level),
  );
  const bestDistance = Math.abs(sorted[0].level - level);
  const candidates = sorted.filter(
    (candidate) => Math.abs(candidate.level - level) === bestDistance,
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
 * Desordena las letras de la palabra. Cada ficha guarda su posición original
 * en el id para que las letras repetidas sigan siendo fichas distintas.
 */
export function createLetterTiles(word: string): LetterTile[] {
  const letters = getWordLetters(word);
  const solution = letters.join("");
  const tiles = letters.map((letter, index) => ({
    id: `${index}-${letter}`,
    letter,
  }));

  // Evita entregar la palabra ya resuelta; se rinde si todas las letras son iguales.
  let shuffled = shuffle(tiles);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (shuffled.map((tile) => tile.letter).join("") !== solution) break;
    shuffled = shuffle(tiles);
  }
  return shuffled;
}

/**
 * Dificultad suave. Reutiliza `nextLevel` del motor de lecciones para el ±1 y
 * el tope, pero la decisión se toma por palabra:
 * - 2 palabras seguidas sin errores suben el nivel (máximo 3).
 * - Una palabra con muchos errores baja el nivel (mínimo 1).
 * - Entre medias el nivel se mantiene y la racha se reinicia.
 */
export function nextWordScrambleLevel(
  level: number,
  streak: number,
  mistakes: number,
): { level: number; streak: number } {
  if (mistakes >= WORD_SCRAMBLE_DROP_MISTAKES) {
    return nextLevel(level, streak, true);
  }
  if (mistakes > 0) {
    return { level, streak: 0 };
  }
  return nextLevel(level, streak, false);
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
