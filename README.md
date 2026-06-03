# Color Ball Sort

Color Ball Sort is a fast browser puzzle game sample built with Next.js, React, TypeScript, and Phaser.

## Game Concept

- Six jars total: five color jars and one empty helper jar.
- Five colors per generated level.
- Small levels with a low ball count so each round can finish quickly.
- The player has two minutes to complete as many generated levels as possible.
- A move is valid when the target jar has free space.
- A level is complete when every non-empty jar contains only one color.

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

- As a player, I want to start a two-minute sprint immediately so that I can play a quick session without setup friction.
- As a player, I want each level to generate automatically so that I always have a fresh sorting puzzle after finishing the current one.
- As a player, I want to move the top ball from one jar to any jar with free space so that the rules stay fast and easy to understand.
- As a player, I want one empty helper jar in every level so that I have enough room to solve the sorting puzzle.
- As a player, I want small levels with five colors and not too many balls so that each level can be completed quickly.
- As a player, I want the game to detect a finished level when every non-empty jar contains only one color so that progression feels clear and automatic.
- As a player, I want to see my remaining time, completed levels, score, and moves so that I can understand my performance during the sprint.
- As a player, I want completed levels to advance instantly while the global timer keeps running so that the game feels continuous and competitive.
- As a player, I want a final results screen after two minutes so that I can review my completed levels, score, and total moves.
- As a returning player, I want my best score to be saved so that I have a clear target to beat in later sessions.
- As a competitive player, I want leaderboard data stored in MongoDB so that scores can be compared across real submitted sessions.
- As a mobile player, I want responsive touch controls and readable jar spacing so that the game works comfortably on phones.
- As a desktop player, I want mouse controls and a stable centered game layout so that the same game feels polished in a browser.
- As a player, I want sound and motion settings to persist so that the game respects my preferences between sessions.
- As a developer reviewing the project, I want the game deployed on Vercel so that I can open and test the production version quickly.

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
