import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

import { PageShell } from '../components/PageShell';

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];

const createLevel = () => [...colors.map((color) => [color, color, color]), []];

export default function HomePage() {
	const [hasStarted, setHasStarted] = useState(false);
	const [jars] = useState(createLevel);

	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="A fast two-minute color ball sorting game built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<PageShell>
				{hasStarted ? (
					<main className="gameScreen">
						<section className="gameHud" aria-label="Sprint stats">
							<div>
								<span>Time</span>
								<strong data-testid="timer">02:00</strong>
							</div>
							<div>
								<span>Levels</span>
								<strong data-testid="completed-levels">0</strong>
							</div>
							<div>
								<span>Score</span>
								<strong data-testid="score">0</strong>
							</div>
							<div>
								<span>Moves</span>
								<strong data-testid="moves">0</strong>
							</div>
						</section>
						<section className="gameBoard" data-testid="game-board" data-level="1" aria-label="Color Ball Sort board">
							{jars.map((jar, jarIndex) => (
								<button
									className="gameJar"
									type="button"
									data-testid={`jar-${jarIndex}`}
									data-empty={jar.length === 0 ? 'true' : 'false'}
									key={`jar-${jarIndex}`}
									aria-label={jar.length === 0 ? `Empty helper jar ${jarIndex + 1}` : `Jar ${jarIndex + 1}`}
								>
									{jar.map((color, ballIndex) => (
										<span
											className="gameBall"
											data-testid="ball"
											data-color={color}
											style={{ backgroundColor: color }}
											key={`${color}-${jarIndex}-${ballIndex}`}
										/>
									))}
								</button>
							))}
						</section>
					</main>
				) : (
					<section className="hero" aria-labelledby="page-title">
						<div className="heroCopy">
							<p className="eyebrow">Next.js + Phaser game sample</p>
							<h1 id="page-title">Color Ball Sort</h1>
							<p className="lede">
								A two-minute sprint puzzle: sort five colors across small jars, clear as many generated levels as possible, and chase a clean high score loop.
							</p>
							<div className="actionRow">
								<button className="primaryButton" type="button" data-testid="start-sprint" onClick={() => setHasStarted(true)}>
									Start Sprint
								</button>
								<Link href="/imprint" className="secondaryLink">
									Imprint
								</Link>
							</div>
						</div>
						<div className="jarPreview" aria-hidden="true">
							{['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa', 'empty'].map((color, jarIndex) => (
								<div className="jar" key={`${color}-${jarIndex}`}>
									{color !== 'empty' &&
										Array.from({ length: 3 }).map((_, ballIndex) => <span className="ball" style={{ backgroundColor: color }} key={`${color}-${ballIndex}`} />)}
								</div>
							))}
						</div>
					</section>
				)}
			</PageShell>
		</>
	);
}
