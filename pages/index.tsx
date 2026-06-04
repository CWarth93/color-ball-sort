import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { useGameState } from '../hooks/useGameState';
import { useThemeSelection } from '../hooks/useThemeSelection';
import { boardCssVariables } from '../lib/boardGeometry';
import { jarCapacity } from '../lib/gameConfig';
import { themes } from '../lib/themes';

const PhaserBoard = dynamic(() => import('../components/PhaserBoard'), {
	ssr: false,
});

export default function HomePage() {
	const { activeTheme, selectTheme } = useThemeSelection();
	const {
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
		moveBudget,
		moveDragOverJar,
		movesUsed,
		resetLevel,
		setHoverJar,
		showLevelComplete,
		skipLevel,
		startBallDrag,
		turnHistory,
		undoTurn,
	} = useGameState({ activeTheme });

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
						<div className="actionCluster" aria-label="Level actions">
							<button className="actionButton" data-testid="reset-level" type="button" disabled={!boardReady || showLevelComplete} onClick={resetLevel}>
								Reset
							</button>
							<button
								className="actionButton undoButton"
								data-testid="undo-turn"
								type="button"
								data-highlighted={isMoveLimitBlocking ? 'true' : 'false'}
								disabled={!boardReady || turnHistory.length === 0 || showLevelComplete}
								onClick={undoTurn}
							>
								Undo
							</button>
							<button className="actionButton" data-testid="skip-level" type="button" disabled={!boardReady || showLevelComplete} onClick={skipLevel}>
								Skip
							</button>
						</div>
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
						style={boardCssVariables}
						aria-label="Color Ball Sort board"
						onPointerUp={(event) => {
							if (event.target === event.currentTarget) {
								clearDragState();
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
										style={{ '--jar-index': jarIndex } as CSSProperties}
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
												style={{
													backgroundColor: color,
													gridRow: jarCapacity - ballIndex,
												}}
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
							<span
								className="dragGhost"
								style={{
									backgroundColor: dragState.fill,
									left: dragState.x,
									top: dragState.y,
								}}
								aria-hidden="true"
							>
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
								onClick={() => selectTheme(theme)}
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
