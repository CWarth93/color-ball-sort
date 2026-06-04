import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useState } from 'react';

import { PageShell } from '../components/PageShell';

const PhaserBoard = dynamic(() => import('../components/PhaserBoard'), { ssr: false });

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];
const jarCapacity = 4;
const sprintSeconds = 120;

const createLevel = (levelNumber = 1) => {
	const offset = (levelNumber - 1) % colors.length;
	const levelColors = colors.map((_, index) => colors[(index + offset) % colors.length]);

	return [
		[levelColors[1], levelColors[1], levelColors[0]],
		[levelColors[0], levelColors[0]],
		[levelColors[2], levelColors[2], levelColors[2]],
		[levelColors[3], levelColors[3], levelColors[3]],
		[levelColors[4], levelColors[4], levelColors[4]],
		[],
	];
};

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

type DragState = {
	sourceJar: number;
	color: string;
	x: number;
	y: number;
};

export default function HomePage() {
	const [hasStarted, setHasStarted] = useState(false);
	const [jars, setJars] = useState(createLevel);
	const [dragSourceJar, setDragSourceJar] = useState<number | null>(null);
	const [hoverJar, setHoverJar] = useState<number | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [moves, setMoves] = useState(0);
	const [level, setLevel] = useState(1);
	const [completedLevels, setCompletedLevels] = useState(0);
	const [score, setScore] = useState(0);
	const [secondsLeft, setSecondsLeft] = useState(sprintSeconds);
	const [showLevelComplete, setShowLevelComplete] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [leaderboardStatus, setLeaderboardStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [motionEnabled, setMotionEnabled] = useState(true);
	const isFinished = hasStarted && secondsLeft === 0;

	useEffect(() => {
		setSoundEnabled(window.localStorage.getItem('sound-enabled') !== 'false');
		setMotionEnabled(window.localStorage.getItem('motion-enabled') !== 'false');
	}, []);

	useEffect(() => {
		if (!hasStarted) {
			return undefined;
		}

		const timer = window.setInterval(() => {
			setSecondsLeft((currentSeconds) => Math.max(0, currentSeconds - 1));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [hasStarted]);

	useEffect(() => {
		if (!dragState) {
			return undefined;
		}

		const getHoveredJar = (clientX: number, clientY: number) => {
			const element = document.elementFromPoint(clientX, clientY);
			const jarElement = element?.closest<HTMLElement>('[data-jar-index]');
			const jarIndex = jarElement?.dataset.jarIndex;

			return jarIndex === undefined ? null : Number(jarIndex);
		};
		const moveDrag = (event: globalThis.PointerEvent) => {
			setDragState((currentDragState) => (currentDragState ? { ...currentDragState, x: event.clientX, y: event.clientY } : currentDragState));
			setHoverJar(getHoveredJar(event.clientX, event.clientY));
		};
		const endDrag = (event: globalThis.PointerEvent) => {
			const targetJar = getHoveredJar(event.clientX, event.clientY);

			if (targetJar !== null) {
				dropBall(targetJar, dragState.sourceJar);
			} else {
				setDragSourceJar(null);
			}
			setHoverJar(null);
			setDragState(null);
		};

		window.addEventListener('pointermove', moveDrag);
		window.addEventListener('pointerup', endDrag);

		return () => {
			window.removeEventListener('pointermove', moveDrag);
			window.removeEventListener('pointerup', endDrag);
		};
	}, [dragState, jars]);

	const startBallDrag = (event: ReactPointerEvent, jarIndex: number, ballIndex: number) => {
		if (ballIndex !== jars[jarIndex].length - 1) {
			return;
		}

		event.preventDefault();
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			// Synthetic pointer events in tests do not always create an active capture target.
		}
		setDragSourceJar(jarIndex);
		setHoverJar(jarIndex);
		setDragState({
			sourceJar: jarIndex,
			color: jars[jarIndex][ballIndex],
			x: event.clientX,
			y: event.clientY,
		});
	};

	const moveDragOverJar = (jarIndex: number) => {
		if (!dragState) {
			return;
		}

		setHoverJar(jarIndex);
	};

	const endDragOverJar = (event: ReactPointerEvent, jarIndex: number) => {
		if (!dragState) {
			return;
		}

		event.stopPropagation();
		dropBall(jarIndex, dragState.sourceJar);
	};

	const dropBall = (targetJar: number, sourceJar = dragSourceJar) => {
		if (sourceJar === null || sourceJar === targetJar) {
			setDragSourceJar(null);
			setHoverJar(null);
			setDragState(null);
			return;
		}

		if (jars[targetJar].length >= jarCapacity) {
			setDragSourceJar(null);
			setHoverJar(null);
			setDragState(null);
			return;
		}

		setJars((currentJars) => {
			const nextJars = currentJars.map((jar) => [...jar]);
			const movingBall = nextJars[sourceJar].pop();

			if (!movingBall) {
				return currentJars;
			}

			nextJars[targetJar].push(movingBall);
			if (isLevelSolved(nextJars)) {
				const nextLevel = level + 1;

				setCompletedLevels((currentCompletedLevels) => currentCompletedLevels + 1);
				setScore((currentScore) => currentScore + 100);
				setLevel(nextLevel);
				setShowLevelComplete(true);
				return createLevel(nextLevel);
			}
			return nextJars;
		});
		setMoves((currentMoves) => currentMoves + 1);
		setDragSourceJar(null);
		setHoverJar(null);
		setDragState(null);
	};

	const toggleSound = () => {
		setSoundEnabled((currentValue) => {
			const nextValue = !currentValue;
			window.localStorage.setItem('sound-enabled', String(nextValue));
			return nextValue;
		});
	};

	const toggleMotion = () => {
		setMotionEnabled((currentValue) => {
			const nextValue = !currentValue;
			window.localStorage.setItem('motion-enabled', String(nextValue));
			return nextValue;
		});
	};

	const submitLeaderboardScore = async () => {
		setLeaderboardStatus('saving');
		try {
			const response = await fetch('/api/leaderboard', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					playerName,
					score,
					completedLevels,
					moves,
				}),
			});

			if (!response.ok) {
				throw new Error('Leaderboard submission failed.');
			}

			setLeaderboardStatus('saved');
		} catch {
			setLeaderboardStatus('error');
		}
	};

	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="A fast two-minute color ball sorting game built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<PageShell>
				<div className="settingsBar">
					<button className="secondaryButton" data-testid="settings" type="button" onClick={() => setSettingsOpen((currentValue) => !currentValue)}>
						Settings
					</button>
					{settingsOpen && (
						<div className="settingsPanel" aria-label="Settings">
							<button data-testid="sound-toggle" type="button" aria-pressed={soundEnabled} onClick={toggleSound}>
								Sound {soundEnabled ? 'On' : 'Off'}
							</button>
							<button data-testid="motion-toggle" type="button" aria-pressed={motionEnabled} onClick={toggleMotion}>
								Motion {motionEnabled ? 'On' : 'Off'}
							</button>
						</div>
					)}
				</div>
				{isFinished ? (
					<main className="resultsScreen" data-testid="results">
						<p className="eyebrow">Sprint complete</p>
						<h1>Results</h1>
						<div className="resultGrid">
							<div>
								<span>Levels</span>
								<strong data-testid="final-levels">{completedLevels}</strong>
							</div>
							<div>
								<span>Score</span>
								<strong data-testid="final-score">{score}</strong>
							</div>
							<div>
								<span>Moves</span>
								<strong data-testid="final-moves">{moves}</strong>
							</div>
						</div>
						<form
							className="leaderboardForm"
							onSubmit={(event) => {
								event.preventDefault();
								submitLeaderboardScore();
							}}
						>
							<label htmlFor="leaderboard-name">Name</label>
							<div>
								<input
									id="leaderboard-name"
									data-testid="leaderboard-name"
									value={playerName}
									onChange={(event) => setPlayerName(event.target.value)}
									placeholder="Your name"
								/>
								<button data-testid="submit-score" type="submit" disabled={leaderboardStatus === 'saving' || playerName.trim().length === 0}>
									Submit score
								</button>
							</div>
							{leaderboardStatus === 'saved' && <p>Score submitted.</p>}
							{leaderboardStatus === 'error' && <p>Score could not be submitted.</p>}
						</form>
					</main>
				) : hasStarted ? (
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
						<section
							className="gameBoard"
							data-testid="game-board"
							data-level={level}
							aria-label="Color Ball Sort board"
							onPointerUp={(event) => {
								if (event.target === event.currentTarget) {
									setDragSourceJar(null);
								}
							}}
						>
							<PhaserBoard
								jars={jars}
								activeJar={dragSourceJar}
								hoverJar={hoverJar}
								onBallDrop={(sourceJar, targetJar) => dropBall(targetJar, sourceJar)}
								motionEnabled={motionEnabled}
							/>
							{jars.map((jar, jarIndex) => (
								<button
									className="gameJar"
									type="button"
									data-testid={`jar-${jarIndex}`}
									data-jar-index={jarIndex}
									data-empty={jar.length === 0 ? 'true' : 'false'}
									data-selected={dragSourceJar === jarIndex ? 'true' : 'false'}
									data-hovered={hoverJar === jarIndex ? 'true' : 'false'}
									key={`jar-${jarIndex}`}
									aria-label={jar.length === 0 ? `Empty helper jar ${jarIndex + 1}` : `Jar ${jarIndex + 1}`}
									onPointerEnter={() => setHoverJar(jarIndex)}
									onPointerMove={() => moveDragOverJar(jarIndex)}
									onPointerLeave={() => setHoverJar((currentHoverJar) => (currentHoverJar === jarIndex ? null : currentHoverJar))}
									onPointerUp={(event) => endDragOverJar(event, jarIndex)}
								>
									{jar.map((color, ballIndex) => (
										<span
											className="gameBall"
											data-testid="ball"
											data-color={color}
											data-top={ballIndex === jar.length - 1 ? 'true' : 'false'}
											draggable={ballIndex === jar.length - 1}
											onDragStart={(event) => {
												event.preventDefault();
											}}
											onPointerDown={(event) => startBallDrag(event, jarIndex, ballIndex)}
											style={{ backgroundColor: color }}
											key={`${color}-${jarIndex}-${ballIndex}`}
										/>
									))}
								</button>
							))}
							{dragState && <span className="dragGhost" style={{ backgroundColor: dragState.color, left: dragState.x, top: dragState.y }} aria-hidden="true" />}
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
