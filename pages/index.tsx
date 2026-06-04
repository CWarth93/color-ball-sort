import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useState } from 'react';

import type { StoredLevel } from '../lib/levelTypes';
import { defaultTheme, themes } from '../lib/themes';

const PhaserBoard = dynamic(() => import('../components/PhaserBoard'), { ssr: false });

const jarCapacity = 3;
const ballsPerColor = 3;

const cloneJars = (jars: string[][]) => jars.map((jar) => [...jar]);

const isLevelSolved = (jars: string[][]) =>
	jars.every((jar) => {
		if (jar.length === 0) {
			return true;
		}

		return jar.length === ballsPerColor && jar.every((color) => color === jar[0]);
	});

type DragState = {
	sourceJar: number;
	fill: string;
	icon: string;
	x: number;
	y: number;
};

const loadRandomStoredLevel = async () => {
	const response = await fetch('/api/levels/random');

	if (!response.ok) {
		throw new Error('Unable to load a stored level');
	}

	const data = (await response.json()) as { level: StoredLevel };

	return data.level;
};

export default function HomePage() {
	const [jars, setJars] = useState<string[][]>([]);
	const [turnHistory, setTurnHistory] = useState<string[][][]>([]);
	const [moveBudget, setMoveBudget] = useState(0);
	const [movesUsed, setMovesUsed] = useState(0);
	const [dragSourceJar, setDragSourceJar] = useState<number | null>(null);
	const [hoverJar, setHoverJar] = useState<number | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [level, setLevel] = useState(1);
	const [boardReady, setBoardReady] = useState(false);
	const [showLevelComplete, setShowLevelComplete] = useState(false);
	const [activeTheme, setActiveTheme] = useState(defaultTheme);
	const isLoadingLevel = !boardReady && !showLevelComplete;
	const isMoveLimitBlocking = boardReady && movesUsed >= moveBudget && !showLevelComplete;

	useEffect(() => {
		document.documentElement.dataset.theme = activeTheme.id;

		return () => {
			delete document.documentElement.dataset.theme;
		};
	}, [activeTheme]);

	const loadNextLevel = async () => {
		setBoardReady(false);
		const nextLevel = await loadRandomStoredLevel();

		setJars(nextLevel.jars);
		setMoveBudget(nextLevel.minimumTurns);
		setMovesUsed(0);
		setTurnHistory([]);
		setBoardReady(true);
	};

	useEffect(() => {
		void loadNextLevel();
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
		if (!boardReady || showLevelComplete || isMoveLimitBlocking || ballIndex !== jars[jarIndex].length - 1) {
			return;
		}

		event.preventDefault();
		const ballStyle = activeTheme.ballStyles[jars[jarIndex][ballIndex]];
		setDragSourceJar(jarIndex);
		setHoverJar(jarIndex);
		setDragState({
			sourceJar: jarIndex,
			fill: ballStyle?.fill ?? jars[jarIndex][ballIndex],
			icon: ballStyle?.icon ?? '',
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
			void loadNextLevel().finally(() => setShowLevelComplete(false));
		}, 1200);
	};

	const undoTurn = () => {
		if (showLevelComplete || turnHistory.length === 0) {
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
		if (!boardReady || showLevelComplete || isMoveLimitBlocking || sourceJar === null || sourceJar === targetJar) {
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

		if (nextMovesUsed <= moveBudget && isLevelSolved(nextJars)) {
			completeLevel();
		}
	};

	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="An endless color ball sorting puzzle built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<main className="gameScreen" data-theme={activeTheme.id}>
				<h1 className="gameTitle">Color Ball Sort</h1>
				<div className="gameStage">
					<div className="gameControls">
						<button
							className="undoButton"
							data-testid="undo-turn"
							type="button"
							data-highlighted={isMoveLimitBlocking ? 'true' : 'false'}
							disabled={!boardReady || turnHistory.length === 0 || showLevelComplete}
							onClick={undoTurn}
						>
							Undo
						</button>
						<div className="moveHud" data-blocked={isMoveLimitBlocking ? 'true' : 'false'} aria-label="Move counter">
							{boardReady ? (
								<>
									<strong data-testid="moves-used">{movesUsed}</strong>/<strong data-testid="moves-max">{moveBudget}</strong>
								</>
							) : (
								<span data-testid="moves-loading">Loading</span>
							)}
						</div>
					</div>
					<section
						className="gameBoard"
						data-testid="game-board"
						data-level={level}
						data-ready={boardReady ? 'true' : 'false'}
						data-move-blocked={isMoveLimitBlocking ? 'true' : 'false'}
						aria-label="Color Ball Sort board"
						onPointerUp={(event) => {
							if (event.target === event.currentTarget) {
								setDragSourceJar(null);
							}
						}}
					>
						{boardReady && (
							<>
								<PhaserBoard
									jars={jars}
									activeJar={dragSourceJar}
									hoverJar={hoverJar}
									onBallDrop={(sourceJar, targetJar) => dropBall(targetJar, sourceJar)}
									theme={activeTheme}
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
												style={{ backgroundColor: color, gridRow: jarCapacity - ballIndex }}
												key={`${color}-${jarIndex}-${ballIndex}`}
											/>
										))}
									</button>
								))}
							</>
						)}
						{isLoadingLevel && (
							<div className="levelLoading" data-testid="level-loading" aria-live="polite">
								<span />
								<strong>Loading level</strong>
							</div>
						)}
						{showLevelComplete && (
							<div className="levelSuccess" data-testid="level-complete" aria-live="polite">
								<span />
								<span />
								<span />
								<strong>Level complete</strong>
							</div>
						)}
						{dragState && (
							<span className="dragGhost" style={{ backgroundColor: dragState.fill, left: dragState.x, top: dragState.y }} aria-hidden="true">
								{dragState.icon && <img src={dragState.icon} alt="" />}
							</span>
						)}
					</section>
				</div>
				<div className="themePicker" aria-label="Theme picker">
					<strong>Pick your theme</strong>
					<div className="themeOptions">
						{themes.map((theme) => (
							<button
								className="themeOption"
								type="button"
								data-testid={`theme-${theme.id}`}
								aria-label={`${theme.label} theme`}
								aria-pressed={activeTheme.id === theme.id}
								key={theme.id}
								onClick={() => setActiveTheme(theme)}
							>
								<img src={theme.swatch} alt="" />
							</button>
						))}
					</div>
				</div>
				<Link href="/imprint" className="imprintLink">
					Imprint
				</Link>
			</main>
		</>
	);
}
