# Color Ball Sort

Color Ball Sort is an endless browser puzzle game sample built with Next.js, React, TypeScript, and Phaser.

## Game Concept

- Six jars total: five color jars and one empty helper jar.
- Five colors per generated level.
- Small levels with a low ball count so each round can finish quickly.
- Levels continue endlessly with no timer or score saving.
- A move is valid when the target jar has free space.
- A level is complete when every non-empty jar contains exactly three balls of one color.

## Tech Stack

- Next.js
- React
- TypeScript
- Phaser
- Vercel
- Cypress
- Prettier
- ESLint

## User Stories

- As a player, I want the game to start immediately so that I can play without setup friction.
- As a player, I want each level to generate automatically so that I always have a fresh sorting puzzle after finishing the current one.
- As a player, I want to move the top ball from one jar to any jar with free space so that the rules stay fast and easy to understand.
- As a player, I want one empty helper jar in every level so that I have enough room to solve the sorting puzzle.
- As a player, I want small levels with five colors and not too many balls so that each level can be completed quickly.
- As a player, I want the game to detect a finished level only when every non-empty jar has exactly three balls of one color so that progression follows the puzzle rules.
- As a player, I want a clear completion animation before the next generated level appears so that success feels satisfying.
- As a mobile player, I want responsive touch controls and readable jar spacing so that the game works comfortably on phones.
- As a desktop player, I want mouse controls and a stable centered game layout so that the same game feels polished in a browser.
- As a player, I want sound and motion settings to persist so that the game respects my preferences between sessions.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint:check
npm run style:check
npm run test
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
