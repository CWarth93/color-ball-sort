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
];

export const defaultTheme = themes[0];
