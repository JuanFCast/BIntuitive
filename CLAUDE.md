# CLAUDE.md

Guía para trabajar en este repositorio.

## Qué es

BIntuitive: juego educativo bilingüe (EN por defecto / ES), touch-first (iPad → móvil → desktop).
Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4. Sin backend, sin cuentas, sin
analytics: todo el estado vive en `localStorage`. Producción en `bintuitive.aumcrsp.com` vía AWS
CloudFront (el workflow de deploy vive fuera del repo).

Comandos: `npm run dev`, `npm run build` (valida tipos), `npm start`. No hay tests ni linter configurado;
`npm run build` es la verificación.

## Arquitectura

**Explore (`/hexagons`) es la única superficie de descubrimiento.** Renderiza
`hexagons = [...categories, ...gameHexagons]`, es decir lecciones y juegos en el mismo panal.
No existe una sección `games`: hubo una (`/games`, de la etapa "worlds", commit `9f1d81d`) que
quedó como superficie duplicada al llegar el panal en `94bc7df`, y se eliminó. Si vuelve a
aparecer un índice paralelo de juegos, es un error de arquitectura.

Dos tipos de contenido conviven en ese panal, y ambos se abren bajo la ruta singular `/game`:

1. **Categorías de preguntas** (`lugares`, `numeros`, `colores`) → todas comparten UNA ruta,
   `/game?hexagon=<slug>`, y el motor genérico `src/lib/gameEngine.ts` + banco `src/data/questions.ts`.
2. **Juegos independientes** (`visual`, `typing`, `word`) → cada uno con su propia ruta
   `/game/<id>`, su propio cliente y su propia lib de lógica pura en `src/lib/`.

Un juego nuevo casi siempre es del tipo 2.

```
src/app/
  layout.tsx            LanguageProvider + AppShell + metadata/OG
  page.tsx              Home
  hexagons/             Explore: panal con todos los Hexagon (única vía de entrada)
  game/                 Todas las rutas de juego
    page.tsx            Categorías de preguntas: /game?hexagon=<slug>
    <id>/page.tsx       Server component: solo metadata + render del cliente
    <id>/<Name>Game.tsx "use client": toda la máquina de estados del juego
  progress/, profile/
src/components/         BrandMark, MuteButton, HexagonCard, AppShell, BottomNavigation...
src/data/
  categories.ts         Category[] + GameHexagon[] → hexagons[] (fuente de verdad del panal)
  questions.ts          Banco de preguntas en español (fuente)
  localization.ts       Copys en inglés: hexágonos, preguntas, opciones
src/lib/
  i18n.tsx              LanguageProvider, useLanguage(), diccionario `messages` en/es
  gameEngine.ts         Selección de pregunta + dificultad adaptativa (categorías)
  visualGame.ts         Lógica pura de Agilidad visual
  typingGame.ts         Lógica pura de Type Rush
  wordPuzzle.ts         Banco bilingüe de palabras, fichas y dificultad de Word Puzzle
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
  (Type Rush añade `"ready"`), con una sección JSX por fase.
- **Rutas de juego no llevan AppShell**: `AppShell` solo envuelve `/`, `/hexagons`, `/progress`
  y `/profile`. Un juego renderiza su propio header con `← backToHexagons` + `<MuteButton />`,
  y siempre vuelve a Explore.
- **Paleta**: tokens `@theme` en `globals.css` — `cream` (fondo), `sun`/`sunsoft` (marca),
  `sky`/`skysoft`, `mint`/`mintsoft` (acierto), `coral`/`coralsoft` (error), `berry`/`berrysoft`, `ink`.
  Botones con `border-b-8` + `active:scale-95` + `active:border-b-4`.
- **Accesibilidad**: `aria-label` en cada control, emoji siempre `aria-hidden="true"` acompañado
  de texto o label; objetivos táctiles `min-h-12` o más.
- **Sonido**: `playCorrectSound` / `playWrongSound` / `playTapSound` / `playCelebrationSound`;
  todos respetan `isMuted()` internamente, no hay que comprobarlo.
- **Sin dependencias nuevas**: el proyecto solo depende de Next/React. Nada de librerías de
  animación, estado o UI.

## Cómo agregar un juego nuevo

1. `src/lib/<juego>.ts` — tipos, constantes (rondas, duración, penalizaciones), generación de
   rondas y cálculo de estadísticas. Sin React.
2. `src/app/game/<id>/page.tsx` — server component con `metadata` (`"<Nombre> · BIntuitive"`).
3. `src/app/game/<id>/<Nombre>Game.tsx` — `"use client"`, fases intro/playing/results,
   header con back a `/hexagons` y `MuteButton`.
4. `src/data/categories.ts` — añadir el id al union de `GameHexagon["id"]` y una entrada en
   `gameHexagons` (nombre y descripción **en español**, emoji, `href: "/game/<id>"`).
   Con eso el juego ya aparece en Explore: **no hay ningún índice de juegos que actualizar**.
5. `src/data/localization.ts` — añadir la entrada en inglés a `englishHexagons` (el `Record` es
   exhaustivo sobre `Hexagon["id"]`: si falta, TypeScript falla).
6. `src/lib/i18n.tsx` — añadir todas las claves nuevas a `messages.en` **y** `messages.es`
   (el tipo `MessageKey` sale de `en`, así que faltar en `es` rompe el build).
7. `src/app/globals.css` — **importante**: el panal de `/hexagons` posiciona cada hexágono con
   `.hexagon-card:nth-child(N)` a mano, en dos layouts (móvil 2-2-2 y ≥640px 3-3). Hoy está
   cableado para 6 hexágonos; un séptimo exige rehacer esas posiciones en ambos breakpoints.
   La geometría: hexágono pointy-top con `aspect-ratio` 0.8660254 (√3/2), las filas se
   solapan con paso vertical de 3/4 de la altura de la ficha y desplazamiento horizontal de
   media ficha. El `aspect-ratio` de `.hexagons-grid` debe recalcularse con el nuevo número
   de filas y de fichas por fila.
8. `README.md` — actualizar features, estructura y el conteo de hexágonos.
9. `npm run build` para validar tipos y contenido.

Al mover o renombrar una ruta de juego, añadir su `redirect` en `next.config.ts`: la app está
publicada y hay enlaces vivos. Ya hay precedentes ahí (`/worlds`, `/categorias`, `/games`).

## Cosas a tener en cuenta

- `storage.ts` modela el progreso de **categorías** (`levelByCategory`) y el de Word Puzzle
  (`wordPuzzle`, opcional). `visual` y `typing` no persisten nada. Para añadir persistencia a un
  juego, extender `Progress` con un campo opcional y normalizarlo al leer, como hace
  `normalizeWordPuzzle`: `getProgress` debe tolerar el campo ausente en datos ya guardados.
- Ningún juego independiente suma a `totalStars` ni a `sessions`: esas métricas son de las
  lecciones de preguntas y `/progress` solo muestra esas.
- `speech.ts` (Web Speech API) se usa solo en la ruta `/game` de preguntas, no en los juegos.
- Los comentarios existentes en el código están en español; mantener ese idioma en el código.
