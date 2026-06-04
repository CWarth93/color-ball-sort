import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useState } from 'react';

const PhaserBoard = dynamic(() => import('../components/PhaserBoard'), { ssr: false });

const colors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];
const jarCapacity = 3;
const ballsPerColor = 3;
const jarCount = 6;

const shuffle = <T,>(items: T[]) => {
	const shuffledItems = [...items];

	for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
	}

	return shuffledItems;
};

const hasMixedJar = (jars: string[][]) => jars.some((jar) => new Set(jar).size > 1);

const cloneJars = (jars: string[][]) => jars.map((jar) => [...jar]);

const createFallbackLevel = () => [
	[colors[0], colors[1], colors[2]],
	[colors[1], colors[2], colors[3]],
	[colors[2], colors[3], colors[4]],
	[colors[3], colors[4], colors[0]],
	[colors[4], colors[0], colors[1]],
	[],
];

const calculateMinimumTurns = (jars: string[][]) => {
	let mostBallsAlreadyInFinalJars = 0;

	const assignColorToJar = (colorIndex: number, usedJarIndexes: Set<number>, keptBalls: number) => {
		if (colorIndex === colors.length) {
			mostBallsAlreadyInFinalJars = Math.max(mostBallsAlreadyInFinalJars, keptBalls);
			return;
		}

		for (let jarIndex = 0; jarIndex < jarCount; jarIndex += 1) {
			if (usedJarIndexes.has(jarIndex)) {
				continue;
			}

			usedJarIndexes.add(jarIndex);
			assignColorToJar(colorIndex + 1, usedJarIndexes, keptBalls + jars[jarIndex].filter((color) => color === colors[colorIndex]).length);
			usedJarIndexes.delete(jarIndex);
		}
	};

	assignColorToJar(0, new Set<number>(), 0);

	return colors.length * ballsPerColor - mostBallsAlreadyInFinalJars;
};

const createSolvedLevel = () => [...colors.map((color) => Array.from({ length: ballsPerColor }, () => color)), []];

const createLevel = () => {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		let nextJars = createSolvedLevel();
		const seenStates = new Set([nextJars.map((jar) => jar.join(',')).join('|')]);
		const targetTurns = 8 + Math.floor(Math.random() * 3);

		for (let turn = 0; turn < targetTurns; turn += 1) {
			const candidates: string[][][] = [];

			for (let sourceJar = 0; sourceJar < jarCount; sourceJar += 1) {
				if (nextJars[sourceJar].length === 0) {
					continue;
				}

				for (let targetJar = 0; targetJar < jarCount; targetJar += 1) {
					if (sourceJar === targetJar || nextJars[targetJar].length >= jarCapacity) {
						continue;
					}

					const candidateJars = cloneJars(nextJars);
					const movingBall = candidateJars[sourceJar].pop();

					if (!movingBall) {
						continue;
					}

					candidateJars[targetJar].push(movingBall);

					const stateKey = candidateJars.map((jar) => jar.join(',')).join('|');
					if (!seenStates.has(stateKey) && calculateMinimumTurns(candidateJars) === turn + 1) {
						candidates.push(candidateJars);
					}
				}
			}

			if (candidates.length === 0) {
				break;
			}

			nextJars = shuffle(candidates)[0];
			seenStates.add(nextJars.map((jar) => jar.join(',')).join('|'));
		}

		const minimumTurns = calculateMinimumTurns(nextJars);
		if (minimumTurns === targetTurns && hasMixedJar(nextJars)) {
			return { jars: nextJars, minimumTurns };
		}
	}

	const fallbackJars = createFallbackLevel();
	return { jars: fallbackJars, minimumTurns: calculateMinimumTurns(fallbackJars) };
};

const isLevelSolved = (jars: string[][]) =>
	jars.every((jar) => {
		if (jar.length === 0) {
			return true;
		}

		return jar.length === ballsPerColor && jar.every((color) => color === jar[0]);
	});

type DragState = {
	sourceJar: number;
	color: string;
	x: number;
	y: number;
};

export default function HomePage() {
	const [jars, setJars] = useState(() => createFallbackLevel());
	const [initialJars, setInitialJars] = useState(() => createFallbackLevel());
	const [turnHistory, setTurnHistory] = useState<string[][][]>([]);
	const [moveBudget, setMoveBudget] = useState(() => calculateMinimumTurns(createFallbackLevel()));
	const [movesUsed, setMovesUsed] = useState(0);
	const [dragSourceJar, setDragSourceJar] = useState<number | null>(null);
	const [hoverJar, setHoverJar] = useState<number | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [level, setLevel] = useState(1);
	const [boardReady, setBoardReady] = useState(false);
	const [showLevelComplete, setShowLevelComplete] = useState(false);
	const [showLevelFailed, setShowLevelFailed] = useState(false);

	useEffect(() => {
		const nextLevel = createLevel();

		setInitialJars(cloneJars(nextLevel.jars));
		setJars(nextLevel.jars);
		setMoveBudget(nextLevel.minimumTurns);
		setMovesUsed(0);
		setTurnHistory([]);
		setBoardReady(true);
	}, []);

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
		if (showLevelComplete || showLevelFailed || ballIndex !== jars[jarIndex].length - 1) {
			return;
		}

		event.preventDefault();
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

	const completeLevel = () => {
		const nextLevel = level + 1;

		setLevel(nextLevel);
		setShowLevelComplete(true);
		setHoverJar(null);
		setDragState(null);
		setDragSourceJar(null);
		window.setTimeout(() => {
			const generatedLevel = createLevel();

			setInitialJars(cloneJars(generatedLevel.jars));
			setJars(generatedLevel.jars);
			setMoveBudget(generatedLevel.minimumTurns);
			setMovesUsed(0);
			setTurnHistory([]);
			setShowLevelComplete(false);
		}, 1200);
	};

	const failLevel = () => {
		setShowLevelFailed(true);
		setHoverJar(null);
		setDragState(null);
		setDragSourceJar(null);
		window.setTimeout(() => {
			setJars(cloneJars(initialJars));
			setMovesUsed(0);
			setTurnHistory([]);
			setShowLevelFailed(false);
		}, 1800);
	};

	const undoTurn = () => {
		if (showLevelComplete || showLevelFailed || turnHistory.length === 0) {
			return;
		}

		const previousJars = turnHistory[turnHistory.length - 1];

		setJars(cloneJars(previousJars));
		setTurnHistory((currentHistory) => currentHistory.slice(0, -1));
		setMovesUsed((currentMovesUsed) => Math.max(0, currentMovesUsed - 1));
		setDragSourceJar(null);
		setHoverJar(null);
		setDragState(null);
	};

	const dropBall = (targetJar: number, sourceJar = dragSourceJar) => {
		if (showLevelComplete || showLevelFailed || sourceJar === null || sourceJar === targetJar) {
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

		const nextJars = cloneJars(jars);
		const movingBall = nextJars[sourceJar].pop();

		if (!movingBall) {
			return;
		}

		nextJars[targetJar].push(movingBall);
		const nextMovesUsed = movesUsed + 1;

		setTurnHistory((currentHistory) => [...currentHistory, cloneJars(jars)]);
		setMovesUsed(nextMovesUsed);
		setJars(nextJars);
		setDragSourceJar(null);
		setHoverJar(null);
		setDragState(null);

		if (nextMovesUsed > moveBudget) {
			failLevel();
			return;
		}

		if (isLevelSolved(nextJars)) {
			completeLevel();
		}
	};

	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="An endless color ball sorting puzzle built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<main className="gameScreen">
				<h1 className="gameTitle">Color Ball Sort</h1>
				<div className="gameStage">
					<div className="gameControls">
						<button
							className="undoButton"
							data-testid="undo-turn"
							type="button"
							disabled={turnHistory.length === 0 || showLevelComplete || showLevelFailed}
							onClick={undoTurn}
						>
							Undo
						</button>
						<div className="moveHud" aria-label="Move counter">
							Moves <strong data-testid="moves-used">{movesUsed}</strong>/<strong data-testid="moves-max">{moveBudget}</strong>
						</div>
					</div>
					<section
						className="gameBoard"
						data-testid="game-board"
						data-level={level}
						data-ready={boardReady ? 'true' : 'false'}
						aria-label="Color Ball Sort board"
						onPointerUp={(event) => {
							if (event.target === event.currentTarget) {
								setDragSourceJar(null);
							}
						}}
					>
						<PhaserBoard jars={jars} activeJar={dragSourceJar} hoverJar={hoverJar} onBallDrop={(sourceJar, targetJar) => dropBall(targetJar, sourceJar)} />
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
						{showLevelComplete && (
							<div className="levelSuccess" data-testid="level-complete" aria-live="polite">
								<span />
								<span />
								<span />
								<strong>Level complete</strong>
							</div>
						)}
						{showLevelFailed && (
							<div className="levelFailure" data-testid="level-failed" aria-live="polite">
								<span />
								<span />
								<span />
								<strong>Level failed</strong>
							</div>
						)}
						{dragState && <span className="dragGhost" style={{ backgroundColor: dragState.color, left: dragState.x, top: dragState.y }} aria-hidden="true" />}
					</section>
				</div>
				<Link href="/imprint" className="imprintLink">
					Imprint
				</Link>
			</main>
		</>
	);
}
