import { boardGeometry, getJarWidth } from '../../lib/boardGeometry';
import type { GameTheme } from '../../lib/themes';
import { themes } from '../../lib/themes';

type PhaserNamespace = typeof import('phaser');

export type BoardSceneState = {
	jars: string[][];
	activeJar: number | null;
	hoverJar: number | null;
	onBallDrop: (sourceJar: number, targetJar: number) => void;
	theme: GameTheme;
};

export type BoardSceneInstance = import('phaser').Scene & {
	renderBoard?: () => void;
	jarsState?: string[][];
	activeJarState?: number | null;
	hoverJarState?: number | null;
	onBallDropState?: (sourceJar: number, targetJar: number) => void;
	themeState?: GameTheme;
};

const getIconKey = (themeId: string, color: string) => `${themeId}-${color.replace(/[^a-z0-9]/gi, '')}`;

const hexToNumber = (color: string) => Number.parseInt(color.replace('#', ''), 16);

export const createBoardScene = (Phaser: PhaserNamespace, initialState: BoardSceneState, onSceneReady: (scene: BoardSceneInstance) => void) => {
	const jarWidth = getJarWidth();
	const jarInnerHeight = boardGeometry.jarHeight - boardGeometry.jarTopInset - boardGeometry.jarBottomInset;
	const slotHeight = jarInnerHeight / boardGeometry.jarCapacity;
	const ballRadius = Math.min(43, slotHeight / 2 - boardGeometry.jarInnerPadding);

	return class BoardScene extends Phaser.Scene {
		jarsState = initialState.jars;
		activeJarState = initialState.activeJar;
		hoverJarState = initialState.hoverJar;
		onBallDropState = initialState.onBallDrop;
		themeState = initialState.theme;
		dragSourceJarState: number | null = null;
		jarContainers = new Map<number, Phaser.GameObjects.Container>();
		jarShapes = new Map<number, Phaser.GameObjects.Graphics>();

		preload() {
			themes.forEach((availableTheme) => {
				Object.entries(availableTheme.ballStyles).forEach(([color, ballStyle]) => {
					this.load.image(getIconKey(availableTheme.id, color), ballStyle.icon);
				});
			});
		}

		create() {
			onSceneReady(this);
			this.renderBoard();
		}

		renderBoard() {
			this.children.removeAll();
			this.tweens.killAll();
			this.jarContainers.clear();
			this.jarShapes.clear();
			this.cameras.main.setBackgroundColor(this.themeState.boardBackground);

			const baseY = boardGeometry.boardHeight - boardGeometry.baseBottom;
			const jarTop = -boardGeometry.jarHeight / 2 + boardGeometry.jarTopInset;
			const jarBottom = boardGeometry.jarHeight / 2 - boardGeometry.jarBottomInset;
			const drawJarGlass = (jarIndex: number) => {
				const jarShape = this.jarShapes.get(jarIndex);

				if (!jarShape) {
					return;
				}

				const isSelected = this.activeJarState === jarIndex || this.dragSourceJarState === jarIndex;
				const isHovered = this.hoverJarState === jarIndex;
				const borderColor = isSelected
					? hexToNumber(this.themeState.jarBorderSelected)
					: isHovered
					? hexToNumber(this.themeState.jarBorderHovered)
					: hexToNumber(this.themeState.jarBorder);
				const glassFill = isSelected
					? hexToNumber(this.themeState.jarFillSelected)
					: isHovered
					? hexToNumber(this.themeState.jarFillHovered)
					: hexToNumber(this.themeState.jarFill);

				jarShape.clear();
				jarShape.lineStyle(isSelected ? 7 : isHovered ? 6 : 4, borderColor, isSelected ? 1 : isHovered ? 0.92 : 0.82);
				jarShape.fillStyle(glassFill, isSelected ? 0.66 : 0.42);
				jarShape.fillRoundedRect(-jarWidth / 2, jarTop, jarWidth, jarInnerHeight, boardGeometry.jarCornerRadius);
				jarShape.strokeRoundedRect(-jarWidth / 2, jarTop, jarWidth, jarInnerHeight, boardGeometry.jarCornerRadius);
				jarShape.lineStyle(3, 0xffffff, isSelected ? 0.34 : 0.22);
				jarShape.lineBetween(-jarWidth * 0.22, jarTop + 18, -jarWidth * 0.22, jarBottom - 12);
				jarShape.lineStyle(2, 0xffffff, isSelected ? 0.24 : 0.16);
				for (let slotIndex = 1; slotIndex < boardGeometry.jarCapacity; slotIndex += 1) {
					const separatorY = jarBottom - slotHeight * slotIndex;
					jarShape.lineBetween(-jarWidth / 2 + 14, separatorY, jarWidth / 2 - 14, separatorY);
				}
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
				if (pointerY < baseY - boardGeometry.jarHeight || pointerY > baseY) {
					return -1;
				}

				return this.jarsState.findIndex((_, jarIndex) => {
					const x = jarIndex * (jarWidth + boardGeometry.jarGap);

					return pointerX >= x && pointerX <= x + jarWidth;
				});
			};

			this.jarsState.forEach((jar, jarIndex) => {
				const x = jarIndex * (jarWidth + boardGeometry.jarGap);
				const y = baseY - boardGeometry.jarHeight;
				const jarContainer = this.add.container(x + jarWidth / 2, y + boardGeometry.jarHeight / 2);
				this.jarContainers.set(jarIndex, jarContainer);

				const jarShape = this.add.graphics();
				this.jarShapes.set(jarIndex, jarShape);
				jarContainer.add(jarShape);
				drawJarGlass(jarIndex);

				const hitArea = this.add.rectangle(0, 0, jarWidth + 18, boardGeometry.jarHeight + 8, 0xffffff, 0);
				hitArea.setInteractive({ useHandCursor: true });
				hitArea.on('pointerover', () => setJarHover(jarIndex));
				hitArea.on('pointerout', () => setJarHover(null));
				jarContainer.add(hitArea);
				if (this.hoverJarState === jarIndex || this.activeJarState === jarIndex) {
					jarContainer.setScale(1.07);
				}

				jar.forEach((color, ballIndex) => {
					const ballX = x + jarWidth / 2;
					const ballY = baseY + jarBottom - boardGeometry.jarHeight / 2 - slotHeight * (ballIndex + 0.5);
					const isTopBall = ballIndex === jar.length - 1;

					if (this.activeJarState === jarIndex && isTopBall) {
						return;
					}

					const ballStyle = this.themeState.ballStyles[color];
					const ballFill = ballStyle?.fill ?? color;
					const ball = this.add.circle(ballX, ballY, ballRadius, Phaser.Display.Color.HexStringToColor(ballFill).color);

					ball.setStrokeStyle(2, 0xffffff, 0.2);
					this.add.circle(ballX - 10, ballY - 12, 8, 0xffffff, 0.28);
					if (ballStyle) {
						this.add
							.image(ballX, ballY, getIconKey(this.themeState.id, color))
							.setDisplaySize(ballRadius * 1.32, ballRadius * 1.32)
							.setAlpha(1);
					}

					if (isTopBall) {
						ball.setInteractive({ useHandCursor: true });
						this.input.setDraggable(ball);
						ball.setData('sourceJar', jarIndex);
					}
				});
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

				if (targetJar >= 0 && targetJar !== sourceJar && this.jarsState[targetJar].length < boardGeometry.jarCapacity) {
					this.onBallDropState?.(sourceJar, targetJar);
				} else {
					this.renderBoard();
				}
			});
		}
	};
};
