import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageShell } from '../components/PageShell';

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];
const jarCapacity = 4;
const sprintSeconds = 120;

const createLevel = () => [...colors.map((color) => [color, color, color]), []];

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const isLevelSolved = (jars: string[][]) =>
	jars.every((jar) => {
		if (jar.length === 0) {
			return true;
		}

		return jar.every((color) => color === jar[0]);
	});

export default function HomePage() {
	const [hasStarted, setHasStarted] = useState(false);
	const [jars, setJars] = useState(createLevel);
	const [selectedJar, setSelectedJar] = useState<number | null>(null);
	const [moves, setMoves] = useState(0);
	const [level, setLevel] = useState(1);
	const [completedLevels, setCompletedLevels] = useState(0);
	const [score, setScore] = useState(0);
	const [secondsLeft, setSecondsLeft] = useState(sprintSeconds);
	const [showLevelComplete, setShowLevelComplete] = useState(false);

	useEffect(() => {
		if (!hasStarted || secondsLeft <= 0) {
			return undefined;
		}

		const timer = window.setInterval(() => {
			setSecondsLeft((currentSeconds) => Math.max(0, currentSeconds - 1));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [hasStarted, secondsLeft]);

	const selectJar = (jarIndex: number) => {
		if (selectedJar === null) {
			if (jars[jarIndex].length > 0) {
				setSelectedJar(jarIndex);
			}
			return;
		}

		if (selectedJar === jarIndex) {
			setSelectedJar(null);
			return;
		}

		if (jars[jarIndex].length >= jarCapacity) {
			return;
		}

		setJars((currentJars) => {
			const nextJars = currentJars.map((jar) => [...jar]);
			const movingBall = nextJars[selectedJar].pop();

			if (!movingBall) {
				return currentJars;
			}

			nextJars[jarIndex].push(movingBall);
			if (isLevelSolved(nextJars)) {
				setCompletedLevels((currentCompletedLevels) => currentCompletedLevels + 1);
				setScore((currentScore) => currentScore + 100);
				setLevel((currentLevel) => currentLevel + 1);
				setShowLevelComplete(true);
			}
			return nextJars;
		});
		setMoves((currentMoves) => currentMoves + 1);
		setSelectedJar(null);
	};

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
								<strong data-testid="timer">{formatTime(secondsLeft)}</strong>
							</div>
							<div>
								<span>Levels</span>
								<strong data-testid="completed-levels">{completedLevels}</strong>
							</div>
							<div>
								<span>Score</span>
								<strong data-testid="score">{score}</strong>
							</div>
							<div>
								<span>Moves</span>
								<strong data-testid="moves">{moves}</strong>
							</div>
						</section>
						{showLevelComplete && (
							<p className="levelComplete" data-testid="level-complete">
								Level complete
							</p>
						)}
						<section className="gameBoard" data-testid="game-board" data-level={level} aria-label="Color Ball Sort board">
							{jars.map((jar, jarIndex) => (
								<button
									className="gameJar"
									type="button"
									data-testid={`jar-${jarIndex}`}
									data-empty={jar.length === 0 ? 'true' : 'false'}
									data-selected={selectedJar === jarIndex ? 'true' : 'false'}
									key={`jar-${jarIndex}`}
									aria-label={jar.length === 0 ? `Empty helper jar ${jarIndex + 1}` : `Jar ${jarIndex + 1}`}
									onClick={() => selectJar(jarIndex)}
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
