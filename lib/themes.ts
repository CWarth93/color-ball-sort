export type BallStyle = {
	fill: string;
	icon: string;
	name: string;
};

export type GameTheme = {
	id: string;
	label: string;
	swatch: string;
	ballStyles: Record<string, BallStyle>;
	boardBackground: string;
	jarBorder: string;
	jarBorderSelected: string;
	jarBorderHovered: string;
	jarFill: string;
	jarFillSelected: string;
	jarFillHovered: string;
};

export const logicalColors = ['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa'];

export const themes: GameTheme[] = [
	{
		id: 'vaporwave',
		label: 'Vaporwave',
		swatch: '/themes/vaporwave/theme-icon.png',
		boardBackground: '#160022',
		jarBorder: '#ff9ff3',
		jarBorderSelected: '#ff4fd8',
		jarBorderHovered: '#35f3ff',
		jarFill: '#280536',
		jarFillSelected: '#5a0a63',
		jarFillHovered: '#053f63',
		ballStyles: {
			'#ff5a6f': { fill: '#ff4f8b', icon: '/themes/vaporwave/ball-sun.png', name: 'sun' },
			'#ffd166': { fill: '#ffe66d', icon: '/themes/vaporwave/ball-palm.png', name: 'palm' },
			'#49c6e5': { fill: '#35f3ff', icon: '/themes/vaporwave/ball-grid.png', name: 'grid' },
			'#65d46e': { fill: '#7cff6b', icon: '/themes/vaporwave/ball-cassette.png', name: 'cassette' },
			'#a78bfa': { fill: '#b78cff', icon: '/themes/vaporwave/ball-sparkle.png', name: 'sparkle' },
		},
	},
	{
		id: 'cyberpunk',
		label: 'Cyberpunk',
		swatch: '/themes/cyberpunk/theme-icon.png',
		boardBackground: '#080b12',
		jarBorder: '#f5ff3d',
		jarBorderSelected: '#ff2d55',
		jarBorderHovered: '#00f5ff',
		jarFill: '#101720',
		jarFillSelected: '#2b0b18',
		jarFillHovered: '#041e2a',
		ballStyles: {
			'#ff5a6f': { fill: '#ff2d55', icon: '/themes/cyberpunk/ball-warning.png', name: 'warning' },
			'#ffd166': { fill: '#f5ff3d', icon: '/themes/cyberpunk/ball-chip.png', name: 'chip' },
			'#49c6e5': { fill: '#00f5ff', icon: '/themes/cyberpunk/ball-hack.png', name: 'hack' },
			'#65d46e': { fill: '#19ff8c', icon: '/themes/cyberpunk/ball-power.png', name: 'power' },
			'#a78bfa': { fill: '#9b5cff', icon: '/themes/cyberpunk/ball-eye.png', name: 'eye' },
		},
	},
];

export const defaultTheme = themes[0];
