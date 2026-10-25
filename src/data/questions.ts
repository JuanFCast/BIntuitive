export type CategoryId = "lugares" | "numeros" | "colores";

export type QuestionOption = {
  id: string;
  /**
   * El nombre que se lee debajo del dibujo.
   *
   * Es opcional, y no por comodidad: **una opción no puede llevar escrita la
   * respuesta**. En las preguntas de contar, un "4" bajo cuatro manzanas
   * convierte "¿cuál grupo tiene más?" en una lectura de cifras; en las de
   * color, un "Verde" bajo el círculo verde convierte "toca el círculo verde"
   * en una lectura de palabras. En esos dos casos la etiqueta se omite y el
   * dibujo es toda la opción.
   *
   * Donde el nombre **no** es la respuesta sí se escribe, porque entonces
   * enseña vocabulario: "Manzana" bajo la fruta cuando lo que se pregunta es
   * el color, o "Casa" bajo la casa cuando lo que se pregunta es dónde
   * duermes.
   *
   * Cuando la opción no trae ni `imageSrc` ni `emoji`, la etiqueta es lo
   * único que hay que pintar —el numeral de "toca el número cinco"— y
   * entonces es obligatoria. `validate:content` lo comprueba.
   */
  label?: string;
  emoji?: string;
  /**
   * Dibujo propio, servido desde `public/art/`. Existe porque hay dos cosas
   * que el emoji no puede garantizar:
   *
   * 1. **El color.** Cada sistema dibuja sus emoji, así que 🌼 es amarillo en
   *    iOS y blancuzco en otros. Una lección que enseña colores no puede
   *    dejar el color en manos de la fuente del teléfono.
   * 2. **El lugar.** No hay emoji de granja ni de selva; se venían usando 🚜
   *    y 🌳, que son un tractor y un árbol. A la pregunta "dónde viven las
   *    vacas y las gallinas" se respondía con un tractor.
   *
   * Los números siguen con emoji a propósito: contar manzanas no depende ni
   * del tono ni del dibujo exacto.
   */
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

/**
 * El nivel de una pregunta es cuántas opciones hay que descartar: 2 opciones
 * en el 1, 3 en el 2 y 4 en el 3. No es una escala de edad, y por eso el
 * mismo concepto puede aparecer en varios niveles con más distractores.
 *
 * Dos y tres opciones son el terreno cómodo de un niño de preescolar; cuatro
 * es el techo, y por eso solo aparece en el nivel 3.
 */

/*
 * Los dibujos, por su nombre de archivo completo.
 *
 * La extensión va escrita y no la pone el ayudante porque en Colores
 * conviven dos cosas distintas. Las figuras geométricas siguen siendo SVG:
 * un círculo rojo es una primitiva, pesa nada y garantiza el color exacto
 * que se está enseñando. Los objetos —los animales, la fruta, las flores—
 * son ilustraciones en PNG, porque un flamenco escrito a mano con
 * coordenadas no parece un flamenco.
 */
const PLACE = (file: string) => `/art/places/${file}`;
const COLOR = (file: string) => `/art/colors/${file}`;

export const questions: Question[] = [
  // ─── LUGARES ────────────────────────────────────────────────
  // Los dibujos son propios: ningún emoji dice "granja" ni "selva".
  {
    id: "lugares-desierto-01",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar con mucha arena y sin agua.",
    answerId: "desierto",
    options: [
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar y sombrilla" },
      { id: "desierto", label: "Desierto", imageSrc: PLACE("desierto.png"), alt: "Desierto con cactus" },
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
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar y sombrilla" },
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
      { id: "casa", label: "Casa", imageSrc: PLACE("casa.png"), alt: "Casa con techo rojo" },
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
    ],
    hint: "Es donde está tu camita.",
  },
  {
    id: "lugares-escuela-11",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar donde aprendes a leer.",
    answerId: "escuela",
    options: [
      { id: "escuela", label: "Escuela", imageSrc: PLACE("escuela.png"), alt: "Escuela con bandera" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
    ],
    hint: "Tiene una bandera y un reloj.",
  },
  {
    id: "lugares-parque-12",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar con columpios y rodadero.",
    answerId: "parque",
    options: [
      { id: "tienda", label: "Tienda", imageSrc: PLACE("tienda.png"), alt: "Tienda con toldo" },
      { id: "parque", label: "Parque", imageSrc: PLACE("parque.png"), alt: "Parque con columpios" },
    ],
    hint: "Es donde vas a jugar afuera.",
  },
  {
    id: "lugares-tienda-13",
    category: "lugares",
    level: 1,
    instruction: "Toca el lugar donde compras la comida.",
    answerId: "tienda",
    options: [
      { id: "tienda", label: "Tienda", imageSrc: PLACE("tienda.png"), alt: "Tienda con toldo" },
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
    ],
    hint: "Tiene un toldo de rayas y una vitrina.",
  },
  {
    id: "lugares-montana-04",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar muy alto con nieve.",
    answerId: "montana",
    options: [
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios" },
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
      { id: "desierto", label: "Desierto", imageSrc: PLACE("desierto.png"), alt: "Desierto con cactus" },
      { id: "selva", label: "Selva", imageSrc: PLACE("selva.png"), alt: "Selva con árboles verdes" },
      { id: "escuela", label: "Escuela", imageSrc: PLACE("escuela.png"), alt: "Escuela con bandera" },
    ],
    hint: "Busca el lugar verde con muchos árboles.",
  },
  {
    id: "lugares-granja-06",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde viven las vacas y las gallinas.",
    answerId: "granja",
    options: [
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
      { id: "granja", label: "Granja", imageSrc: PLACE("granja.png"), alt: "Granja con granero rojo y una vaca" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
    ],
    hint: "Busca el granero rojo del campo.",
  },
  {
    id: "lugares-escuela-07",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde las personas aprenden.",
    answerId: "escuela",
    options: [
      { id: "escuela", label: "Escuela", imageSrc: PLACE("escuela.png"), alt: "Escuela con bandera" },
      { id: "granja", label: "Granja", imageSrc: PLACE("granja.png"), alt: "Granja con granero rojo" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
    ],
    hint: "Ahí hay tableros y cuadernos.",
  },
  {
    id: "lugares-hospital-14",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde te curan cuando estás enfermo.",
    answerId: "hospital",
    options: [
      { id: "casa", label: "Casa", imageSrc: PLACE("casa.png"), alt: "Casa con techo rojo" },
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
      { id: "parque", label: "Parque", imageSrc: PLACE("parque.png"), alt: "Parque con columpios" },
    ],
    hint: "Busca la cruz roja.",
  },
  {
    id: "lugares-ciudad-15",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar con edificios muy altos.",
    answerId: "ciudad",
    options: [
      { id: "granja", label: "Granja", imageSrc: PLACE("granja.png"), alt: "Granja con granero rojo" },
      { id: "desierto", label: "Desierto", imageSrc: PLACE("desierto.png"), alt: "Desierto con cactus" },
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios altos" },
    ],
    hint: "Busca las ventanas encendidas, una encima de otra.",
  },
  {
    id: "lugares-playa-16",
    category: "lugares",
    level: 2,
    instruction: "Toca el lugar donde hay olas y puedes nadar.",
    answerId: "playa",
    options: [
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar y palmera" },
      { id: "escuela", label: "Escuela", imageSrc: PLACE("escuela.png"), alt: "Escuela con bandera" },
    ],
    hint: "Busca la palmera junto al agua.",
  },
  {
    id: "lugares-hospital-08",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde los doctores cuidan a las personas.",
    answerId: "hospital",
    options: [
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
      { id: "escuela", label: "Escuela", imageSrc: PLACE("escuela.png"), alt: "Escuela con bandera" },
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
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
      { id: "parque", label: "Parque", imageSrc: PLACE("parque.png"), alt: "Parque con columpios y rodadero" },
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
      { id: "desierto", label: "Desierto", imageSrc: PLACE("desierto.png"), alt: "Desierto con cactus" },
      { id: "granja", label: "Granja", imageSrc: PLACE("granja.png"), alt: "Granja con granero rojo" },
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
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios altos" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
      { id: "selva", label: "Selva", imageSrc: PLACE("selva.png"), alt: "Selva con árboles" },
    ],
    hint: "Busca los edificios altos y la calle.",
  },
  {
    id: "lugares-granja-17",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde se cultiva la comida.",
    answerId: "granja",
    options: [
      { id: "tienda", label: "Tienda", imageSrc: PLACE("tienda.png"), alt: "Tienda con toldo" },
      { id: "granja", label: "Granja", imageSrc: PLACE("granja.png"), alt: "Granja con granero rojo y una vaca" },
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios" },
      { id: "hospital", label: "Hospital", imageSrc: PLACE("hospital.png"), alt: "Hospital con cruz" },
    ],
    hint: "Busca el granero del campo, con los animales.",
  },
  {
    id: "lugares-montana-18",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde hace mucho frío arriba.",
    answerId: "montana",
    options: [
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
      { id: "playa", label: "Playa", imageSrc: PLACE("playa.png"), alt: "Playa con mar" },
      { id: "desierto", label: "Desierto", imageSrc: PLACE("desierto.png"), alt: "Desierto con cactus" },
      { id: "selva", label: "Selva", imageSrc: PLACE("selva.png"), alt: "Selva con árboles" },
    ],
    hint: "Lo blanco de la punta es nieve.",
  },
  {
    id: "lugares-selva-19",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde los monos saltan entre los árboles.",
    answerId: "selva",
    options: [
      { id: "ciudad", label: "Ciudad", imageSrc: PLACE("ciudad.png"), alt: "Ciudad con edificios" },
      { id: "selva", label: "Selva", imageSrc: PLACE("selva.png"), alt: "Selva con árboles verdes" },
      { id: "montana", label: "Montaña", imageSrc: PLACE("montana.png"), alt: "Montaña con nieve" },
      { id: "tienda", label: "Tienda", imageSrc: PLACE("tienda.png"), alt: "Tienda con toldo" },
    ],
    hint: "Es el lugar más verde de todos.",
  },
  {
    id: "lugares-tienda-20",
    category: "lugares",
    level: 3,
    instruction: "Toca el lugar donde pagas lo que te llevas.",
    answerId: "tienda",
    options: [
      { id: "parque", label: "Parque", imageSrc: PLACE("parque.png"), alt: "Parque con columpios" },
      { id: "selva", label: "Selva", imageSrc: PLACE("selva.png"), alt: "Selva con árboles" },
      { id: "tienda", label: "Tienda", imageSrc: PLACE("tienda.png"), alt: "Tienda con toldo y vitrina" },
      { id: "casa", label: "Casa", imageSrc: PLACE("casa.png"), alt: "Casa con techo rojo" },
    ],
    hint: "Tiene vitrina y un toldo de rayas.",
  },

  // ─── NÚMEROS ────────────────────────────────────────────────
  // Siguen con emoji: contar manzanas no depende del tono ni del dibujo.
  // Los grupos NO llevan etiqueta, porque el numeral sería la respuesta.
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
      { id: "una-manzana", emoji: "🍎", alt: "Una manzana" },
      { id: "cuatro-manzanas", emoji: "🍎🍎🍎🍎", alt: "Cuatro manzanas" },
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
      { id: "dos-perritos", emoji: "🐶🐶", alt: "Dos perritos" },
      { id: "cuatro-perritos", emoji: "🐶🐶🐶🐶", alt: "Cuatro perritos" },
    ],
    hint: "Cuenta despacio: uno, dos.",
  },
  {
    id: "numeros-tres-11",
    category: "numeros",
    level: 1,
    instruction: "Toca el número tres.",
    answerId: "n3",
    options: [
      { id: "n3", label: "3", alt: "Número tres" },
      { id: "n6", label: "6", alt: "Número seis" },
    ],
    hint: "El tres tiene dos panzitas.",
  },
  {
    id: "numeros-menos-estrellas-12",
    category: "numeros",
    level: 1,
    instruction: "Toca el grupo que tiene menos estrellas.",
    answerId: "dos-estrellas",
    options: [
      { id: "cinco-estrellas", emoji: "⭐⭐⭐⭐⭐", alt: "Cinco estrellas" },
      { id: "dos-estrellas", emoji: "⭐⭐", alt: "Dos estrellas" },
    ],
    hint: "Menos es donde hay poquitas.",
  },
  {
    id: "numeros-una-flor-13",
    category: "numeros",
    level: 1,
    instruction: "Toca el grupo que tiene una sola flor.",
    answerId: "una-flor",
    options: [
      { id: "una-flor", emoji: "🌼", alt: "Una flor" },
      { id: "tres-flores", emoji: "🌼🌼🌼", alt: "Tres flores" },
    ],
    hint: "Una sola, nada más.",
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
      { id: "una-estrella", emoji: "⭐", alt: "Una estrella" },
      { id: "tres-estrellas", emoji: "⭐⭐⭐", alt: "Tres estrellas" },
      { id: "cinco-estrellas", emoji: "⭐⭐⭐⭐⭐", alt: "Cinco estrellas" },
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
    id: "numeros-cinco-perritos-14",
    category: "numeros",
    level: 2,
    instruction: "Toca el grupo con cinco perritos.",
    answerId: "cinco-perritos",
    options: [
      { id: "tres-perritos", emoji: "🐶🐶🐶", alt: "Tres perritos" },
      { id: "cinco-perritos", emoji: "🐶🐶🐶🐶🐶", alt: "Cinco perritos" },
      { id: "dos-perritos", emoji: "🐶🐶", alt: "Dos perritos" },
    ],
    hint: "Cuenta con los dedos de una mano.",
  },
  {
    id: "numeros-diez-15",
    category: "numeros",
    level: 2,
    instruction: "Toca el número diez.",
    answerId: "n10",
    options: [
      { id: "n1", label: "1", alt: "Número uno" },
      { id: "n10", label: "10", alt: "Número diez" },
      { id: "n7", label: "7", alt: "Número siete" },
    ],
    hint: "El diez se escribe con dos cifras.",
  },
  {
    id: "numeros-antes-6-16",
    category: "numeros",
    level: 2,
    instruction: "¿Qué número viene antes del seis?",
    answerId: "n5",
    options: [
      { id: "n5", label: "5", alt: "Número cinco" },
      { id: "n7", label: "7", alt: "Número siete" },
      { id: "n2", label: "2", alt: "Número dos" },
    ],
    hint: "Cuenta: cuatro, cinco... ¿y después?",
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
      { id: "dos-flores", emoji: "🌼🌼", alt: "Dos flores" },
      { id: "cuatro-flores", emoji: "🌼🌼🌼🌼", alt: "Cuatro flores" },
      { id: "una-flor", emoji: "🌼", alt: "Una flor" },
      { id: "tres-flores", emoji: "🌼🌼🌼", alt: "Tres flores" },
    ],
    hint: "Busca donde hay muchas florecitas.",
  },
  {
    id: "numeros-ocho-17",
    category: "numeros",
    level: 3,
    instruction: "Toca el número ocho.",
    answerId: "n8",
    options: [
      { id: "n3", label: "3", alt: "Número tres" },
      { id: "n8", label: "8", alt: "Número ocho" },
      { id: "n6", label: "6", alt: "Número seis" },
      { id: "n9", label: "9", alt: "Número nueve" },
    ],
    hint: "El ocho son dos redondelitos, uno encima del otro.",
  },
  {
    id: "numeros-menos-manzanas-18",
    category: "numeros",
    level: 3,
    instruction: "Toca el grupo que tiene menos manzanas.",
    answerId: "una-manzana",
    options: [
      { id: "cuatro-manzanas", emoji: "🍎🍎🍎🍎", alt: "Cuatro manzanas" },
      { id: "una-manzana", emoji: "🍎", alt: "Una manzana" },
      { id: "tres-manzanas", emoji: "🍎🍎🍎", alt: "Tres manzanas" },
      { id: "dos-manzanas", emoji: "🍎🍎", alt: "Dos manzanas" },
    ],
    hint: "Menos es donde hay poquitas.",
  },
  {
    id: "numeros-despues-8-19",
    category: "numeros",
    level: 3,
    instruction: "¿Qué número viene después del ocho?",
    answerId: "n9",
    options: [
      { id: "n9", label: "9", alt: "Número nueve" },
      { id: "n7", label: "7", alt: "Número siete" },
      { id: "n6", label: "6", alt: "Número seis" },
      { id: "n4", label: "4", alt: "Número cuatro" },
    ],
    hint: "Cuenta: siete, ocho y sigue...",
  },
  {
    id: "numeros-seis-estrellas-20",
    category: "numeros",
    level: 3,
    instruction: "Toca el grupo con seis estrellas.",
    answerId: "seis-estrellas",
    options: [
      { id: "cuatro-estrellas", emoji: "⭐⭐⭐⭐", alt: "Cuatro estrellas" },
      { id: "seis-estrellas", emoji: "⭐⭐⭐⭐⭐⭐", alt: "Seis estrellas" },
      { id: "ocho-estrellas", emoji: "⭐⭐⭐⭐⭐⭐⭐⭐", alt: "Ocho estrellas" },
      { id: "cinco-estrellas", emoji: "⭐⭐⭐⭐⭐", alt: "Cinco estrellas" },
    ],
    hint: "Cuenta de cinco en adelante: cinco y una más.",
  },

  // ─── COLORES ────────────────────────────────────────────────
  // Todo con dibujo propio: el color es la respuesta, y el emoji lo decide la
  // fuente del teléfono. Las figuras no llevan etiqueta, porque "Verde"
  // debajo del círculo verde sería la respuesta escrita.
  {
    id: "colores-fruta-roja-01",
    category: "colores",
    level: 1,
    instruction: "Toca la fruta roja.",
    answerId: "manzana",
    options: [
      { id: "manzana", label: "Manzana", imageSrc: COLOR("manzana.png"), alt: "Manzana roja" },
      { id: "banano", label: "Banano", imageSrc: COLOR("banano.png"), alt: "Banano amarillo" },
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
      { id: "corazon-rojo", imageSrc: COLOR("corazon-rojo.svg"), alt: "Corazón rojo" },
      { id: "corazon-azul", imageSrc: COLOR("corazon-azul.svg"), alt: "Corazón azul" },
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
      { id: "rana", label: "Rana", imageSrc: COLOR("rana.png"), alt: "Rana verde" },
      { id: "flamenco", label: "Flamenco", imageSrc: COLOR("flamenco.png"), alt: "Flamenco rosado" },
    ],
    hint: "Verde como el pasto, ¡y salta!",
  },
  {
    id: "colores-animal-azul-11",
    category: "colores",
    level: 1,
    instruction: "Toca el animal azul.",
    answerId: "pez",
    options: [
      { id: "oso", label: "Oso", imageSrc: COLOR("oso.png"), alt: "Oso café" },
      { id: "pez", label: "Pez", imageSrc: COLOR("pez.png"), alt: "Pez azul" },
    ],
    hint: "Azul, y vive en el agua.",
  },
  {
    id: "colores-circulo-rojo-12",
    category: "colores",
    level: 1,
    instruction: "Toca el círculo rojo.",
    answerId: "circulo-rojo",
    options: [
      { id: "circulo-azul", imageSrc: COLOR("circulo-azul.svg"), alt: "Círculo azul" },
      { id: "circulo-rojo", imageSrc: COLOR("circulo-rojo.svg"), alt: "Círculo rojo" },
    ],
    hint: "Rojo como una manzana.",
  },
  {
    id: "colores-animal-negro-13",
    category: "colores",
    level: 1,
    instruction: "Toca el animal negro.",
    answerId: "gato",
    options: [
      { id: "gato", label: "Gato", imageSrc: COLOR("gato.png"), alt: "Gato negro" },
      { id: "flamenco", label: "Flamenco", imageSrc: COLOR("flamenco.png"), alt: "Flamenco rosado" },
    ],
    hint: "Negro como la noche, y hace miau.",
  },
  {
    id: "colores-fruta-amarilla-04",
    category: "colores",
    level: 2,
    instruction: "Toca la fruta amarilla.",
    answerId: "banano",
    options: [
      { id: "banano", label: "Banano", imageSrc: COLOR("banano.png"), alt: "Banano amarillo" },
      { id: "manzana", label: "Manzana", imageSrc: COLOR("manzana.png"), alt: "Manzana roja" },
      { id: "uvas", label: "Uvas", imageSrc: COLOR("uvas.png"), alt: "Uvas moradas" },
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
      { id: "circulo-verde", imageSrc: COLOR("circulo-verde.svg"), alt: "Círculo verde" },
      { id: "circulo-rojo", imageSrc: COLOR("circulo-rojo.svg"), alt: "Círculo rojo" },
      { id: "circulo-amarillo", imageSrc: COLOR("circulo-amarillo.svg"), alt: "Círculo amarillo" },
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
      { id: "rosa", label: "Rosa", imageSrc: COLOR("rosa.png"), alt: "Rosa roja" },
      { id: "girasol", label: "Girasol", imageSrc: COLOR("girasol.png"), alt: "Girasol amarillo" },
      { id: "margarita", label: "Margarita", imageSrc: COLOR("margarita.png"), alt: "Margarita blanca" },
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
      { id: "flamenco", label: "Flamenco", imageSrc: COLOR("flamenco.png"), alt: "Flamenco rosado" },
      { id: "rana", label: "Rana", imageSrc: COLOR("rana.png"), alt: "Rana verde" },
      { id: "oso", label: "Oso", imageSrc: COLOR("oso.png"), alt: "Oso café" },
    ],
    hint: "Tiene patas largas y es rosadito.",
  },
  {
    id: "colores-cuadrado-naranja-14",
    category: "colores",
    level: 2,
    instruction: "Toca el cuadrado naranja.",
    answerId: "cuadrado-naranja",
    options: [
      { id: "cuadrado-morado", imageSrc: COLOR("cuadrado-morado.svg"), alt: "Cuadrado morado" },
      { id: "cuadrado-naranja", imageSrc: COLOR("cuadrado-naranja.svg"), alt: "Cuadrado naranja" },
      { id: "cuadrado-azul", imageSrc: COLOR("cuadrado-azul.svg"), alt: "Cuadrado azul" },
    ],
    hint: "Naranja como la fruta que se llama igual.",
  },
  {
    id: "colores-verdura-naranja-15",
    category: "colores",
    level: 2,
    instruction: "Toca la verdura naranja.",
    answerId: "zanahoria",
    options: [
      { id: "rana", label: "Rana", imageSrc: COLOR("rana.png"), alt: "Rana verde" },
      { id: "zanahoria", label: "Zanahoria", imageSrc: COLOR("zanahoria.png"), alt: "Zanahoria naranja" },
      { id: "uvas", label: "Uvas", imageSrc: COLOR("uvas.png"), alt: "Uvas moradas" },
    ],
    hint: "Les encanta a los conejos.",
  },
  {
    id: "colores-corazon-morado-16",
    category: "colores",
    level: 2,
    instruction: "Toca el corazón morado.",
    answerId: "corazon-morado",
    options: [
      { id: "corazon-rosado", imageSrc: COLOR("corazon-rosado.svg"), alt: "Corazón rosado" },
      { id: "corazon-azul", imageSrc: COLOR("corazon-azul.svg"), alt: "Corazón azul" },
      { id: "corazon-morado", imageSrc: COLOR("corazon-morado.svg"), alt: "Corazón morado" },
    ],
    hint: "Morado como las uvas.",
  },
  {
    id: "colores-cuadrado-amarillo-08",
    category: "colores",
    level: 3,
    instruction: "Toca el cuadrado amarillo.",
    answerId: "cuadrado-amarillo",
    options: [
      { id: "cuadrado-amarillo", imageSrc: COLOR("cuadrado-amarillo.svg"), alt: "Cuadrado amarillo" },
      { id: "cuadrado-azul", imageSrc: COLOR("cuadrado-azul.svg"), alt: "Cuadrado azul" },
      { id: "cuadrado-rojo", imageSrc: COLOR("cuadrado-rojo.svg"), alt: "Cuadrado rojo" },
      { id: "cuadrado-verde", imageSrc: COLOR("cuadrado-verde.svg"), alt: "Cuadrado verde" },
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
      { id: "uvas", label: "Uvas", imageSrc: COLOR("uvas.png"), alt: "Uvas moradas" },
      { id: "banano", label: "Banano", imageSrc: COLOR("banano.png"), alt: "Banano amarillo" },
      { id: "manzana", label: "Manzana", imageSrc: COLOR("manzana.png"), alt: "Manzana roja" },
      { id: "naranja", label: "Naranja", imageSrc: COLOR("naranja.png"), alt: "Naranja" },
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
      { id: "corazon-verde", imageSrc: COLOR("corazon-verde.svg"), alt: "Corazón verde" },
      { id: "corazon-azul", imageSrc: COLOR("corazon-azul.svg"), alt: "Corazón azul" },
      { id: "corazon-amarillo", imageSrc: COLOR("corazon-amarillo.svg"), alt: "Corazón amarillo" },
      { id: "corazon-rojo", imageSrc: COLOR("corazon-rojo.svg"), alt: "Corazón rojo" },
    ],
    hint: "Verde como una rana.",
  },
  {
    id: "colores-blanco-17",
    category: "colores",
    level: 3,
    instruction: "Toca lo que es blanco.",
    answerId: "nube",
    options: [
      { id: "gato", label: "Gato", imageSrc: COLOR("gato.png"), alt: "Gato negro" },
      { id: "nube", label: "Nube", imageSrc: COLOR("nube.png"), alt: "Nube blanca" },
      { id: "zanahoria", label: "Zanahoria", imageSrc: COLOR("zanahoria.png"), alt: "Zanahoria naranja" },
      { id: "pez", label: "Pez", imageSrc: COLOR("pez.png"), alt: "Pez azul" },
    ],
    hint: "Blanca como la leche, y está en el cielo.",
  },
  {
    id: "colores-animal-cafe-18",
    category: "colores",
    level: 3,
    instruction: "Toca el animal café.",
    answerId: "oso",
    options: [
      { id: "rana", label: "Rana", imageSrc: COLOR("rana.png"), alt: "Rana verde" },
      { id: "oso", label: "Oso", imageSrc: COLOR("oso.png"), alt: "Oso café" },
      { id: "pez", label: "Pez", imageSrc: COLOR("pez.png"), alt: "Pez azul" },
      { id: "gato", label: "Gato", imageSrc: COLOR("gato.png"), alt: "Gato negro" },
    ],
    hint: "Café como el chocolate, y es grandote.",
  },
  {
    id: "colores-circulo-rosado-19",
    category: "colores",
    level: 3,
    instruction: "Toca el círculo rosado.",
    answerId: "circulo-rosado",
    options: [
      { id: "circulo-rojo", imageSrc: COLOR("circulo-rojo.svg"), alt: "Círculo rojo" },
      { id: "circulo-rosado", imageSrc: COLOR("circulo-rosado.svg"), alt: "Círculo rosado" },
      { id: "circulo-morado", imageSrc: COLOR("circulo-morado.svg"), alt: "Círculo morado" },
      { id: "circulo-naranja", imageSrc: COLOR("circulo-naranja.svg"), alt: "Círculo naranja" },
    ],
    hint: "El rosado es un rojo clarito, como el flamenco.",
  },
  {
    id: "colores-cuadrado-negro-20",
    category: "colores",
    level: 3,
    instruction: "Toca el cuadrado negro.",
    answerId: "cuadrado-negro",
    options: [
      { id: "cuadrado-cafe", imageSrc: COLOR("cuadrado-cafe.svg"), alt: "Cuadrado café" },
      { id: "cuadrado-morado", imageSrc: COLOR("cuadrado-morado.svg"), alt: "Cuadrado morado" },
      { id: "cuadrado-negro", imageSrc: COLOR("cuadrado-negro.svg"), alt: "Cuadrado negro" },
      { id: "cuadrado-azul", imageSrc: COLOR("cuadrado-azul.svg"), alt: "Cuadrado azul" },
    ],
    hint: "Negro como la noche.",
  },
];
