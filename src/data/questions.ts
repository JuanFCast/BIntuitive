export type CategoryId = "lugares" | "numeros" | "colores";

export type QuestionOption = {
  id: string;
  label: string;
  emoji?: string;
  imageSrc?: string;
  alt: string;
};

export type Question = {
  id: string;
  category: CategoryId;
  level: 1 | 2 | 3;
  instruction: string;
  instructionShort?: string;
  answerId: string;
  options: QuestionOption[];
  hint?: string;
};

export const questions: Question[] = [
  // ─── LUGARES ────────────────────────────────────────────────
  {
    id: "lugares-desierto-01",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar con mucha arena y sin agua.",
    answerId: "desierto",
    options: [
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar y sombrilla" },
      { id: "desierto", label: "Desierto", emoji: "🏜️", alt: "Desierto con cactus" },
    ],
    hint: "Busca el lugar seco, con cactus.",
  },
  {
    id: "lugares-playa-02",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar con mar y arena.",
    answerId: "playa",
    options: [
      { id: "ciudad", label: "Ciudad", emoji: "🏙️", alt: "Ciudad con edificios" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar y sombrilla" },
    ],
    hint: "Busca donde está el agua azul.",
  },
  {
    id: "lugares-casa-03",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar donde duermes con tu familia.",
    answerId: "casa",
    options: [
      { id: "casa", label: "Casa", emoji: "🏠", alt: "Casa con techo rojo" },
      { id: "hospital", label: "Hospital", emoji: "🏥", alt: "Hospital con cruz" },
    ],
    hint: "Es donde está tu camita.",
  },
  {
    id: "lugares-montana-04",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar muy alto con nieve.",
    answerId: "montana",
    options: [
      { id: "montana", label: "Montaña", emoji: "🏔️", alt: "Montaña con nieve" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar" },
      { id: "ciudad", label: "Ciudad", emoji: "🏙️", alt: "Ciudad con edificios" },
    ],
    hint: "Busca lo blanco arriba, ¡es nieve!",
  },
  {
    id: "lugares-selva-05",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar con muchos árboles y animales salvajes.",
    answerId: "selva",
    options: [
      { id: "desierto", label: "Desierto", emoji: "🏜️", alt: "Desierto con cactus" },
      { id: "selva", label: "Selva", emoji: "🌳", alt: "Selva con árboles verdes" },
      { id: "escuela", label: "Escuela", emoji: "🏫", alt: "Escuela con bandera" },
    ],
    hint: "Busca el lugar verde con árboles.",
  },
  {
    id: "lugares-granja-06",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde viven las vacas y las gallinas.",
    answerId: "granja",
    options: [
      { id: "hospital", label: "Hospital", emoji: "🏥", alt: "Hospital con cruz" },
      { id: "granja", label: "Granja", emoji: "🚜", alt: "Granja con tractor" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar" },
    ],
    hint: "Busca el tractor del campo.",
  },
  {
    id: "lugares-escuela-07",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde los niños aprenden.",
    answerId: "escuela",
    options: [
      { id: "escuela", label: "Escuela", emoji: "🏫", alt: "Escuela con bandera" },
      { id: "granja", label: "Granja", emoji: "🚜", alt: "Granja con tractor" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar" },
    ],
    hint: "Ahí hay tableros y cuadernos.",
  },
  {
    id: "lugares-hospital-08",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde los doctores cuidan a las personas.",
    answerId: "hospital",
    options: [
      { id: "hospital", label: "Hospital", emoji: "🏥", alt: "Hospital con cruz" },
      { id: "escuela", label: "Escuela", emoji: "🏫", alt: "Escuela con bandera" },
      { id: "ciudad", label: "Ciudad", emoji: "🏙️", alt: "Ciudad con edificios" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar" },
    ],
    hint: "Busca la cruz del doctor.",
  },
  {
    id: "lugares-parque-09",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar con columpios para jugar.",
    answerId: "parque",
    options: [
      { id: "parque", label: "Parque", emoji: "🛝", alt: "Parque con rodadero" },
      { id: "hospital", label: "Hospital", emoji: "🏥", alt: "Hospital con cruz" },
      { id: "desierto", label: "Desierto", emoji: "🏜️", alt: "Desierto con cactus" },
      { id: "granja", label: "Granja", emoji: "🚜", alt: "Granja con tractor" },
    ],
    hint: "Ahí está el rodadero.",
  },
  {
    id: "lugares-ciudad-10",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar con muchos edificios y carros.",
    answerId: "ciudad",
    options: [
      { id: "montana", label: "Montaña", emoji: "🏔️", alt: "Montaña con nieve" },
      { id: "ciudad", label: "Ciudad", emoji: "🏙️", alt: "Ciudad con edificios altos" },
      { id: "playa", label: "Playa", emoji: "🏖️", alt: "Playa con mar" },
      { id: "selva", label: "Selva", emoji: "🌳", alt: "Selva con árboles" },
    ],
    hint: "Busca los edificios altos.",
  },

  // ─── NÚMEROS ────────────────────────────────────────────────
  {
    id: "numeros-cinco-01",
    category: "numeros",
    level: 1,
    instruction: "Toca el número cinco.",
    answerId: "n5",
    options: [
      { id: "n5", label: "5", alt: "Número cinco" },
      { id: "n8", label: "8", alt: "Número ocho" },
    ],
    hint: "El cinco tiene un sombrerito arriba.",
  },
  {
    id: "numeros-mas-manzanas-02",
    category: "numeros",
    level: 1,
    instruction: "Toca el grupo que tiene más manzanas.",
    answerId: "cuatro-manzanas",
    options: [
      { id: "una-manzana", label: "1", emoji: "🍎", alt: "Una manzana" },
      { id: "cuatro-manzanas", label: "4", emoji: "🍎🍎🍎🍎", alt: "Cuatro manzanas" },
    ],
    hint: "Más es donde hay muchas.",
  },
  {
    id: "numeros-dos-perritos-03",
    category: "numeros",
    level: 1,
    instruction: "Toca el grupo que tiene dos perritos.",
    answerId: "dos-perritos",
    options: [
      { id: "dos-perritos", label: "2", emoji: "🐶🐶", alt: "Dos perritos" },
      { id: "cuatro-perritos", label: "4", emoji: "🐶🐶🐶🐶", alt: "Cuatro perritos" },
    ],
    hint: "Cuenta despacio: uno, dos.",
  },
  {
    id: "numeros-mayor-04",
    category: "numeros",
    level: 2,
    instruction: "¿Cuál número es el mayor?",
    answerId: "n9",
    options: [
      { id: "n2", label: "2", alt: "Número dos" },
      { id: "n9", label: "9", alt: "Número nueve" },
      { id: "n4", label: "4", alt: "Número cuatro" },
    ],
    hint: "El mayor es el más grande de todos.",
  },
  {
    id: "numeros-despues-4-05",
    category: "numeros",
    level: 2,
    instruction: "¿Qué número viene después del cuatro?",
    answerId: "n5",
    options: [
      { id: "n3", label: "3", alt: "Número tres" },
      { id: "n5", label: "5", alt: "Número cinco" },
      { id: "n7", label: "7", alt: "Número siete" },
    ],
    hint: "Cuenta: tres, cuatro y sigue...",
  },
  {
    id: "numeros-tres-estrellas-06",
    category: "numeros",
    level: 2,
    instruction: "Toca el grupo con tres estrellas.",
    answerId: "tres-estrellas",
    options: [
      { id: "una-estrella", label: "1", emoji: "⭐", alt: "Una estrella" },
      { id: "tres-estrellas", label: "3", emoji: "⭐⭐⭐", alt: "Tres estrellas" },
      { id: "cinco-estrellas", label: "5", emoji: "⭐⭐⭐⭐⭐", alt: "Cinco estrellas" },
    ],
    hint: "Cuenta: uno, dos, tres.",
  },
  {
    id: "numeros-siete-07",
    category: "numeros",
    level: 2,
    instruction: "Toca el número siete.",
    answerId: "n7",
    options: [
      { id: "n7", label: "7", alt: "Número siete" },
      { id: "n1", label: "1", alt: "Número uno" },
      { id: "n4", label: "4", alt: "Número cuatro" },
    ],
    hint: "El siete parece un tobogán.",
  },
  {
    id: "numeros-menor-08",
    category: "numeros",
    level: 3,
    instruction: "¿Cuál número es el menor?",
    answerId: "n3",
    options: [
      { id: "n3", label: "3", alt: "Número tres" },
      { id: "n6", label: "6", alt: "Número seis" },
      { id: "n7", label: "7", alt: "Número siete" },
      { id: "n5", label: "5", alt: "Número cinco" },
    ],
    hint: "El menor es el más pequeñito.",
  },
  {
    id: "numeros-antes-3-09",
    category: "numeros",
    level: 3,
    instruction: "¿Qué número viene antes del tres?",
    answerId: "n2",
    options: [
      { id: "n2", label: "2", alt: "Número dos" },
      { id: "n4", label: "4", alt: "Número cuatro" },
      { id: "n6", label: "6", alt: "Número seis" },
      { id: "n8", label: "8", alt: "Número ocho" },
    ],
    hint: "Cuenta: uno, dos... ¿y luego?",
  },
  {
    id: "numeros-mas-flores-10",
    category: "numeros",
    level: 3,
    instruction: "Toca el grupo con más flores.",
    answerId: "cuatro-flores",
    options: [
      { id: "dos-flores", label: "2", emoji: "🌼🌼", alt: "Dos flores" },
      { id: "cuatro-flores", label: "4", emoji: "🌼🌼🌼🌼", alt: "Cuatro flores" },
      { id: "una-flor", label: "1", emoji: "🌼", alt: "Una flor" },
      { id: "tres-flores", label: "3", emoji: "🌼🌼🌼", alt: "Tres flores" },
    ],
    hint: "Busca donde hay muchas florecitas.",
  },

  // ─── COLORES ────────────────────────────────────────────────
  {
    id: "colores-fruta-roja-01",
    category: "colores",
    level: 1,
    instruction: "Toca la fruta roja.",
    answerId: "manzana",
    options: [
      { id: "manzana", label: "Manzana", emoji: "🍎", alt: "Manzana roja" },
      { id: "banano", label: "Banano", emoji: "🍌", alt: "Banano amarillo" },
    ],
    hint: "Es roja como un corazón.",
  },
  {
    id: "colores-corazon-azul-02",
    category: "colores",
    level: 1,
    instruction: "Toca el corazón azul.",
    answerId: "corazon-azul",
    options: [
      { id: "corazon-rojo", label: "Rojo", emoji: "❤️", alt: "Corazón rojo" },
      { id: "corazon-azul", label: "Azul", emoji: "💙", alt: "Corazón azul" },
    ],
    hint: "Azul como el cielo.",
  },
  {
    id: "colores-animal-verde-03",
    category: "colores",
    level: 1,
    instruction: "Toca el animal verde.",
    answerId: "rana",
    options: [
      { id: "rana", label: "Rana", emoji: "🐸", alt: "Rana verde" },
      { id: "flamenco", label: "Flamenco", emoji: "🦩", alt: "Flamenco rosado" },
    ],
    hint: "Verde como el pasto, ¡y salta!",
  },
  {
    id: "colores-fruta-amarilla-04",
    category: "colores",
    level: 2,
    instruction: "Toca la fruta amarilla.",
    answerId: "banano",
    options: [
      { id: "banano", label: "Banano", emoji: "🍌", alt: "Banano amarillo" },
      { id: "manzana", label: "Manzana", emoji: "🍎", alt: "Manzana roja" },
      { id: "uvas", label: "Uvas", emoji: "🍇", alt: "Uvas moradas" },
    ],
    hint: "Amarillo como el sol.",
  },
  {
    id: "colores-circulo-verde-05",
    category: "colores",
    level: 2,
    instruction: "Toca el círculo verde.",
    answerId: "circulo-verde",
    options: [
      { id: "circulo-verde", label: "Verde", emoji: "🟢", alt: "Círculo verde" },
      { id: "circulo-rojo", label: "Rojo", emoji: "🔴", alt: "Círculo rojo" },
      { id: "circulo-amarillo", label: "Amarillo", emoji: "🟡", alt: "Círculo amarillo" },
    ],
    hint: "Verde como las hojas.",
  },
  {
    id: "colores-flor-roja-06",
    category: "colores",
    level: 2,
    instruction: "Toca la flor roja.",
    answerId: "rosa",
    options: [
      { id: "rosa", label: "Rosa", emoji: "🌹", alt: "Rosa roja" },
      { id: "girasol", label: "Girasol", emoji: "🌻", alt: "Girasol amarillo" },
      { id: "margarita", label: "Margarita", emoji: "🌼", alt: "Margarita blanca" },
    ],
    hint: "Roja como una manzana.",
  },
  {
    id: "colores-animal-rosado-07",
    category: "colores",
    level: 2,
    instruction: "Toca el animal rosado.",
    answerId: "flamenco",
    options: [
      { id: "flamenco", label: "Flamenco", emoji: "🦩", alt: "Flamenco rosado" },
      { id: "rana", label: "Rana", emoji: "🐸", alt: "Rana verde" },
      { id: "oso", label: "Oso", emoji: "🐻", alt: "Oso café" },
    ],
    hint: "Tiene patas largas y es rosadito.",
  },
  {
    id: "colores-cuadrado-amarillo-08",
    category: "colores",
    level: 3,
    instruction: "Toca el cuadrado amarillo.",
    answerId: "cuadrado-amarillo",
    options: [
      { id: "cuadrado-amarillo", label: "Amarillo", emoji: "🟨", alt: "Cuadrado amarillo" },
      { id: "cuadrado-azul", label: "Azul", emoji: "🟦", alt: "Cuadrado azul" },
      { id: "cuadrado-rojo", label: "Rojo", emoji: "🟥", alt: "Cuadrado rojo" },
      { id: "cuadrado-verde", label: "Verde", emoji: "🟩", alt: "Cuadrado verde" },
    ],
    hint: "Amarillo como un banano.",
  },
  {
    id: "colores-fruta-morada-09",
    category: "colores",
    level: 3,
    instruction: "Toca la fruta morada.",
    answerId: "uvas",
    options: [
      { id: "uvas", label: "Uvas", emoji: "🍇", alt: "Uvas moradas" },
      { id: "banano", label: "Banano", emoji: "🍌", alt: "Banano amarillo" },
      { id: "manzana", label: "Manzana", emoji: "🍎", alt: "Manzana roja" },
      { id: "naranja", label: "Naranja", emoji: "🍊", alt: "Naranja anaranjada" },
    ],
    hint: "Son pequeñitas y vienen en racimo.",
  },
  {
    id: "colores-corazon-verde-10",
    category: "colores",
    level: 3,
    instruction: "Toca el corazón verde.",
    answerId: "corazon-verde",
    options: [
      { id: "corazon-verde", label: "Verde", emoji: "💚", alt: "Corazón verde" },
      { id: "corazon-azul", label: "Azul", emoji: "💙", alt: "Corazón azul" },
      { id: "corazon-amarillo", label: "Amarillo", emoji: "💛", alt: "Corazón amarillo" },
      { id: "corazon-rojo", label: "Rojo", emoji: "❤️", alt: "Corazón rojo" },
    ],
    hint: "Verde como una rana.",
  },
];
