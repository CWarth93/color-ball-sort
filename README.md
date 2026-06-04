# Color Ball Sort

Color Ball Sort is an endless browser puzzle game sample built with Next.js, React, TypeScript, and Phaser.

## Game Concept

- Six jars total with three free slots per level.
- Five colors per stored level.
- Small levels with a low ball count so each round can finish quickly.
- Levels continue endlessly with no timer or score saving.
- A move is valid when the target jar has free space.
- A level is complete when every non-empty jar contains exactly three balls of one color.
- Levels are loaded randomly from MongoDB and store a difficulty plus exact fast path count.

## Tech Stack

- Next.js
- React
- TypeScript
- Phaser
- MongoDB
- Vercel
- Cypress
- Prettier
- ESLint

## User Stories

- As a player, I want the game to start immediately so that I can play without setup friction.
- As a player, I want each level to load randomly from a proven level bank so that I always have a fresh sorting puzzle after finishing the current one.
- As a player, I want to move the top ball from one jar to any jar with free space so that the rules stay fast and easy to understand.
- As a player, I want enough free jar space in every level so that I have room to solve the sorting puzzle.
- As a player, I want small levels with five colors and not too many balls so that each level can be completed quickly.
- As a player, I want the game to detect a finished level only when every non-empty jar has exactly three balls of one color so that progression follows the puzzle rules.
- As a player, I want a clear completion animation before the next generated level appears so that success feels satisfying.
- As a mobile player, I want responsive touch controls and readable jar spacing so that the game works comfortably on phones.
- As a desktop player, I want mouse controls and a stable centered game layout so that the same game feels polished in a browser.
- As a player, I want the move limit to match the exact fast path count so that the level stays fair.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint:check
npm run style:check
npm run test
npm run seed:levels
```

## Local Development

```bash
npm install
npm run dev
```

Set `MONGODB_URI` in `.env` before running the app or seeding levels. The deployed app also accepts `MONGODB_CONNECTION_STRING`.

Open [http://localhost:3000](http://localhost:3000).
