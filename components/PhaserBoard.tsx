import { useEffect, useRef } from 'react';

type PhaserBoardProps = {
	jars: string[][];
	activeJar: number | null;
	motionEnabled: boolean;
};

type PhaserNamespace = typeof import('phaser');
type GameInstance = import('phaser').Game;
type SceneInstance = import('phaser').Scene & {
	renderBoard?: () => void;
	jarsState?: string[][];
	activeJarState?: number | null;
	motionEnabledState?: boolean;
};

const boardWidth = 920;
const boardHeight = 448;
const jarCapacity = 4;

export default function PhaserBoard({ jars, activeJar, motionEnabled }: PhaserBoardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const gameRef = useRef<GameInstance | null>(null);
	const sceneRef = useRef<SceneInstance | null>(null);

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

			class BoardScene extends Phaser.Scene {
				jarsState = jars;
				activeJarState = activeJar;
				motionEnabledState = motionEnabled;

				create() {
					sceneRef.current = this;
					this.renderBoard();
				}

				renderBoard() {
					this.children.removeAll();
					this.cameras.main.setBackgroundColor('#11191d');

					const jarWidth = 112;
					const jarHeight = 320;
					const gap = (boardWidth - jarWidth * this.jarsState.length) / (this.jarsState.length + 1);
					const baseY = boardHeight - 48;

					this.jarsState.forEach((jar, jarIndex) => {
						const x = gap + jarIndex * (jarWidth + gap);
						const y = baseY - jarHeight;
						const isSelected = this.activeJarState === jarIndex;
						const borderColor = isSelected ? 0xff5a6f : 0xd8d2c8;
						const glassFill = isSelected ? 0x26333a : 0x1a2429;

						const jarShape = this.add.graphics();
						jarShape.lineStyle(3, borderColor, 0.72);
						jarShape.fillStyle(glassFill, 0.42);
						jarShape.fillRoundedRect(x, y + 20, jarWidth, jarHeight - 20, 22);
						jarShape.strokeRoundedRect(x, y + 20, jarWidth, jarHeight - 20, 22);
						jarShape.lineStyle(2, 0xffffff, 0.18);
						jarShape.lineBetween(x + jarWidth * 0.28, y + 38, x + jarWidth * 0.28, y + jarHeight - 28);

						if (jar.length < jarCapacity) {
							const freeSlots = jarCapacity - jar.length;
							this.add
								.text(x + jarWidth / 2, y + 2, `${freeSlots}`, {
									color: '#9fa9ad',
									fontFamily: 'system-ui, sans-serif',
									fontSize: '14px',
									fontStyle: '700',
								})
								.setOrigin(0.5);
						}
					});
				}
			}

			gameRef.current = new Phaser.Game({
				type: Phaser.AUTO,
				parent: containerRef.current,
				width: boardWidth,
				height: boardHeight,
				backgroundColor: '#11191d',
				scene: BoardScene,
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
		scene.motionEnabledState = motionEnabled;
		scene.renderBoard?.();
	}, [jars, activeJar, motionEnabled]);

	return <div className="phaserBoard" ref={containerRef} aria-hidden="true" />;
}
