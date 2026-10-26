# CLAUDE.md

Guía para trabajar en este repositorio.

## Qué es

BIntuitive: juego educativo bilingüe (EN por defecto / ES), touch-first (iPad → móvil → desktop).
Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4. Sin backend, sin cuentas, sin
analytics: todo el estado vive en `localStorage`. Producción en `bintuitive.aumcrsp.com` vía AWS
CloudFront (el workflow de deploy vive fuera del repo).

Comandos: `npm run dev`, `npm run build` (valida tipos), `npm start`,
`npm run validate:content` (valida el contenido educativo), `npm run check:migration` (comprueba
que actualizar la aplicación no le pierde el progreso a nadie), y `npm run check:tracing`,
`npm run check:memory` y `npm run check:coloring` (las reglas de nivel, estrellas y desbloqueo de
los tres juegos que usan la escala compartida). No hay linter configurado, y las únicas pruebas
automáticas son esas cuatro: los seis comandos son la verificación.

## Arquitectura

**La raíz (`/`) es la portada pública.** Presenta BIntuitive y ofrece tres puertas: iniciar
sesión, crear una cuenta y continuar como invitado. Las dos primeras son **prototipos
visuales**: no hay proveedor de identidad, ni base de datos, ni sesión, y las pantallas lo
dicen en vez de fingirlo. No guardan correos, ni contraseñas, ni cuentas falsas en
`localStorage`. La tercera es la que lleva a la aplicación de verdad, y por eso es la grande y
va primero; las dos de cuenta van debajo, agrupadas "para adultos".

**El panal (`/explore`) es la única superficie de descubrimiento.** Es la pantalla de entrada
de la aplicación —la pestaña se llama Home (Inicio en español), aunque la ruta sea `/explore`— y todo lo que dentro significa "volver al
principio" apunta ahí, nunca a `/`. Las direcciones viven en `src/lib/routes.ts`: un
`href="/"` suelto en un juego mandaría al niño a la pantalla de registro. Renderiza
`hexagons = [...categories, ...gameHexagons]`, es decir lecciones y juegos en el mismo panal.
No existe una sección `games`: hubo una (`/games`, de la etapa "worlds", commit `9f1d81d`) que
quedó como superficie duplicada al llegar el panal en `94bc7df`, y se eliminó. Si vuelve a
aparecer un índice paralelo de juegos, es un error de arquitectura.

Dos tipos de contenido conviven en ese panal, y ambos se abren bajo la ruta singular `/game`:

1. **Categorías de preguntas** (`lugares`, `numeros`, `colores`) → todas comparten UNA ruta,
   `/game?hexagon=<slug>`, y el motor genérico `src/lib/gameEngine.ts` + banco `src/data/questions.ts`.
2. **Juegos independientes** (`visual`, `typing`, `scramble`, `search`, `memory`, `tracing`,
   `coloring`) → cada uno con su propia ruta
   `/game/<id>`, su propio cliente y su propia lib de lógica pura en `src/lib/`.

Un juego nuevo casi siempre es del tipo 2.

```
src/app/
  layout.tsx            LanguageProvider + AppShell + metadata/OG
  siteMetadata.ts       Nombre, descripción y URL: los comparten layout y manifest
  manifest.ts           Manifest de la app instalable (Next lo sirve y lo enlaza)
  page.tsx              Portada pública (renderiza LandingClient)
  LandingClient.tsx     Identidad, y las tres puertas: sesión, cuenta e invitado
  signin/, signup/, forgot-password/   Prototipos visuales de cuenta, sin backend
  explore/page.tsx      El panal: pantalla de entrada de la aplicación
  HomeClient.tsx        El panal con todos los Hexagon
  hexagons/             Dirección anterior del panal: misma pantalla, 200, canonical a /explore
  game/                 Todas las rutas de juego
    page.tsx            Categorías de preguntas: /game?hexagon=<slug>
    <id>/page.tsx       Server component: solo metadata + render del cliente
    <id>/<Name>Game.tsx "use client": toda la máquina de estados del juego
  progress/, profile/
src/components/         BrandMark, MuteButton, HexagonCard, AppShell, AppMenu, GameShell,
                        AuthShell, AuthField, LanguageSwitch, ComingSoonNotice,
                        GameIntro, GameHelp, ResultActions, ResultStat, Confetti,
                        ConfirmDialog...
src/data/
  categories.ts         Category[] + GameHexagon[] → hexagons[] (fuente de verdad del panal)
  questions.ts          Banco de preguntas en español (fuente)
  localization.ts       Copys en inglés: hexágonos, preguntas, opciones
src/lib/
  i18n.tsx              LanguageProvider, useLanguage(), diccionario `messages` en/es
  gameEngine.ts         Selección de pregunta + dificultad adaptativa (categorías)
  visualGame.ts         Lógica pura de Agilidad visual
  memoryGame.ts         Banco, tablero y estadísticas de Parejas
  tracingGame.ts        Caminos, tolerancia, estrellas y banco de Trazos
  coloringGame.ts       Láminas, paleta de enseñanza y reparto de color de Colorear
  typingGame.ts         Lógica pura de Type Rush
  wordScramble.ts       Banco bilingüe, fichas y dificultad de Word Scramble
  wordSearch.ts         Banco bilingüe, generador de tablero y selección de Word Search
  letters.ts            getWordLetters: partir palabras en letras respetando Unicode/NFC
  clockPause.ts         useClockPause: parar el reloj de un juego mientras la ayuda está abierta
  gameTimers.ts         useGameTimers: esperas cortas congelables (destellos, pausas, transiciones)
  speakAfterSound.ts    useSpeakAfterSound: decir una palabra tras el sonido de acierto
  preferences.ts        useMuted / useTextSize: lectura reactiva de las preferencias
  profile.ts            Nombre, avatar y fecha de inicio de quien juega en este dispositivo
  routes.ts             Las direcciones de la aplicación, escritas una sola vez
  authForm.ts           Validación visual de los formularios de cuenta (sin backend)
  storage.ts, sounds.ts, speech.ts, language.ts
```

### Convenciones clave

- **Español como fuente, inglés como capa**: `questions.ts` y `categories.ts` están en español;
  `localization.ts` traduce a inglés vía `localizeHexagon` / `localizeQuestion`. Para juegos
  nuevos (no preguntas) el patrón real usado es distinto: los strings viven bilingües en
  `messages` de `i18n.tsx`, y los datos con nombre (símbolos, frases) usan
  `Record<Language, string>` o `Record<Language, string[]>` dentro de su lib.
- **Una opción nunca lleva escrita su respuesta**: por eso `QuestionOption.label` es opcional.
  Un "4" debajo de cuatro manzanas convierte "¿cuál grupo tiene más?" en leer cifras, y un
  "Verde" debajo del círculo verde convierte "toca el círculo verde" en leer palabras: en los
  dos casos la etiqueta se omite y el dibujo es toda la opción. Donde el nombre **no** es la
  respuesta sí se escribe, porque entonces enseña vocabulario ("Manzana" cuando se pregunta el
  color, "Casa" cuando se pregunta dónde duermes). Si la opción no trae ni `imageSrc` ni
  `emoji`, la etiqueta es lo único que hay que pintar —el numeral— y es obligatoria.
  `validate:content` comprueba las tres cosas, y también que el inglés no ponga etiqueta donde
  el español no la pone: sería regalarle la respuesta a quien juega en inglés.
- **Los dibujos de las preguntas son propios**, en `public/art/<categoría>/`, y se enlazan con
  `QuestionOption.imageSrc`, que lleva el **nombre de archivo con su extensión** porque no
  todos son del mismo tipo. El emoji se quedó donde sirve —los números, porque contar manzanas
  no depende del tono— y se fue de donde no: **Colores**, porque cada sistema dibuja sus emoji y
  una lección que enseña colores no puede dejar el color en manos de la fuente del teléfono
  (🌼 es amarillo en iOS y blancuzco en otros, y se llamaba "margarita blanca"); y **Lugares**,
  porque no hay emoji de granja ni de selva y se usaban 🚜 y 🌳, así que a "dónde viven las
  vacas y las gallinas" se respondía con un tractor. Dentro de una pregunta no se mezclan
  dibujo y emoji: se ven como dos juegos distintos.
- **Dos tipos de dibujo, y la razón no es estética**. Lo único que sigue siendo **SVG**
  escrito a mano son las treinta figuras geométricas de Colores —círculo, cuadrado y corazón
  en diez colores—: son primitivas, pesan nada, y el vector es lo que garantiza que el rojo
  que se enseña sea exactamente el rojo que se pregunta; una imagen daría un rojo aproximado
  y distinto en cada una. Todo lo demás —los catorce objetos de Colores y los once lugares—
  son **PNG de 384 px**, ilustraciones generadas, porque un flamenco o una escuela escritos
  con coordenadas a mano no parecen un flamenco ni una escuela; los primeros intentos
  parecían cualquier otra cosa. Al sustituir uno: mantener el nombre de archivo, fondo
  transparente, recortar el margen y reescalar a 384 px con el dibujo ocupando el 92% del
  lado largo —si no, los objetos altos y estrechos (el flamenco, la zanahoria) se ven mucho
  más pequeños que los redondos puestos al lado—.
- **Las fichas del panal tienen su propio dibujo**, en `public/art/hexagons/`, y es un estilo
  distinto a propósito: iconos planos, no ilustraciones pintadas. Una ficha es un icono que se
  reconoce de lejos y a 60 px; una opción de pregunta es un objeto que hay que mirar. Derivan
  de Twemoji (© Twitter y colaboradores, **CC BY 4.0**), recoloreados y combinados, y la
  licencia pide atribución allí donde se usan: por eso hay una línea de crédito al pie de la
  portada y otra en el README. **No quitarlas.** El dibujo de cada hexágono se escribe una
  sola vez, en el campo `image` de `categories.ts`; la introducción y la ayuda de cada juego
  lo piden con `hexagonImage(id)` y la portada también, así que no hay una ruta repetida a
  mano en ningún juego. Ninguno lleva el color de la ficha (`sun`) como color principal: se
  perdería sobre ella. Mismo tratamiento que los demás PNG —384 px, el dibujo al 92% del lado
  largo— y además reducidos a 256 colores, que en dibujos planos no se nota y deja los diez en
  124 KB. `validate:content` comprueba que cada ruta exista.
- **Dos casos límite al encargar un dibujo nuevo.** En Colores, lo blanco sobre blanco: la
  nube y la margarita se pintan sobre una ficha blanca y necesitan sombreado propio que
  marque la silueta, no blanco puro. En Lugares, **que no se parezcan entre sí**: los once se
  usan como las respuestas falsas unos de otros, así que una escuela que parezca una casa
  convierte "toca el lugar donde aprendes" en una pregunta con dos respuestas buenas. Lo que
  los separa hoy: escuela con bandera y reloj, hospital con cruz roja, tienda con toldo de
  rayas y vitrina, casa de una planta con tejado rojo, granja con granero y vaca; selva
  espesa frente a parque con columpios; desierto sin una gota de agua frente a playa. Un
  lugar nuevo se revisa **en pareja con sus distractores**, no suelto.
- **Colorear crece cambiando de mecánica, no de tamaño**: los escalones 1 y 2 dicen en voz
  alta qué zona pintar y de qué color, y van zona por zona, así que sirven a quien todavía no
  reconoce cifras; del 3 al 5 cada zona lleva un número, la paleta dice qué color es cada
  número y se pinta en el orden que se quiera. Es un solo juego con dos formas de pedir lo
  mismo, y es lo que hace que los cinco escalones sean cinco cosas distintas. Los colores
  **no** se guardan en la lámina: se reparten en rueda sobre la paleta revuelta al empezar
  cada ronda, lo que garantiza de una vez que dos zonas vecinas nunca salgan del mismo tono
  —las zonas están escritas en orden de vecindad— y que la paleta no tenga fichas que no
  pinten nada. Por eso doce láminas bastan: la misma casa sale distinta cada vez.
- **En Colorear se pinta arrastrando, con el grosor que se elija.** Un toque que
  rellenaba la zona entera convertía colorear en señalar, que es lo que ya hacen las
  lecciones de preguntas: ahora la mano trabaja, como en Trazos pero sin la exigencia de
  seguir un camino. Tres grosores (`COLORING_BRUSHES`) y no un deslizador, porque un
  deslizador pide un gesto fino y no se puede nombrar en voz alta ni leer con un lector de
  pantalla. **La pintura se recorta a la zona**, así que salirse no estropea el dibujo —es
  lo que permite dárselo a un niño de tres años con el dedo— y el color que no toca
  sencillamente no agarra: equivocarse nunca deja marca. Una zona se rellena sola al
  llegar al `coverageToFill` de su escalón, no al quedar perfecta; pedir el 100 % obligaría a
  repasar los rincones con el pincel fino y aquí se practica el color, no el pulso. **Los
  escalones altos piden más a la mano sin castigar salirse**: el umbral sube del 70 % (1 y 2,
  los del niño de tres años, intactos) al 75 %, 80 % y 85 %, y del 4 en adelante no hay pincel
  grueso, que con dos pasadas tapaba casi cualquier zona. Ambos viven en `COLORING_LEVELS`
  junto a la paleta, y `npm run check:coloring` impide que el umbral baje al subir, que llegue
  a pedir la zona perfecta o que un escalón deje fuera el grosor de por defecto. La
  precisión cuenta **decisiones** —esta zona de este color, una sola vez por pareja
  (`coloringAttemptKey`)—, no pasadas: cobrar cada pasada haría que pintar bien con el
  pincel fino puntuara peor que pintar bien con el grueso. Lo pintado se mide con una
  rejilla de puntos sembrada por lámina y geometría de punto a segmento, no leyendo los
  píxeles del lienzo: `coloringGame.ts` no puede tocar el DOM porque `validate:content` lo
  compila sin él, así que `coloringSampleGrid` recibe el "está dentro" en vez de
  calcularlo.
- **El dibujo de Colorear son dos capas sobre el mismo cuadrado.** Abajo un `<canvas>` con
  el papel, las pasadas de pincel y los contornos, en el orden de las zonas: ese orden es
  el que hace que la puerta se vea sobre la pared y la aleta sobre el cuerpo del pez, y por
  eso el pincel, además de recortarse a su zona, obliga a repintar las zonas de encima y el
  contorno propio tras cada tramo. Un SVG encima, que **no recibe toques**, pone los
  números y una zona enfocable por cada una: sin puntero no hay arrastre, así que activar
  una zona con el teclado la pinta entera y el juego sigue siendo jugable con lector de
  pantalla. Las dos capas no se pueden fundir en una: un SVG con relleno blanco sobre el
  lienzo taparía lo que se está pintando debajo.
- **Las láminas de Colorear son geometría a propósito**: una casa son un triángulo y unos
  rectángulos, y eso es justo lo que un camino SVG escrito a mano hace bien. El `labelAt` de
  cada zona —dónde se pinta su número— va escrito y es obligatorio: el centro de la caja del
  camino no sirve, porque en una banda del arcoíris cae en el hueco del arco, en los pétalos
  cae sobre el centro de la flor, que es otra zona, y en las dos ruedas del tren cae entre
  ellas, en el aire.
- **Los colores que se enseñan no son los de la marca**: la paleta de la interfaz es pastel
  (`sky` es un celeste, `coral` un salmón) y sirve para la interfaz. Los dibujos de la
  categoría Colores usan colores plenos y canónicos, que viven en los propios SVG. Enseñar
  "azul" con `sky` y preguntarlo con el azul fuerte son dos azules distintos para quien está
  aprendiendo cuál es cuál; por eso el ejemplo de la introducción enseña el mismo archivo que
  la lección en vez de un cuadro con una clase de Tailwind.
- **Lógica pura separada de la UI**: constantes, generación de rondas y cálculo de stats van en
  `src/lib/<juego>.ts`; el componente cliente solo orquesta fases y render.
- **Máquina de fases**: los juegos usan `type Phase = "intro" | "playing" | "results"`
  (Type Rush añade `"ready"`), con una sección JSX por fase. La ruta de preguntas tiene las
  mismas tres: entra por la explicación y la sesión —nivel guardado incluido— arranca al
  pulsar Comenzar, no al montar.
- **Instalable**: `manifest.ts` arranca en `/`, la portada, igual que el dominio. Es una
  decisión de producto tomada a propósito: la aplicación instalada enseña también la
  presentación y las puertas de cuenta, al precio de un toque más en "Continuar como invitado"
  cada vez. Por lo mismo **no** hay detección de `display-mode: standalone` que salte sola a
  Explore; añadirla desharía la decisión. La raíz se sirve con un 200, así que el icono abre
  sin redirects, y `id` coincide con ella: cambiarlo haría que el navegador la tomara por otra
  aplicación y dejara huérfana la ya instalada. El icono grande es el mismo `app/icon.png` que sirve de
  favicon; el de 192 vive en `public/`. Ninguno se declara `maskable`: el logo llega cerca del
  borde y una máscara circular le cortaría el birrete. iOS no lee `display` del manifest, así
  que el modo standalone en Safari depende de las metas `appleWebApp` de `layout.tsx`.
- **El panal es Explore**: la barra inferior tiene exactamente tres destinos (Home, Progress,
  Profile) y Home es el panal, servido desde `/explore`. Un enlace que dentro de la
  aplicación signifique "volver al principio" apunta a `EXPLORE` de `src/lib/routes.ts`, nunca
  a `/` ni a `/hexagons`. La portada, `/signin`, `/signup` y `/forgot-password` **no** llevan
  barra inferior: quien las ve todavía no ha entrado, y se sale de ellas por su botón de volver.
- **`/hexagons` sigue viva y no redirige**: sirve la misma pantalla con un 200 desde
  `src/app/hexagons/page.tsx`, con `canonical` a `/explore`. Durante meses `/` devolvió un 308
  permanente hacia `/hexagons`, y ese salto vive en la caché del navegador de cualquiera que ya
  haya abierto la aplicación: hacer que `/hexagons` redirija encadenaría `/` guardado →
  `/hexagons` → destino y podría cortar con "demasiadas redirecciones". No convertirla en
  redirect mientras esa caché pueda existir. Quien la tenga guardada entra directo al panal sin
  ver la portada, que es el mal menor: ya es alguien que juega. `BottomNavigation` la lleva como
  `legacyHref` para encender la pestaña de quien entre por ahí, y `AppShell` la cuenta como ruta
  principal. La raíz tampoco redirige: sirve la portada con un 200.
- **Rutas de juego no llevan AppShell**: `AppShell` solo envuelve el panal (`/explore` y su
  dirección anterior `/hexagons`), `/progress` y `/profile`. Un juego se envuelve en
  `<GameShell>`, que
  pone el `<main>`, el encabezado común (casa a Explore —que pregunta si hay partida en curso—,
  ayuda y `<MuteButton />`), la pantalla de introducción, la ayuda y la confirmación de
  salida. `GameShell` no tiene nada que ver con `AppShell`; la salida de un juego siempre es
  el panal.
- **Una sola explicación por juego**: el objeto `intro` que recibe `GameShell` es la única
  fuente de contenido, y de ahí salen tanto la pantalla previa a jugar como la ayuda. No
  escribir una segunda explicación en ningún sitio: divergirían.
- **Los resultados hablan el mismo idioma visual**: cada actividad enseña sus propias métricas
  —estrellas en las lecciones, estadísticas en los juegos—, pero la tarjeta (`ResultStat`, con
  un `tone` por juego) y el par de botones del final (`ResultActions`: repetir y volver al
  panal) se definen una sola vez. No duplicar esos botones en un juego nuevo.
- **Dos superficies, la misma plantilla**: los juegos independientes usan `GameShell` entero.
  La ruta de preguntas tiene encabezado propio (marca, estrellas, pie con progreso y salida
  con confirmación), así que usa `GameShell` solo en su fase `intro` —allí la casa no
  pregunta nada porque aún no hay sesión— y coloca `<GameHelp>` en su propio encabezado. Lo
  que explica cada categoría vive en la tabla `CATEGORY_INTRO`, indexada por `slug` y
  comprobada por TypeScript con `satisfies`: si se añade una categoría sin sus textos, el
  build falla. `GameShell`, `GameIntro` y `GameHelp` no saben qué categorías existen.
- **La dificultad se elige, no se mueve sola** (hoy en Trazos, Parejas, Colorear, Word Scramble y
  Word Search; es el patrón que copiarán los demás). El selector de los cinco escalones es **uno solo**, `LevelPicker`, y cada
  juego lo coloca en su introducción por la prop `beforeStart` de `GameShell` —que **no** va
  dentro de `intro` a propósito: `intro` es lo que la ayuda vuelve a enseñar encima de una
  partida en curso, y un selector ahí invitaría a cambiar de dificultad a mitad de sesión—.
  Elegido el escalón, queda fijo hasta el final. Al terminar, cada juego valora la sesión de 0 a
  3 con su propia función (`tracingSessionStars` por la media de estrellas de cada trazo,
  `memorySessionStars` y `coloringSessionStars` por la precisión), y dos estrellas abren el
  siguiente escalón con
  `unlockedAfterSession`, que solo sabe subir. Abandonar no llega a guardar, así que no
  desbloquea nada. Las estrellas de la sesión se enseñan con `SessionStars`, siempre aparte de
  las marcas del juego, para que no se lean como la misma cuenta. "Jugar otra vez" vuelve a la
  introducción y no relanza la partida: es la única forma de elegir el nivel que se acaba de
  abrir. `npm run check:tracing`, `npm run check:memory` y `npm run check:coloring` protegen estas
  reglas.
- **Un solo escritor de sesiones**: `recordSession`, en `storage.ts`, tiene las reglas que no
  pueden cambiar de un juego a otro —escalón elegido, desbloqueo, mejor valoración, una sesión
  cada vez—. Cada juego solo aporta cómo se juntan **sus** marcas (`saveTracingResult`,
  `saveMemoryResult`). Existe en un solo sitio para que, cuando E3 separe destreza, actividad y
  dominio por grado, cambie una función y no nueve.
- **Ayuda no es reiniciar**: la ayuda se superpone a la partida y no toca `phase`. Volver a
  `"intro"` reiniciaría ronda, tablero, letras colocadas y estadísticas. Un juego con reloj
  pasa `onOverlayOpenChange` y usa `useClockPause`: leer la explicación no puede costar tiempo.
- **Salir de una partida pregunta**: `GameShell` recibe `confirmExit` —`phase === "playing"`
  en los seis juegos— y con él la casa deja de ser un enlace y pasa a ser un botón que abre
  `ExitDialog` con `variant="game"`. En `intro` y en `results` no hay nada que perder y sale
  directa. La ruta de preguntas tiene encabezado propio y usa el mismo `ExitDialog` con su
  `variant` por defecto, el de lección. No hay un segundo diálogo de salida.
- **Con algo superpuesto la partida está quieta**: vale igual para la ayuda y para la
  confirmación de salida. Las esperas cortas de un juego van por `useGameTimers` (`later`, no
  `setTimeout` suelto), y `onOverlayOpenChange` las congela y las reanuda con el tiempo que
  les faltaba. Un `setTimeout` propio seguiría corriendo detrás del overlay y cambiaría la
  carta, la palabra o el tablero mientras el niño lee o decide.
- **La voz nunca arranca sola**: en iOS SpeechSynthesis solo habla como consecuencia directa
  de un gesto, así que el audio de la introducción es un botón, no una reproducción
  automática. `AudioButton` comprueba `isMuted()` en los dos caminos.
- **Paleta**: tokens `@theme` en `globals.css` — `cream` (fondo), `sun`/`sunsoft` (marca),
  `sky`/`skysoft`, `mint`/`mintsoft` (acierto), `coral`/`coralsoft` (error), `berry`/`berrysoft`, `ink`.
  El acierto de las lecciones es menta con el canto grueso de los botones y la abeja de la
  marca, y su confeti son celdas del panal en estos colores, no emoji.
  Botones con `border-b-8` + `active:scale-95` + `active:border-b-4`.
- **Accesibilidad**: `aria-label` en cada control, emoji siempre `aria-hidden="true"` acompañado
  de texto o label; objetivos táctiles `min-h-12` o más.
- **Las partidas llenan la tableta**: el iPad es el primer dispositivo, y un tablero con tope
  fijo en rem (`26rem`, `32rem`) se quedaba en la mitad de arriba con la otra mitad vacía.
  Desde 640px los tableros tienen topes amplios y los limita el alto libre de la ventana
  (`.memory-board`, `.coloring-board`, `.word-search-board`, el tablero de Trazos), las
  secciones de juego se centran en vertical, y en las lecciones la pregunta va pegada a sus
  respuestas. Un contenedor flexible centrado se encoge a su contenido: si un tablero usa
  `min(100%, …)`, su columna necesita `w-full` o el 100% se resuelve contra casi nada.
- **Letra de niño, no de panel de control**: nada de `font-mono` (los números van en Baloo con
  `tabular-nums`, que no baila con el reloj) ni de etiquetas diminutas en mayúsculas
  espaciadas dentro de los juegos; quien juega no sabe leer todavía o lee despacio, y esas
  etiquetas quedaban además por debajo de 4.5:1. Las etiquetas van en minúscula normal, a
  `text-ink/70` como mínimo. La única excepción son las letras de juego (sopa, fichas).
- **Movimiento reducido**: `globals.css` tiene una regla global que cambia `pop`, `enter` y
  `fade-up` por un fundido corto y para sacudidas, bailes y confeti. Una animación nueva
  tiene que entrar en esa regla.
- **Sonido**: `playCorrectSound` / `playWrongSound` / `playTapSound` / `playCelebrationSound`;
  todos respetan `isMuted()` internamente, no hay que comprobarlo.
- **Preferencias**: idioma, sonido y tamaño de texto son globales y cada una tiene su clave
  propia en `localStorage` (`bintuitive-language`, `bintuitive-muted`, `bintuitive-text-size`),
  separadas del progreso educativo. Se editan en un único sitio, `AppMenu` (el menú de la
  cabecera), y **no se enseñan en ningún otro**: `Profile` las listaba en solo lectura y era
  ruido, porque el menú está en todas las pantallas. La verdad sigue en `localStorage`:
  `storage.ts` avisa a quien se suscriba y `useMuted` / `useTextSize` leen con
  `useSyncExternalStore`, así que no hay un segundo estado que pueda desincronizarse.
- **Perfil es identidad, no cuenta**: `src/lib/profile.ts` guarda nombre, avatar y fecha de
  inicio en su propia clave (`bintuitive-profile`). No hay servidor, así que no hay correo,
  contraseña ni sesión que gestionar, y la pantalla lo dice en su tarjeta de "Cuenta" en vez de
  enseñar campos que no hacen nada. Ahí es donde entrará iniciar sesión el día que existan
  cuentas. El avatar se guarda por `id`, no por emoji: el dibujo puede cambiar y quien eligió
  zorro debe seguir teniendo zorro. `Profile` solo enseña estrellas y lecciones —las dos
  métricas globales— y enlaza a `/progress` para el detalle, en vez de copiarlo.
- **Tamaño de texto**: escala los tokens `--text-*` de Tailwind desde `[data-text-size]` en
  `<html>`. **Nunca** tocar el `font-size` de `html`: movería el panal, los tableros y todo lo
  calculado contra el viewport. La geometría es inmune porque dimensiona su letra con
  `text-[clamp(...)]`, que compila a un valor literal; si un elemento cuyo tamaño es parte de
  la mecánica necesita letra, debe usar un valor arbitrario, no `text-lg`.
- **Sin dependencias nuevas**: el proyecto solo depende de Next/React. Nada de librerías de
  animación, estado o UI.

## Cómo agregar un juego nuevo

1. `src/lib/<juego>.ts` — tipos, constantes (rondas, duración, penalizaciones), generación de
   rondas y cálculo de estadísticas. Sin React.
2. `src/app/game/<id>/page.tsx` — server component con `metadata` (`"<Nombre> · BIntuitive"`).
3. `src/app/game/<id>/<Nombre>Game.tsx` — `"use client"`, fases intro/playing/results.
   Todo el render va dentro de `<GameShell intro={{ image, title, goal, howTo, example }}
   showIntro={phase === "intro"} startLabel onStart />`, y los hijos son solo las fases de
   juego y resultados: el encabezado, la introducción y la ayuda ya vienen dadas. El
   `example` es un componente propio del juego, pequeño y estático, definido al final de su
   propio archivo como los demás ayudantes de presentación; `GameIntro` solo lo enmarca y
   nunca sabe de qué juego es.
4. `src/data/categories.ts` — añadir el id al union de `GameHexagon["id"]` y una entrada en
   `gameHexagons` (nombre y descripción **en español**, `image` con su dibujo en
   `public/art/hexagons/`, `href: "/game/<id>"`). La introducción toma ese mismo dibujo con
   `image: hexagonImage("<id>")`.
   Con eso el juego ya aparece en el panal: **no hay ningún índice de juegos que actualizar**.
5. `src/data/localization.ts` — añadir la entrada en inglés a `englishHexagons` (el `Record` es
   exhaustivo sobre `Hexagon["id"]`: si falta, TypeScript falla).
6. `src/lib/i18n.tsx` — añadir todas las claves nuevas a `messages.en` **y** `messages.es`
   (el tipo `MessageKey` sale de `en`, así que faltar en `es` rompe el build).
7. **El panal no se toca.** Las posiciones de cada hexágono las calcula `src/lib/honeycomb.ts`
   a partir del índice y del número de columnas (dos en móvil, tres en tableta y cuatro en
   escritorio), igual que el `aspect-ratio` de la rejilla: añadir una entrada en
   `gameHexagons` basta, sin una sola línea de CSS. Las fichas son todas amarillas a
   propósito —colorearlas por familia se probó y se descartó: el panal es de miel— y las
   separa un hueco de 2px entre celdas.
8. `README.md` — actualizar features, estructura y el conteo de hexágonos.
9. `npm run build` para validar tipos y contenido.

Al mover o renombrar una ruta de juego, añadir su `redirect` en `next.config.ts`: la app está
publicada y hay enlaces vivos. Ya hay precedentes ahí (`/worlds`, `/categorias`, `/games`, todos
al panal de la raíz). Un redirect `permanent` se queda meses en la caché del navegador: antes de
darle la vuelta a uno, comprobar que no se cierra un ciclo con el que ya está publicado —es justo
lo que obliga a `/hexagons` a servir la página en vez de redirigir.

## Skills de diseño: en qué orden se usan

En `.claude/skills/` hay cinco skills de diseño instaladas (ignoradas por git:
son herramienta, no código de BIntuitive). Se solapan entre sí, así que el
orden importa — sin él darían consejos contradictorios sobre la misma
pantalla. Para cualquier trabajo visual, en este orden y **solo los pasos que
la tarea necesite**:

1. **`ui-ux-pro-max`** — decide el sistema: paleta, tipografía, escala,
   densidad, patrón de interacción. Trae un buscador propio
   (`scripts/search.py`, Python, sin red) con paletas y guías por tipo de
   producto. Es el único que decide; los demás aplican lo que este fije.
2. **`frontend-design`** — implementa la pantalla con ese sistema ya decidido.
   Empuja hacia lo distintivo y en contra del aspecto de plantilla.
3. **`impeccable`** — refina lo ya implementado: detalle, jerarquía,
   espaciado, microinteracciones, acabado. Entra **después** de que exista
   algo que pulir, nunca antes; si se invoca sobre una pantalla sin sistema
   decidido, rehace decisiones del paso 1.
4. **`web-design-guidelines`** (Vercel) — audita accesibilidad, responsive y
   usabilidad. Es revisión, no diseño: sus hallazgos se arreglan, no se
   discuten con el paso 1.
5. **`webapp-testing`** — comprueba en un navegador que funciona de verdad.
   **No puede ejecutarse hoy**: sus scripts necesitan Playwright para Python,
   que no está instalado y se decidió no instalar. Para probar se usa el panel
   de navegador de Claude Code, que no necesita nada.

Tres reglas para que no se contradigan entre sí:

- **La paleta, la tipografía y el espaciado los decide una sola vez el paso 1**,
  y los demás trabajan dentro de lo que fijó. Si el paso 4 encuentra un
  problema de contraste, se corrige el token del sistema, no la pantalla
  suelta.
- **Impeccable refina, no rediseña.** Donde proponga cambiar paleta o
  tipografía, manda el paso 1.
- **Ninguna de las cinco manda sobre lo que ya está decidido en este
  documento.** Los tokens de `globals.css`, el panal, la regla de que una
  opción nunca lleva escrita su respuesta, los colores de enseñanza frente a
  los de la marca: eso es producto, no estilo, y una recomendación genérica de
  cualquier skill que lo contradiga se descarta.

Impeccable trae además cuatro subagentes en `.claude/agents/` y sus hooks en
`.claude/settings.json`, que corren su motor en SessionStart, **tras cada
Edit/Write** y en Stop. El motor es un binario propio que se descargó a
`~/.impeccable/bin/` —fuera del proyecto— la primera vez que se usó. Su
telemetría está apagada con `IMPECCABLE_NO_TELEMETRY` y `DO_NOT_TRACK` en el
`env` de ese mismo `settings.json`. Para quitarlo todo: borrar esas tres cosas
y la carpeta `~/.impeccable`.

## Cosas a tener en cuenta

- **Progress solo enseña lo que ya está guardado.** `/progress` lee `getProgress()` y no
  persiste nada nuevo: resumen, nivel por actividad, mejores marcas y las últimas sesiones.
  Agilidad visual y Type Rush no guardan progreso a propósito y aparecen sin métricas, igual
  que una actividad todavía sin jugar. Añadir una métrica a esa pantalla empieza por guardarla,
  no al revés.
- **`getProgress()` devuelve siempre un objeto nuevo.** `saveSession` y las dos de palabras
  escriben sobre lo que devuelve, así que compartir una constante vacía la ensuciaría en la
  primera partida de un dispositivo sin datos.
- **El documento es el que se desplaza.** `.app-shell` es un bloque con
  `min-height: 100svh`, el encabezado y la barra inferior son `position: sticky` y el contenido
  crece con su contenido. **No volver a `height: 100dvh` + `overflow: hidden` + hijos
  `position: fixed` con un scroll interior**: en iOS los elementos fijos se colocan contra el
  viewport de disposición, que no encoge cuando el navegador enseña sus barras, y el resultado
  era encabezado cortado, barra inferior flotando sobre una franja vacía y scroll congelado
  hasta recargar. `svh` y no `dvh` para dimensionar: el viewport pequeño es el único que no
  cambia mientras se desplaza, así que nada se redimensiona bajo el dedo. El script temprano
  `IOS_CHROME_VIEWPORT_RECOVERY` cubre otro fallo de Chrome/iOS: al abrir otra vez un enlace desde
  una aplicación, el `WKWebView` puede conservar un inset nativo que no aparece en `scrollY`, en
  `visualViewport` ni en los rectángulos del DOM. La primera entrada reciente se registra en
  `localStorage`. Toda entrada nueva de CriOS muestra `.bintuitive-ios-booting`: en la primera se
  funde con la aplicación después de `load`; una entrada posterior espera 1,5 s para que Chrome
  termine de animar sus barras y recarga una vez, conservando la marca hasta que el documento
  corregido está listo. Así el layout desplazado nunca se pinta y `sessionStorage` evita el
  bucle. El lienzo completo de `WKWebView` puede moverse aunque un elemento use `fixed` y `svh`,
  por lo que el logo permanece transparente durante esa fase: el fondo uniforme absorbe el
  movimiento y la marca aparece, sin animación, solo después de que el lienzo se estabiliza. El
  metadato `google=notranslate` impide además que el panel redundante de traducción
  cambie esos insets durante la apertura. No sustituirlo por altura `100vh` permanente: esa
  diferencia es la franja vacía bajo la barra.
- **Los overlays se montan en el `body`**, con `createPortal`: el menú de ajustes, la ayuda de
  los juegos y `ConfirmDialog`. Un antepasado con `filter` o `backdrop-filter` convierte
  `position: fixed` en relativo a ese antepasado, así que un panel escrito
  dentro del encabezado se mediría contra una franja de 60px. Desde el `body` se mide contra la
  ventana en cualquier motor, y con `z-[60]` queda por encima del encabezado y de la barra
  inferior, que son `z-index: 50` y si no se pintarían sobre el diálogo y seguirían pulsables.
  Por lo mismo, los altos del marco (`--app-header-height`, `--app-navigation-height`) viven en
  `:root` y no en `.app-shell`: desde el `body` no se heredarían.
- **Texto largo en español antes que letra pequeña**: las etiquetas de tarjeta envuelven con
  `break-words` y `leading-snug`, y el espaciado entre letras de las mayúsculas se reserva para
  `sm:`. En un móvil de 360px una tarjeta crece a lo alto; nunca se aprieta el texto ni se
  reduce la escala.
- **Arrastrar es un gesto de puntero, no de scroll**: la sopa de letras, Trazos y Colorear
  escuchan `pointerdown` / `pointermove` / `pointerup`, que cubren ratón, dedo y Apple Pencil
  con el mismo código, y llaman a `setPointerCapture` para que el trazo siga aunque el dedo se
  salga del tablero. Su contenedor lleva `touch-action: none` (`.word-search-board`,
  `.tracing-board`, `.coloring-board`): sin eso el navegador se queda el gesto vertical como
  scroll y no llega ni un `pointermove`. Colorear además pide los puntos intermedios con
  `getCoalescedEvents`: el Pencil va más rápido que la pantalla, y sin ellos una curva sale a
  trompicones.
- **Un solo diálogo de confirmación**: `ConfirmDialog` (título, descripción, confirmar,
  cancelar, `destructive`), con Escape y devolución del foco. `ExitDialog` es una capa fina
  sobre él, con una tabla de textos por `variant` (`lesson` y `game`) y un único destino, el
  panal. No crear un modal nuevo para la siguiente confirmación.
- **Borrar progreso**: `clearProgress()` quita solo `bintuitive-progress`. Nunca
  `localStorage.clear()`: las preferencias y el perfil viven en sus propias claves y no se
  tocan. Quien borra su progreso no pide cambiar de idioma ni dejar de llamarse como se llama.
- `storage.ts` modela el progreso de **categorías** (`levelByCategory`), el de Word Scramble
  (`wordScramble`), el de Word Search (`wordSearch`) y el de Trazos (`tracing`), cada uno en su
  propio campo opcional y sin compartir datos. `visual` y `typing` no persisten nada. Parejas
  (`memory`) sí, pero **solo en el modelo nuevo**: no guardaba nada antes, así que no tiene
  campos de la versión 1 ni puente. Su mejor tiempo se guarda con el escalón en que se hizo
  (`fastestLevel`): tres parejas se terminan en un tercio del tiempo que ocho, y sin el nivel
  repetir el primero dejaría un récord imbatible.
  Trazos es el único que acumula —ejercicios, estrellas e intentos— y lo hace con
  `saveTracingResult`, que recibe lo que pasó en una sesión y suma sobre lo guardado; el juego
  no tiene que leer antes para escribir después. Sus estrellas son suyas y no tocan
  `totalStars`. Cuántos niveles tiene Trazos lo sabe `tracingGame.ts` y solo él: `storage.ts`
  guarda el nivel tal cual y el juego lo recorta con `clampTracingLevel` al empezar, para no
  repetir el número en dos sitios. Para añadir persistencia a un
  juego, extender `Progress` con un campo opcional y normalizarlo al leer, como hacen
  `normalizeWordScramble` y `normalizeWordSearch`: `getProgress` debe tolerar el campo
  ausente en datos ya guardados.
- **Los juegos de palabras recuerdan lo que ya salió** para no repetirlo entre partidas:
  `wordScrambleRecent` y `wordSearchRecent`, dos listas de ids separadas (de la más antigua a
  la más reciente) que no son progreso y por eso no pasan por `byGrade`. Cuántas se recuerdan
  lo sabe cada lib (`WORD_SCRAMBLE_RECENT_LIMIT`, `WORD_SEARCH_RECENT_LIMIT`) y `storage.ts`
  las guarda tal cual. Se escriben al sacar cada palabra o tablero, no al terminar: lo visto
  ya se vio aunque se abandone. Al elegir, **el nivel pesa más que la novedad**: una palabra
  reciente del nivel pedido va antes que una nueva de otro nivel, y entre recientes vuelve
  primero la más antigua. `validate:content` exige palabras suficientes por nivel para que
  eso casi nunca haga falta.
- **El progreso tiene dos modelos vivos, y es temporal.** `Progress` guarda a la vez los campos
  de la versión 1 —`levelByCategory`, `wordScramble`, `wordSearch`, `tracing`— y el modelo nuevo
  `byGrade`, con la dificultad 1-5, el desbloqueo y las marcas tipadas de cada actividad. Las
  lecciones siguen escribiendo **solo** en los campos de la versión 1; **Trazos, Word Scramble y
  Word Search ya escriben en los dos a la vez**, con exactamente los mismos totales, que es lo que
  impide que la proyección les sume una sesión dos veces o les duplique marcas; y **Parejas y
  Colorear escriben solo en el nuevo**, porque antes no guardaban nada. Los dos de palabras
  tenían tres niveles y tienen cinco: sus escalones 1 a 3 son los tres de antes, idénticos, así
  que el nivel guardado se proyecta tal cual y nadie pierde lo que tenía abierto; y su espejo de
  la versión 1 guarda lo desbloqueado **recortado a 3** (`legacyWordLevel`), porque el código
  anterior lee cualquier otro número como un 1. `projectLegacyProgress`
  proyecta lo antiguo sobre `byGrade` en **cada lectura**, no una vez, que es lo que impide que
  los dos modelos discrepen. La dirección es siempre 1 → 2 y un dato antiguo **nunca** rebaja uno nuevo:
  las marcas se juntan por su mejor valor, el desbloqueo y las estrellas solo suben, y lo que el
  modelo antiguo no sabía medir llega como `null` y no borra nada. Todo el progreso anterior vive
  bajo la clave `unassigned`, que no es un grado: atribuirlo a Pre-K sería inventarle un curso a
  quien no lo ha elegido. Cuándo se puede retirar el puente está escrito sobre
  `projectLegacyProgress`, y `npm run check:migration` es lo que lo protege: si se toca el
  progreso, ese comando tiene que seguir en verde.
- **Campo heredado**: `Progress.wordPuzzle` es el nombre que tenía Word Scramble antes de
  distinguirlo de la futura sopa de letras. `getWordScrambleProgress` lo lee como respaldo y
  las escrituras van solo a `wordScramble`; el campo antiguo se conserva por si se revierte
  el despliegue. No escribir en él desde código nuevo.
- **Nombres de los juegos de palabras**: son dos juegos distintos y no deben mezclarse.
  `scramble` (Word Scramble / Ordena la palabra) es *ordenar las letras de una palabra*;
  `search` (Word Search / Sopa de letras) es *encontrar palabras en una cuadrícula*. Cada uno
  tiene su id, su ruta (`/game/word-scramble` y `/game/word-search`), su lib, su banco de
  palabras y su prefijo de claves i18n (`scramble*` y `search*`). Nunca reutilizar el prefijo
  genérico `word*` para ninguno de los dos, ni compartir banco o progreso entre ellos.
- Lo único compartido entre los dos juegos de palabras es `letters.ts` (`getWordLetters`) y
  `useSpeakAfterSound`. Cualquier otra cosa en común es señal de acoplamiento. Ya no comparten
  `nextLevel`: desde que el nivel se elige en `LevelPicker`, ninguno lo mueve a mitad de
  partida.
- **Los juegos de palabras crecen cambiando de mecánica a partir del 4.** No caben palabras
  más largas en un móvil, así que el banco distingue el **largo** de la palabra (`tier`, 1-3) del
  **escalón** (1-5), y cada tabla (`WORD_SCRAMBLE_LEVELS`, `WORD_SEARCH_LEVELS`) dice de qué
  largos saca cada escalón. En Word Scramble el 4 añade dos letras que no son de la palabra y el 5
  tres, y además esconde el dibujo: queda la pista, que el botón de escuchar lee en vez de la
  palabra. En Word Search el 4 y el 5 enseñan en la lista el dibujo y un hueco por letra en vez de
  la palabra escrita, ordenados por largo para no soplar la primera letra.
- **Los bancos siguen separados**, y así deben seguir por ahora: preguntas (`questions.ts` en
  español + `localization.ts` en inglés), Word Scramble y Word Search (bilingües, cada uno el
  suyo, sin correspondencia entre idiomas), frases de Typing, símbolos de Visual, dibujos de
  Parejas y ejercicios de Trazos. El de Trazos tiene la forma de una fila de base de datos
  —id, nivel, categoría, salida, destino y tipo de camino— justamente para que mañana pueda
  venir de una: lo único que habría que cambiar es de dónde sale la tabla, no el juego. No hay banco
  central y no toca unificarlos hasta que estén decididos los rangos de edad y llegue el
  PowerPoint revisado.
- **`npm run validate:content`** comprueba las invariantes que cada banco ya asume: ids únicos,
  `answerId` existente, traducciones inglesas presentes y sin huérfanas, NFC y alfabeto por
  idioma, longitud de palabra compatible con su nivel o con el tamaño de su tablero, forma de
  camino compatible con el nivel que dice tener en Trazos, contenido suficiente para formar
  una sesión, que cada opción tenga algo que enseñar, que el `imageSrc` que dice tener exista
  de verdad en `public/art/` —la ruta se escribe a mano y una errata deja la opción invisible
  en producción— y que el inglés no le ponga etiqueta a una opción que en español no la lleva. Compila sin `lib: ["DOM"]` a propósito: el validador solo alcanza contenido puro,
  así que un banco no puede acabar importando código de navegador. Es estructural y tarda menos de dos segundos: no genera
  tableros ni simula partidas. Compila con `tsconfig.validate.json` a `.content-check/`
  (ignorado) y ejecuta con un resolutor mínimo del alias `@/`, porque `tsc` lo deja tal cual en
  la salida. Al añadir contenido, ejecutarlo antes de `npm run build`.
- Ningún juego independiente suma a `totalStars` ni a `sessions`: esas métricas son de las
  lecciones de preguntas y `/progress` solo muestra esas.
- `speech.ts` (Web Speech API) lo usan la ruta `/game` de preguntas, los dos juegos de
  palabras —que pronuncian la palabra encontrada o completada—, Parejas, que dice el nombre
  del dibujo al descubrir una pareja, y Trazos, que dice la palabra de la figura al terminar el
  camino. Trazos además la enseña escrita con su traducción pequeña debajo, y la locución va
  en el idioma de la interfaz: la voz se elige por idioma, y decir Dog con voz española no
  enseña a pronunciar nada. Nadie programa esa locución a
  mano: se usa `useSpeakAfterSound`, que ya trae el retraso tras el sonido de acierto (el
  `AudioContext` de `sounds.ts` se traga la voz si arrancan a la vez), la comprobación de
  `isMuted()` al disparar y no al programar, una sola locución pendiente a la vez y el corte al
  desmontar. Su `cancel()` entra en el `clearTimers` del juego, así que empezar sesión, cambiar
  de idioma, abrir la ayuda o salir callan lo pendiente. Es la única cosa que comparten Word
  Scramble y Word Search además de `getWordLetters`, y lo comparten porque el problema es de
  iOS, no de la mecánica.
- Los comentarios existentes en el código están en español; mantener ese idioma en el código.
