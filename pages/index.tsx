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

const createFallbackLevel = () => [
	[colors[0], colors[1], colors[2]],
	[colors[1], colors[2], colors[3]],
	[colors[2], colors[3], colors[4]],
	[colors[3], colors[4], colors[0]],
	[colors[4], colors[0], colors[1]],
	[],
];

const createLevel = () => {
	const balls = colors.flatMap((color) => Array.from({ length: ballsPerColor }, () => color));

	for (let attempt = 0; attempt < 20; attempt += 1) {
		const emptyJarIndex = Math.floor(Math.random() * jarCount);
		const shuffledBalls = shuffle(balls);
		const nextJars = Array.from({ length: jarCount }, () => [] as string[]);
		const playableJarIndexes = Array.from({ length: jarCount }, (_, jarIndex) => jarIndex).filter((jarIndex) => jarIndex !== emptyJarIndex);

		playableJarIndexes.forEach((jarIndex, playableIndex) => {
			nextJars[jarIndex] = shuffledBalls.slice(playableIndex * ballsPerColor, playableIndex * ballsPerColor + ballsPerColor);
		});

		if (hasMixedJar(nextJars)) {
			return nextJars;
		}
	}

	return createFallbackLevel();
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
	const [jars, setJars] = useState(createFallbackLevel);
	const [dragSourceJar, setDragSourceJar] = useState<number | null>(null);
	const [hoverJar, setHoverJar] = useState<number | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [level, setLevel] = useState(1);
	const [boardReady, setBoardReady] = useState(false);
	const [showLevelComplete, setShowLevelComplete] = useState(false);

	useEffect(() => {
		setJars(createLevel());
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
		if (ballIndex !== jars[jarIndex].length - 1) {
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
			setJars(createLevel());
			setShowLevelComplete(false);
		}, 1200);
	};

	const dropBall = (targetJar: number, sourceJar = dragSourceJar) => {
		if (showLevelComplete || sourceJar === null || sourceJar === targetJar) {
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
				completeLevel();
			}
			return nextJars;
		});
		setDragSourceJar(null);
		setHoverJar(null);
		setDragState(null);
	};

	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="An endless color ball sorting puzzle built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<main className="gameScreen">
				<div className="gameStage">
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
