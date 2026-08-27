# BIntuitive

BIntuitive is a touch-friendly educational game for curious learners. Players listen to or read a short instruction and tap the correct answer. The experience is designed for iPad first and adapts to phones and desktop browsers.

**Live app:** [bintuitive.aumcrsp.com](https://bintuitive.aumcrsp.com)

## Features

- **English-first bilingual experience:** English is the default language and Spanish is available from the `EN/ES` switch on every screen.
- **Fully localized gameplay:** interface text, categories, instructions, hints, answers, accessibility labels, and speech all follow the selected language.
- **Explore as the single hub:** every hexagon (lessons and games alike) is discovered and opened from the Explore honeycomb. There is no separate games section.
- **7 learning hexagons:** Places, Numbers, Colors, Visual Agility, Type Rush, Word Scramble, and Word Search.
- **5-round sessions:** players receive two attempts per question and a helpful hint after the first incorrect answer.
- **Gentle adaptive difficulty:** the level increases after two consecutive first-try answers and decreases after a missed question, moving from 2 to 3 to 4 options.
- **Visual Agility:** a local, touch-first matching challenge where two nine-symbol cards share exactly one symbol and mistakes add a one-second penalty.
- **Type Rush:** a responsive 30-second typing challenge with live speed, accuracy, progress, and mistake feedback in English or Spanish.
- **Word Scramble:** a 10-word spelling challenge where players tap large letter tiles in order to build a word, with a picture clue, spoken word, undo and clear controls, and adaptive word length.
- **Word Search:** a three-puzzle session where players trace hidden words with a finger across a generated letter grid, with words running across, down, diagonally, and backwards as the level rises.
- **Bilingual speech:** the Web Speech API automatically selects an English or Spanish voice when available, with a button to repeat each instruction.
- **Positive feedback:** encouraging messages, animations, confetti, and no punitive language.
- **BIntuitive identity:** a black-and-yellow B mark with a graduation cap is used throughout the product, app icon, and navigation.
- **Social sharing:** Open Graph and Twitter cards use the official BIntuitive brand mark, with favicon and Apple touch icon support.
- **Local progress:** total stars, recent sessions, per-category levels, language preference, and mute preference are stored in `localStorage`.
- **Exit confirmation:** a simple confirmation helps prevent accidental exits during a lesson.
- **Privacy-friendly MVP:** no accounts, ads, payments, analytics SDKs, or remote user-data storage.

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Web Speech API and Web Audio API
- Browser `localStorage`

## Run locally

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test on an iPad or phone connected to the same Wi-Fi network, start the development server and open `http://<computer-ip>:3000` in the device browser.

## Production build

```bash
npm run build
npm start
```

The production build validates TypeScript, generates the application routes, and prepares the optimized Next.js output.

## Project structure

```text
src/
  app/                  # Home, Explore, play routes, metadata, social cards, and icons
    hexagons/           # Explore: the honeycomb that lists every hexagon
    game/               # Play routes
      page.tsx          #   Question categories: /game?hexagon=<slug>
      visual/           #   Visual Agility
      typing/           #   Type Rush
      word-scramble/    #   Word Scramble
      word-search/      #   Word Search
  components/           # Brand mark, hexagon cards, answers, feedback, results...
  data/
    categories.ts       # Base category definitions
    questions.ts        # Spanish source question bank
    localization.ts     # English category, question, option, and accessibility copy
  lib/
    gameEngine.ts       # Question selection and adaptive difficulty
    i18n.tsx            # Language provider and interface translations
    language.ts         # Shared language type
    letters.ts          # Unicode-safe letter splitting shared by the word games
    speech.ts           # English and Spanish speech synthesis
    sounds.ts           # Generated interaction and celebration sounds
    storage.ts          # Progress and mute persistence
    typingGame.ts       # Local typing passages and statistics
    visualGame.ts       # Visual cards, symbols, and matching logic
    wordScramble.ts     # Bilingual word bank, letter tiles, and difficulty
    wordSearch.ts       # Bilingual word bank, board generator, and selection
```

The Visual Agility and Type Rush hexagons adapt the core game mechanics from
[Avíspate](https://github.com/JuanFCast/avispate-visual) and
[TypeRush](https://github.com/JuanFCast/TypeRush). BIntuitive includes only their
local educational gameplay: no wallets, payments, rankings, accounts, blockchain,
or remote backend services are included.

## Localization

The application uses English by default and stores the selected language under `bintuitive-language` in `localStorage`.

Interface translations live in `src/lib/i18n.tsx`. Question and category translations live in `src/data/localization.ts`. The original Spanish question bank remains in `src/data/questions.ts`.

When adding a question:

1. Add the Spanish source question and options to `src/data/questions.ts` using the `Question` type.
2. Add the matching English instruction and hint to `englishQuestions` in `src/data/localization.ts`.
3. Add English option labels and accessibility descriptions to `englishOptions` when the option ID is new.
4. Run `npm run build` to verify the content and types.

### Adding a Word Scramble word

The Word Scramble bank is not a translation: each language has its own words in
`WORD_BANK` inside `src/lib/wordScramble.ts`. A new entry needs an `id`, the
`word` in uppercase, an `emoji`, a short `clue` written in that language, and a
`level`: 1 for 3-4 letters, 2 for 5-6 letters, 3 for 7-8 letters.

Spanish words are spelled correctly, accents included: the allowed alphabet is
`A-Z` plus `Á É Í Ó Ú Ñ Ü`, and a word is never simplified to avoid a character
(`ÁRBOL`, not `ARBOL`). Each of those counts as one letter and gets its own
tile, so `PINGÜINO` is eight letters and `Ñ` is never treated as `N`. Words and
clues must be written in NFC (precomposed `Á`, not `A` plus a combining accent);
`getWordLetters` normalizes to NFC before splitting, and it never strips
diacritics.

### Adding a Word Search word

The Word Search bank is its own list in `WORD_SEARCH_BANK` inside
`src/lib/wordSearch.ts`: it is neither the Word Scramble bank nor a
translation of it. A new entry needs an `id`, the `word` in uppercase, an
`emoji` for the word list, and a `level`: 1 for 3-5 letters, 2 for 5-7, 3 for
6-8. A word never exceeds the grid size of its level.

Spanish spelling rules are the same as in Word Scramble: `A-Z` plus
`Á É Í Ó Ú Ñ Ü`, written in NFC, never simplified to dodge a character. Both
games split words with `getWordLetters` from `src/lib/letters.ts`, so `Ñ` is
one letter and never an `N`, and the board fills empty cells with an alphabet
that includes the accented letters in play, so an accent never gives a word
away.

## Gameplay model

Each hexagon type runs its own session length, defined in one place per game.

### Question lessons (Places, Numbers, Colors)

`ROUNDS_PER_SESSION` in `src/lib/gameEngine.ts`.

- Each session contains 5 unique questions.
- Each question allows up to 2 attempts.
- Correct first attempts contribute to the difficulty streak.
- Two consecutive first-try answers increase the category level, up to level 3.
- A fully missed question decreases the level, down to level 1.

### Word Scramble

`WORD_SCRAMBLE_WORDS_PER_SESSION` in `src/lib/wordScramble.ts`.

- Each session contains 10 words, and a word never repeats within a session.
- A word cannot be failed: a wrong letter is rejected and counted as a mistake.
- Two words solved with no mistakes increase the level, up to level 3.
- Three or more mistakes on a single word decrease the level, down to level 1.
- The level and the best "perfect words" score are stored locally.

### Word Search

`WORD_SEARCH_BOARDS_PER_SESSION` in `src/lib/wordSearch.ts`.

- Each session contains 3 generated puzzles, and a word rarely repeats between
  them: the words already used are excluded while the bank has alternatives.
- Level 1 is a 7x7 grid with 4 words running only across and down. Level 2 is
  9x9 with 6 words, diagonals, and some backwards directions. Level 3 is 10x10
  with 7 words in all eight directions.
- A wrong selection is never punished beyond a visual flash and the counter.
  Re-selecting a word already found is ignored, not counted as a mistake.
- Two puzzles solved with no wrong selections increase the level, up to 3.
- Five or more wrong selections in a single puzzle decrease the level, down to 1.
- The level and the best "words found" score are stored locally, in their own
  `wordSearch` field: Word Scramble progress is never read or overwritten.

Progress is stored locally in every case, and the games keep working if storage
is unavailable.

## Deployment

The production application is available at
[bintuitive.aumcrsp.com](https://bintuitive.aumcrsp.com). The public custom
domain is delivered through AWS CloudFront. Vercel is not part of the current
deployment architecture.

```text
AWS deployment → AWS CloudFront → bintuitive.aumcrsp.com
```

The AWS deployment workflow and infrastructure configuration are managed
outside this repository; no deployment-as-code configuration is currently
tracked here.

CloudFront currently delivers the application, but BIntuitive does not yet
have a remote application backend, user authentication, or database. Progress
and preferences continue to be stored locally in the browser.
