import { jarCapacity, jarCount } from './gameConfig';
import type { CSSProperties } from 'react';

export const boardGeometry = {
	boardWidth: 920,
	boardHeight: 448,
	baseBottom: 32,
	jarCount,
	jarCapacity,
	jarGap: 16,
	mobileJarGap: 3.2,
	jarHeight: 368,
	jarTopInset: 18,
	jarBottomInset: 18,
	jarInnerPadding: 10,
	jarCornerRadius: 22,
};

export const getJarWidth = () => (boardGeometry.boardWidth - boardGeometry.jarGap * (boardGeometry.jarCount - 1)) / boardGeometry.jarCount;

export const boardCssVariables = {
	'--board-aspect-ratio': `${boardGeometry.boardWidth} / ${boardGeometry.boardHeight}`,
	'--board-width': String(boardGeometry.boardWidth),
	'--board-height': String(boardGeometry.boardHeight),
	'--jar-count': String(boardGeometry.jarCount),
	'--jar-capacity': String(boardGeometry.jarCapacity),
	'--jar-gap-desktop': `${boardGeometry.jarGap / 16}rem`,
	'--jar-gap-mobile': `${boardGeometry.mobileJarGap / 16}rem`,
	'--jar-height-ratio': String(boardGeometry.jarHeight / boardGeometry.boardWidth),
	'--jar-bottom-ratio': String(boardGeometry.baseBottom / boardGeometry.boardWidth),
} as CSSProperties;
