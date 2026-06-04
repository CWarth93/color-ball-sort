import { useEffect, useRef } from 'react';

import { boardGeometry } from '../lib/boardGeometry';
import type { GameTheme } from '../lib/themes';
import { createBoardScene } from './phaser/createBoardScene';
import type { BoardSceneInstance } from './phaser/createBoardScene';

type PhaserBoardProps = {
	jars: string[][];
	activeJar: number | null;
	hoverJar: number | null;
	onBallDrop: (sourceJar: number, targetJar: number) => void;
	theme: GameTheme;
};

type PhaserNamespace = typeof import('phaser');
type GameInstance = import('phaser').Game;

export default function PhaserBoard({ jars, activeJar, hoverJar, onBallDrop, theme }: PhaserBoardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const gameRef = useRef<GameInstance | null>(null);
	const sceneRef = useRef<BoardSceneInstance | null>(null);

	useEffect(() => {
		let isMounted = true;

		const createGame = async () => {
			if (!containerRef.current || gameRef.current) {
				return;
			}

			const Phaser: PhaserNamespace = await import('phaser');

			if (!isMounted || !containerRef.current) {
				return;
			}

			gameRef.current = new Phaser.Game({
				type: Phaser.AUTO,
				parent: containerRef.current,
				width: boardGeometry.boardWidth,
				height: boardGeometry.boardHeight,
				backgroundColor: '#11191d',
				scene: createBoardScene(
					Phaser,
					{
						jars,
						activeJar,
						hoverJar,
						onBallDrop,
						theme,
					},
					(scene) => {
						sceneRef.current = scene;
					}
				),
				input: {
					activePointers: 1,
				},
				scale: {
					mode: Phaser.Scale.FIT,
					autoCenter: Phaser.Scale.CENTER_BOTH,
				},
			});
		};

		createGame();

		return () => {
			isMounted = false;
			sceneRef.current = null;
			gameRef.current?.destroy(true);
			gameRef.current = null;
		};
	}, []);

	useEffect(() => {
		const scene = sceneRef.current;

		if (!scene) {
			return;
		}

		scene.jarsState = jars;
		scene.activeJarState = activeJar;
		scene.hoverJarState = hoverJar;
		scene.onBallDropState = onBallDrop;
		scene.themeState = theme;
		scene.renderBoard?.();
	}, [jars, activeJar, hoverJar, onBallDrop, theme]);

	useEffect(() => {
		let frameId: number | null = null;
		let attempts = 0;

		const repaintTheme = () => {
			const scene = sceneRef.current;

			if (scene) {
				scene.themeState = theme;
				scene.renderBoard?.();
				return;
			}

			if (attempts < 60) {
				attempts += 1;
				frameId = window.requestAnimationFrame(repaintTheme);
			}
		};

		repaintTheme();

		return () => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, [theme]);

	return <div className="phaserBoard" ref={containerRef} aria-hidden="true" />;
}
