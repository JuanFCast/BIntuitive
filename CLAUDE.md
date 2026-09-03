# CLAUDE.md

Guía para trabajar en este repositorio.

## Qué es

BIntuitive: juego educativo bilingüe (EN por defecto / ES), touch-first (iPad → móvil → desktop).
Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4. Sin backend, sin cuentas, sin
analytics: todo el estado vive en `localStorage`. Producción en `bintuitive.aumcrsp.com` vía AWS
CloudFront (el workflow de deploy vive fuera del repo).

Comandos: `npm run dev`, `npm run build` (valida tipos), `npm start`,
`npm run validate:content` (valida el contenido educativo). No hay tests ni linter configurado;
esos dos comandos son la verificación.

## Arquitectura

**Explore (`/hexagons`) es la única superficie de descubrimiento.** Renderiza
`hexagons = [...categories, ...gameHexagons]`, es decir lecciones y juegos en el mismo panal.
No existe una sección `games`: hubo una (`/games`, de la etapa "worlds", commit `9f1d81d`) que
quedó como superficie duplicada al llegar el panal en `94bc7df`, y se eliminó. Si vuelve a
aparecer un índice paralelo de juegos, es un error de arquitectura.

Dos tipos de contenido conviven en ese panal, y ambos se abren bajo la ruta singular `/game`:

1. **Categorías de preguntas** (`lugares`, `numeros`, `colores`) → todas comparten UNA ruta,
   `/game?hexagon=<slug>`, y el motor genérico `src/lib/gameEngine.ts` + banco `src/data/questions.ts`.
2. **Juegos independientes** (`visual`, `typing`, `scramble`, `search`) → cada uno con su propia ruta
   `/game/<id>`, su propio cliente y su propia lib de lógica pura en `src/lib/`.

Un juego nuevo casi siempre es del tipo 2.

```
src/app/
  layout.tsx            LanguageProvider + AppShell + metadata/OG
  siteMetadata.ts       Nombre, descripción y URL: los comparten layout y manifest
  manifest.ts           Manifest de la app instalable (Next lo sirve y lo enlaza)
  (sin page.tsx)        La raíz redirige a /hexagons desde next.config.ts
  hexagons/             Explore: panal con todos los Hexagon (única vía de entrada)
  game/                 Todas las rutas de juego
    page.tsx            Categorías de preguntas: /game?hexagon=<slug>
    <id>/page.tsx       Server component: solo metadata + render del cliente
    <id>/<Name>Game.tsx "use client": toda la máquina de estados del juego
  progress/, profile/
src/components/         BrandMark, MuteButton, HexagonCard, AppShell, AppMenu, GameShell,
                        GameIntro, GameHelp, ResultActions, ResultStat, ConfirmDialog...
src/data/
  categories.ts         Category[] + GameHexagon[] → hexagons[] (fuente de verdad del panal)
  questions.ts          Banco de preguntas en español (fuente)
  localization.ts       Copys en inglés: hexágonos, preguntas, opciones
src/lib/
  i18n.tsx              LanguageProvider, useLanguage(), diccionario `messages` en/es
  gameEngine.ts         Selección de pregunta + dificultad adaptativa (categorías)
  visualGame.ts         Lógica pura de Agilidad visual
  typingGame.ts         Lógica pura de Type Rush
  wordScramble.ts       Banco bilingüe, fichas y dificultad de Word Scramble
  wordSearch.ts         Banco bilingüe, generador de tablero y selección de Word Search
  letters.ts            getWordLetters: partir palabras en letras respetando Unicode/NFC
  clockPause.ts         useClockPause: parar el reloj de un juego mientras la ayuda está abierta
  gameTimers.ts         useGameTimers: esperas cortas congelables (destellos, pausas, transiciones)
  speakAfterSound.ts    useSpeakAfterSound: decir una palabra tras el sonido de acierto
  preferences.ts        useMuted / useTextSize: lectura reactiva de las preferencias
  storage.ts, sounds.ts, speech.ts, language.ts
```

### Convenciones clave

- **Español como fuente, inglés como capa**: `questions.ts` y `categories.ts` están en español;
  `localization.ts` traduce a inglés vía `localizeHexagon` / `localizeQuestion`. Para juegos
  nuevos (no preguntas) el patrón real usado es distinto: los strings viven bilingües en
  `messages` de `i18n.tsx`, y los datos con nombre (símbolos, frases) usan
  `Record<Language, string>` o `Record<Language, string[]>` dentro de su lib.
- **Lógica pura separada de la UI**: constantes, generación de rondas y cálculo de stats van en
  `src/lib/<juego>.ts`; el componente cliente solo orquesta fases y render.
- **Máquina de fases**: los juegos usan `type Phase = "intro" | "playing" | "results"`
  (Type Rush añade `"ready"`), con una sección JSX por fase. La ruta de preguntas tiene las
  mismas tres: entra por la explicación y la sesión —nivel guardado incluido— arranca al
  pulsar Comenzar, no al montar.
- **Instalable**: `manifest.ts` arranca en `/hexagons`, no en `/`, para que abrir desde el
  icono no pase por el redirect. El icono grande es el mismo `app/icon.png` que sirve de
  favicon; el de 192 vive en `public/`. Ninguno se declara `maskable`: el logo llega cerca del
  borde y una máscara circular le cortaría el birrete. iOS no lee `display` del manifest, así
  que el modo standalone en Safari depende de las metas `appleWebApp` de `layout.tsx`.
- **No hay Home**: Explore es la entrada de la aplicación y la barra inferior tiene exactamente
  tres destinos (Explore, Progress, Profile). La raíz `/` no tiene pantalla: redirige a
  `/hexagons` desde `next.config.ts`. Un enlace global que signifique "volver al principio"
  apunta a `/hexagons`, nunca a `/`, para no encadenar un redirect de más.
- **Rutas de juego no llevan AppShell**: `AppShell` solo envuelve `/hexagons`, `/progress`
  y `/profile`. Un juego se envuelve en `<GameShell>`, que pone el `<main>`, el encabezado
  común (casa a `/hexagons`, ayuda y `<MuteButton />`), la pantalla de introducción y la
  ayuda. `GameShell` no tiene nada que ver con `AppShell`; la salida de un juego siempre es
  Explore.
- **Una sola explicación por juego**: el objeto `intro` que recibe `GameShell` es la única
  fuente de contenido, y de ahí salen tanto la pantalla previa a jugar como la ayuda. No
  escribir una segunda explicación en ningún sitio: divergirían.
- **Los resultados hablan el mismo idioma visual**: cada actividad enseña sus propias métricas
  —estrellas en las lecciones, estadísticas en los juegos—, pero la tarjeta (`ResultStat`, con
  un `tone` por juego) y el par de botones del final (`ResultActions`: repetir y volver a
  Explore) se definen una sola vez. No duplicar esos botones en un juego nuevo.
- **Dos superficies, la misma plantilla**: los juegos independientes usan `GameShell` entero.
  La ruta de preguntas tiene encabezado propio (marca, estrellas, pie con progreso y salida
  con confirmación), así que usa `GameShell` solo en su fase `intro` —allí la casa no
  pregunta nada porque aún no hay sesión— y coloca `<GameHelp>` en su propio encabezado. Lo
  que explica cada categoría vive en la tabla `CATEGORY_INTRO`, indexada por `slug` y
  comprobada por TypeScript con `satisfies`: si se añade una categoría sin sus textos, el
  build falla. `GameShell`, `GameIntro` y `GameHelp` no saben qué categorías existen.
- **Ayuda no es reiniciar**: la ayuda se superpone a la partida y no toca `phase`. Volver a
  `"intro"` reiniciaría ronda, tablero, letras colocadas y estadísticas. Un juego con reloj
  pasa `onHelpOpenChange` y usa `useClockPause`: leer la explicación no puede costar tiempo.
- **Con la ayuda abierta la partida está quieta**: las esperas cortas de un juego van por
  `useGameTimers` (`later`, no `setTimeout` suelto), y `onHelpOpenChange` las congela y las
  reanuda con el tiempo que les faltaba. Un `setTimeout` propio seguiría corriendo detrás del
  overlay y cambiaría la carta, la palabra o el tablero mientras el niño lee.
- **La voz nunca arranca sola**: en iOS SpeechSynthesis solo habla como consecuencia directa
  de un gesto, así que el audio de la introducción es un botón, no una reproducción
  automática. `AudioButton` comprueba `isMuted()` en los dos caminos.
- **Paleta**: tokens `@theme` en `globals.css` — `cream` (fondo), `sun`/`sunsoft` (marca),
  `sky`/`skysoft`, `mint`/`mintsoft` (acierto), `coral`/`coralsoft` (error), `berry`/`berrysoft`, `ink`.
  Botones con `border-b-8` + `active:scale-95` + `active:border-b-4`.
- **Accesibilidad**: `aria-label` en cada control, emoji siempre `aria-hidden="true"` acompañado
  de texto o label; objetivos táctiles `min-h-12` o más.
- **Sonido**: `playCorrectSound` / `playWrongSound` / `playTapSound` / `playCelebrationSound`;
  todos respetan `isMuted()` internamente, no hay que comprobarlo.
- **Preferencias**: idioma, sonido y tamaño de texto son globales y cada una tiene su clave
  propia en `localStorage` (`bintuitive-language`, `bintuitive-muted`, `bintuitive-text-size`),
  separadas del progreso educativo. Se editan en un único sitio, `AppMenu` (el menú de la
  cabecera); `Profile` solo las muestra. La verdad sigue en `localStorage`: `storage.ts` avisa
  a quien se suscriba y `useMuted` / `useTextSize` leen con `useSyncExternalStore`, así que no
  hay un segundo estado que pueda desincronizarse.
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
   Todo el render va dentro de `<GameShell intro={{ emoji, title, goal, howTo, example }}
   showIntro={phase === "intro"} startLabel onStart />`, y los hijos son solo las fases de
   juego y resultados: el encabezado, la introducción y la ayuda ya vienen dadas. El
   `example` es un componente propio del juego, pequeño y estático, definido al final de su
   propio archivo como los demás ayudantes de presentación; `GameIntro` solo lo enmarca y
   nunca sabe de qué juego es.
4. `src/data/categories.ts` — añadir el id al union de `GameHexagon["id"]` y una entrada en
   `gameHexagons` (nombre y descripción **en español**, emoji, `href: "/game/<id>"`).
   Con eso el juego ya aparece en Explore: **no hay ningún índice de juegos que actualizar**.
5. `src/data/localization.ts` — añadir la entrada en inglés a `englishHexagons` (el `Record` es
   exhaustivo sobre `Hexagon["id"]`: si falta, TypeScript falla).
6. `src/lib/i18n.tsx` — añadir todas las claves nuevas a `messages.en` **y** `messages.es`
   (el tipo `MessageKey` sale de `en`, así que faltar en `es` rompe el build).
7. `src/app/globals.css` — **importante**: el panal de `/hexagons` posiciona cada hexágono con
   `.hexagon-card:nth-child(N)` a mano, en dos layouts (móvil 2-1-2-1-1 y ≥640px 4-3). Hoy está
   cableado para 7 hexágonos; un octavo exige rehacer esas posiciones en ambos breakpoints.
   En móvil el séptimo va en la columna lateral que le toca en el teselado (no centrado), para
   que el panal se lea incompleto en vez de terminar en columna; un octavo ocuparía justo el
   hueco a su derecha y ahí el `aspect-ratio` ya no cambiaría.
   La geometría: hexágono pointy-top con `aspect-ratio` 0.8660254 (√3/2), las filas se
   solapan con paso vertical de 3/4 de la altura de la ficha y desplazamiento horizontal de
   media ficha. El `aspect-ratio` de `.hexagons-grid` debe recalcularse con el nuevo número
   de filas y de fichas por fila.
8. `README.md` — actualizar features, estructura y el conteo de hexágonos.
9. `npm run build` para validar tipos y contenido.

Al mover o renombrar una ruta de juego, añadir su `redirect` en `next.config.ts`: la app está
publicada y hay enlaces vivos. Ya hay precedentes ahí (`/worlds`, `/categorias`, `/games`).

## Cosas a tener en cuenta

- **Progress solo enseña lo que ya está guardado.** `/progress` lee `getProgress()` y no
  persiste nada nuevo: resumen, nivel por actividad, mejores marcas y las últimas sesiones.
  Agilidad visual y Type Rush no guardan progreso a propósito y aparecen sin métricas, igual
  que una actividad todavía sin jugar. Añadir una métrica a esa pantalla empieza por guardarla,
  no al revés.
- **`getProgress()` devuelve siempre un objeto nuevo.** `saveSession` y las dos de palabras
  escriben sobre lo que devuelve, así que compartir una constante vacía la ensuciaría en la
  primera partida de un dispositivo sin datos.
- **Un solo diálogo de confirmación**: `ConfirmDialog` (título, descripción, confirmar,
  cancelar, `destructive`), con Escape y devolución del foco. `ExitDialog` es una capa fina
  sobre él. No crear un modal nuevo para la siguiente confirmación.
- **Borrar progreso**: `clearProgress()` quita solo `bintuitive-progress`. Nunca
  `localStorage.clear()`: las preferencias viven en sus propias claves y no se tocan.
- `storage.ts` modela el progreso de **categorías** (`levelByCategory`), el de Word Scramble
  (`wordScramble`) y el de Word Search (`wordSearch`), cada uno en su propio campo opcional y
  sin compartir datos. `visual` y `typing` no persisten nada. Para añadir persistencia a un
  juego, extender `Progress` con un campo opcional y normalizarlo al leer, como hacen
  `normalizeWordScramble` y `normalizeWordSearch`: `getProgress` debe tolerar el campo
  ausente en datos ya guardados.
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
- Lo único compartido entre los dos juegos de palabras es `letters.ts` (`getWordLetters`),
  `nextLevel` de `gameEngine.ts` y `useSpeakAfterSound`. Cualquier otra cosa en común es señal
  de acoplamiento.
- **Los bancos siguen separados**, y así deben seguir por ahora: preguntas (`questions.ts` en
  español + `localization.ts` en inglés), Word Scramble y Word Search (bilingües, cada uno el
  suyo, sin correspondencia entre idiomas), frases de Typing y símbolos de Visual. No hay banco
  central y no toca unificarlos hasta que estén decididos los rangos de edad y llegue el
  PowerPoint revisado.
- **`npm run validate:content`** comprueba las invariantes que cada banco ya asume: ids únicos,
  `answerId` existente, traducciones inglesas presentes y sin huérfanas, NFC y alfabeto por
  idioma, longitud de palabra compatible con su nivel o con el tamaño de su tablero, y contenido
  suficiente para formar una sesión. Es estructural y tarda menos de dos segundos: no genera
  tableros ni simula partidas. Compila con `tsconfig.validate.json` a `.content-check/`
  (ignorado) y ejecuta con un resolutor mínimo del alias `@/`, porque `tsc` lo deja tal cual en
  la salida. Al añadir contenido, ejecutarlo antes de `npm run build`.
- Ningún juego independiente suma a `totalStars` ni a `sessions`: esas métricas son de las
  lecciones de preguntas y `/progress` solo muestra esas.
- `speech.ts` (Web Speech API) lo usan la ruta `/game` de preguntas y los dos juegos de
  palabras, que pronuncian la palabra encontrada o completada. Nadie programa esa locución a
  mano: se usa `useSpeakAfterSound`, que ya trae el retraso tras el sonido de acierto (el
  `AudioContext` de `sounds.ts` se traga la voz si arrancan a la vez), la comprobación de
  `isMuted()` al disparar y no al programar, una sola locución pendiente a la vez y el corte al
  desmontar. Su `cancel()` entra en el `clearTimers` del juego, así que empezar sesión, cambiar
  de idioma, abrir la ayuda o salir callan lo pendiente. Es la única cosa que comparten Word
  Scramble y Word Search además de `getWordLetters` y `nextLevel`, y lo comparten porque el
  problema es de iOS, no de la mecánica.
- Los comentarios existentes en el código están en español; mantener ese idioma en el código.
