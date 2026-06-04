import { useEffect, useRef } from 'react';

type PhaserBoardProps = {
	jars: string[][];
	activeJar: number | null;
	hoverJar: number | null;
	onBallDrop: (sourceJar: number, targetJar: number) => void;
};

type PhaserNamespace = typeof import('phaser');
type GameInstance = import('phaser').Game;
type SceneInstance = import('phaser').Scene & {
	renderBoard?: () => void;
	jarsState?: string[][];
	activeJarState?: number | null;
	hoverJarState?: number | null;
	onBallDropState?: (sourceJar: number, targetJar: number) => void;
};

const boardWidth = 920;
const boardHeight = 448;
const jarCapacity = 3;

export default function PhaserBoard({ jars, activeJar, hoverJar, onBallDrop }: PhaserBoardProps) {
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
				hoverJarState = hoverJar;
				onBallDropState = onBallDrop;
				dragSourceJarState: number | null = null;
				jarContainers = new Map<number, Phaser.GameObjects.Container>();
				jarShapes = new Map<number, Phaser.GameObjects.Graphics>();

				create() {
					sceneRef.current = this;
					this.renderBoard();
				}

				renderBoard() {
					this.children.removeAll();
					this.tweens.killAll();
					this.jarContainers.clear();
					this.jarShapes.clear();
					this.cameras.main.setBackgroundColor('#11191d');

					const jarWidth = 112;
					const jarHeight = 248;
					const gap = (boardWidth - jarWidth * this.jarsState.length) / (this.jarsState.length + 1);
					const baseY = boardHeight - 48;
					const drawJarGlass = (jarIndex: number) => {
						const jarShape = this.jarShapes.get(jarIndex);

						if (!jarShape) {
							return;
						}

						const isSelected = this.activeJarState === jarIndex || this.dragSourceJarState === jarIndex;
						const isHovered = this.hoverJarState === jarIndex;
						const borderColor = isSelected ? 0xff5a6f : isHovered ? 0x49c6e5 : 0xd8d2c8;
						const glassFill = isSelected ? 0x40252c : isHovered ? 0x1d3540 : 0x1a2429;

						jarShape.clear();
						jarShape.lineStyle(isSelected ? 5 : isHovered ? 4 : 3, borderColor, isSelected ? 0.95 : 0.72);
						jarShape.fillStyle(glassFill, isSelected ? 0.66 : 0.42);
						jarShape.fillRoundedRect(-jarWidth / 2, -jarHeight / 2 + 20, jarWidth, jarHeight - 20, 22);
						jarShape.strokeRoundedRect(-jarWidth / 2, -jarHeight / 2 + 20, jarWidth, jarHeight - 20, 22);
						jarShape.lineStyle(2, 0xffffff, isSelected ? 0.28 : 0.18);
						jarShape.lineBetween(-jarWidth * 0.22, -jarHeight / 2 + 38, -jarWidth * 0.22, jarHeight / 2 - 28);
					};
					const setJarHover = (jarIndex: number | null) => {
						if (this.hoverJarState === jarIndex) {
							return;
						}

						const previousHoverJar = this.hoverJarState;
						this.hoverJarState = jarIndex;

						[previousHoverJar, jarIndex].forEach((index) => {
							if (index === null) {
								return;
							}

							const jarContainer = this.jarContainers.get(index);

							if (!jarContainer) {
								return;
							}

							this.tweens.add({
								targets: jarContainer,
								scaleX: index === jarIndex ? 1.07 : 1,
								scaleY: index === jarIndex ? 1.07 : 1,
								duration: 140,
								ease: 'Sine.easeOut',
							});
							drawJarGlass(index);
						});
					};
					const getJarIndexFromPointer = (pointerX: number, pointerY: number) => {
						if (pointerY < baseY - jarHeight || pointerY > baseY) {
							return -1;
						}

						return this.jarsState.findIndex((_, jarIndex) => {
							const x = gap + jarIndex * (jarWidth + gap);

							return pointerX >= x && pointerX <= x + jarWidth;
						});
					};

					this.jarsState.forEach((jar, jarIndex) => {
						const x = gap + jarIndex * (jarWidth + gap);
						const y = baseY - jarHeight;
						const jarContainer = this.add.container(x + jarWidth / 2, y + jarHeight / 2);
						this.jarContainers.set(jarIndex, jarContainer);

						const jarShape = this.add.graphics();
						this.jarShapes.set(jarIndex, jarShape);
						jarContainer.add(jarShape);
						drawJarGlass(jarIndex);

						const hitArea = this.add.rectangle(0, jarHeight / 2 - 10, jarWidth + 22, jarHeight + 10, 0xffffff, 0);
						hitArea.setInteractive({ useHandCursor: true });
						hitArea.on('pointerover', () => setJarHover(jarIndex));
						hitArea.on('pointerout', () => setJarHover(null));
						jarContainer.add(hitArea);
						if (this.hoverJarState === jarIndex || this.activeJarState === jarIndex) {
							jarContainer.setScale(1.07);
						}

						jar.forEach((color, ballIndex) => {
							const ballRadius = 31;
							const ballX = x + jarWidth / 2;
							const ballY = baseY - ballRadius - ballIndex * (ballRadius * 2 + 10);
							const isTopBall = ballIndex === jar.length - 1;

							if (this.activeJarState === jarIndex && isTopBall) {
								return;
							}

							const ball = this.add.circle(ballX, ballY, ballRadius, Phaser.Display.Color.HexStringToColor(color).color);

							ball.setStrokeStyle(2, 0xffffff, 0.2);
							this.add.circle(ballX - 10, ballY - 12, 8, 0xffffff, 0.28);

							if (isTopBall) {
								ball.setInteractive({ useHandCursor: true });
								this.input.setDraggable(ball);
								ball.setData('sourceJar', jarIndex);
							}
						});

						if (jar.length < jarCapacity) {
							const freeSlots = jarCapacity - jar.length;
							jarContainer.add(
								this.add
									.text(x + jarWidth / 2, y + 2, `${freeSlots}`, {
										color: '#9fa9ad',
										fontFamily: 'system-ui, sans-serif',
										fontSize: '14px',
										fontStyle: '700',
									})
									.setOrigin(0.5)
									.setPosition(0, -jarHeight / 2 + 2)
							);
						}
					});

					this.input.off('dragstart');
					this.input.off('drag');
					this.input.off('dragend');
					this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
						const ball = gameObject as Phaser.GameObjects.Arc;
						const sourceJar = ball.getData('sourceJar') as number;
						const jarContainer = this.jarContainers.get(sourceJar);

						this.dragSourceJarState = sourceJar;
						drawJarGlass(sourceJar);
						this.tweens.add({
							targets: jarContainer,
							scaleX: 1.07,
							scaleY: 1.07,
							duration: 110,
							ease: 'Sine.easeOut',
						});
						ball.setDepth(100);
						ball.setStrokeStyle(4, 0xffffff, 0.6);
					});
					this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
						const ball = gameObject as Phaser.GameObjects.Arc;
						const targetJar = getJarIndexFromPointer(pointer.x, pointer.y);

						ball.setPosition(pointer.x, pointer.y);
						setJarHover(targetJar >= 0 ? targetJar : null);
					});
					this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
						const sourceJar = gameObject.getData('sourceJar') as number;
						const targetJar = getJarIndexFromPointer(pointer.x, pointer.y);

						this.dragSourceJarState = null;
						setJarHover(null);

						if (targetJar >= 0 && targetJar !== sourceJar && this.jarsState[targetJar].length < jarCapacity) {
							this.onBallDropState?.(sourceJar, targetJar);
						} else {
							this.renderBoard();
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
		scene.hoverJarState = hoverJar;
		scene.onBallDropState = onBallDrop;
		scene.renderBoard?.();
	}, [jars, activeJar, hoverJar, onBallDrop]);

	return <div className="phaserBoard" ref={containerRef} aria-hidden="true" />;
}
