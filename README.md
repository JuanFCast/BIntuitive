# BeeSmart

BeeSmart is a touch-friendly educational game for curious learners. Players listen to or read a short instruction and tap the correct answer. The experience is designed for iPad first and adapts to phones and desktop browsers.

**Live app:** [beesmart.aumcrsp.com](https://beesmart.aumcrsp.com)

## Features

- **English-first bilingual experience:** English is the default language and Spanish is available from the `EN/ES` switch on every screen.
- **Fully localized gameplay:** interface text, categories, instructions, hints, answers, accessibility labels, and speech all follow the selected language.
- **5 learning hexagons:** Places, Numbers, Colors, Visual Agility, and Type Rush.
- **5-round sessions:** players receive two attempts per question and a helpful hint after the first incorrect answer.
- **Gentle adaptive difficulty:** the level increases after two consecutive first-try answers and decreases after a missed question, moving from 2 to 3 to 4 options.
- **Visual Agility:** a local, touch-first matching challenge where two nine-symbol cards share exactly one symbol and mistakes add a one-second penalty.
- **Type Rush:** a responsive 30-second typing challenge with live speed, accuracy, progress, and mistake feedback in English or Spanish.
- **Bilingual speech:** the Web Speech API automatically selects an English or Spanish voice when available, with a button to repeat each instruction.
- **Positive feedback:** encouraging messages, animations, confetti, and no punitive language.
- **New BeeSmart identity:** a black-and-yellow B mark with a graduation cap is used throughout the product, app icon, and navigation.
- **Social sharing:** Open Graph and Twitter cards use the official BeeSmart brand mark, with favicon and Apple touch icon support.
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
  app/                  # Home, hexagon selection, games, metadata, social cards, and icons
    hexagons/           # Bilingual hexagon selection screen
    game/               # Game route and client-side session state
    games/              # Visual Agility and Type Rush routes
  components/           # Brand mark, hexagon cards, answers, feedback, results...
  data/
    categories.ts       # Base category definitions
    questions.ts        # Spanish source question bank
    localization.ts     # English category, question, option, and accessibility copy
  lib/
    gameEngine.ts       # Question selection and adaptive difficulty
    i18n.tsx            # Language provider and interface translations
    language.ts         # Shared language type
    speech.ts           # English and Spanish speech synthesis
    sounds.ts           # Generated interaction and celebration sounds
    storage.ts          # Progress and mute persistence
    typingGame.ts       # Local typing passages and statistics
    visualGame.ts       # Visual cards, symbols, and matching logic
```

The Visual Agility and Type Rush hexagons adapt the core game mechanics from
[Avíspate](https://github.com/JuanFCast/avispate-visual) and
[TypeRush](https://github.com/JuanFCast/TypeRush). BeeSmart includes only their
local educational gameplay: no wallets, payments, rankings, accounts, blockchain,
or remote backend services are included.

## Localization

The application uses English by default and stores the selected language under `beesmart-language` in `localStorage`.

Interface translations live in `src/lib/i18n.tsx`. Question and category translations live in `src/data/localization.ts`. The original Spanish question bank remains in `src/data/questions.ts`.

When adding a question:

1. Add the Spanish source question and options to `src/data/questions.ts` using the `Question` type.
2. Add the matching English instruction and hint to `englishQuestions` in `src/data/localization.ts`.
3. Add English option labels and accessibility descriptions to `englishOptions` when the option ID is new.
4. Run `npm run build` to verify the content and types.

## Gameplay model

- Each session contains 5 unique questions.
- Each question allows up to 2 attempts.
- Correct first attempts contribute to the difficulty streak.
- Two consecutive first-try answers increase the category level, up to level 3.
- A fully missed question decreases the level, down to level 1.
- Progress is stored locally and the game continues to work if storage is unavailable.

## Deployment

Pushes to the `main` branch trigger the connected Vercel production deployment. The public custom domain is served through AWS CloudFront:

```text
GitHub main → Vercel → AWS CloudFront → beesmart.aumcrsp.com
```

No manual AWS action is normally required for application updates.
