import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { applyMove, canDropBall, cloneJars, isLevelSolved } from '../lib/gameRules';
import type { StoredLevel } from '../lib/levelTypes';
import type { GameTheme } from '../lib/themes';

export type DragState = {
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

type UseGameStateOptions = {
	activeTheme: GameTheme;
};

export const useGameState = ({ activeTheme }: UseGameStateOptions) => {
	const [jars, setJars] = useState<string[][]>([]);
	const [initialJars, setInitialJars] = useState<string[][]>([]);
	const [turnHistory, setTurnHistory] = useState<string[][][]>([]);
	const [moveBudget, setMoveBudget] = useState(0);
	const [movesUsed, setMovesUsed] = useState(0);
	const [dragSourceJar, setDragSourceJar] = useState<number | null>(null);
	const [hoverJar, setHoverJar] = useState<number | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [level, setLevel] = useState(1);
	const [boardReady, setBoardReady] = useState(false);
	const [showLevelComplete, setShowLevelComplete] = useState(false);
	const [levelError, setLevelError] = useState<string | null>(null);
	const isLoadingLevel = !boardReady && !showLevelComplete && !levelError;
	const isMoveLimitBlocking = boardReady && movesUsed >= moveBudget && !showLevelComplete;

	const clearDragState = useCallback(() => {
		setDragSourceJar(null);
		setHoverJar(null);
		setDragState(null);
	}, []);

	const loadNextLevel = useCallback(async () => {
		setBoardReady(false);
		setLevelError(null);
		try {
			const nextLevel = await loadRandomStoredLevel();
			const loadedJars = cloneJars(nextLevel.jars);

			setJars(loadedJars);
			setInitialJars(cloneJars(loadedJars));
			setMoveBudget(nextLevel.minimumTurns);
			setMovesUsed(0);
			setTurnHistory([]);
			setDragSourceJar(null);
			setHoverJar(null);
			setDragState(null);
			setBoardReady(true);
		} catch (error) {
			setJars([]);
			setInitialJars([]);
			setMoveBudget(0);
			setMovesUsed(0);
			setTurnHistory([]);
			setDragSourceJar(null);
			setHoverJar(null);
			setDragState(null);
			setLevelError(error instanceof Error ? error.message : 'Unable to load a level');
		}
	}, []);

	useEffect(() => {
		void loadNextLevel();
	}, [loadNextLevel]);

	const completeLevel = useCallback(() => {
		setLevel((currentLevel) => currentLevel + 1);
		setShowLevelComplete(true);
		setHoverJar(null);
		setDragState(null);
		setDragSourceJar(null);
		window.setTimeout(() => {
			void loadNextLevel().finally(() => setShowLevelComplete(false));
		}, 1200);
	}, [loadNextLevel]);

	const dropBall = useCallback(
		(targetJar: number, sourceJar = dragSourceJar) => {
			if (!boardReady || showLevelComplete || isMoveLimitBlocking || sourceJar === null || !canDropBall(jars, sourceJar, targetJar)) {
				clearDragState();
				return;
			}

			const nextJars = applyMove(jars, sourceJar, targetJar);

			if (!nextJars) {
				return;
			}

			const nextMovesUsed = movesUsed + 1;

			setTurnHistory((currentHistory) => [...currentHistory, cloneJars(jars)]);
			setMovesUsed(nextMovesUsed);
			setJars(nextJars);
			clearDragState();

			if (nextMovesUsed <= moveBudget && isLevelSolved(nextJars)) {
				completeLevel();
			}
		},
		[boardReady, clearDragState, completeLevel, dragSourceJar, isMoveLimitBlocking, jars, moveBudget, movesUsed, showLevelComplete]
	);

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
			const targetJar = getHoveredJar(event.clientX, event.clientY) ?? hoverJar;

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
	}, [dragState, dropBall, hoverJar]);

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

	const startJarDrag = (event: ReactPointerEvent, jarIndex: number) => {
		const topBallIndex = jars[jarIndex].length - 1;

		if (topBallIndex < 0) {
			return;
		}

		startBallDrag(event, jarIndex, topBallIndex);
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

	const undoTurn = () => {
		if (showLevelComplete || turnHistory.length === 0) {
			return;
		}

		const previousJars = turnHistory[turnHistory.length - 1];

		setJars(cloneJars(previousJars));
		setTurnHistory((currentHistory) => currentHistory.slice(0, -1));
		setMovesUsed((currentMovesUsed) => Math.max(0, currentMovesUsed - 1));
		clearDragState();
	};

	const resetLevel = () => {
		if (!boardReady || showLevelComplete || initialJars.length === 0) {
			return;
		}

		setJars(cloneJars(initialJars));
		setTurnHistory([]);
		setMovesUsed(0);
		clearDragState();
	};

	const skipLevel = () => {
		if ((!boardReady && !levelError) || showLevelComplete) {
			return;
		}

		setLevel((currentLevel) => currentLevel + 1);
		void loadNextLevel();
	};

	return {
		boardReady,
		clearDragState,
		dragSourceJar,
		dragState,
		dropBall,
		endDragOverJar,
		hoverJar,
		isLoadingLevel,
		isMoveLimitBlocking,
		jars,
		level,
		levelError,
		loadNextLevel,
		moveBudget,
		moveDragOverJar,
		movesUsed,
		resetLevel,
		setHoverJar,
		showLevelComplete,
		skipLevel,
		startBallDrag,
		startJarDrag,
		turnHistory,
		undoTurn,
	};
};
