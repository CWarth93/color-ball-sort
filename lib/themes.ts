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
	{
		id: 'lofi',
		label: 'Lofi',
		swatch: '/themes/lofi/theme-icon.png',
		boardBackground: '#211b2d',
		jarBorder: '#f7c59f',
		jarBorderSelected: '#f2a65a',
		jarBorderHovered: '#9ec5ab',
		jarFill: '#2f263d',
		jarFillSelected: '#4a3141',
		jarFillHovered: '#263a38',
		ballStyles: {
			'#ff5a6f': { fill: '#d9827f', icon: '/themes/lofi/ball-coffee.png', name: 'coffee' },
			'#ffd166': { fill: '#f8d67a', icon: '/themes/lofi/ball-moon.png', name: 'moon' },
			'#49c6e5': { fill: '#7fb7be', icon: '/themes/lofi/ball-rain.png', name: 'rain' },
			'#65d46e': { fill: '#9ec5ab', icon: '/themes/lofi/ball-headphones.png', name: 'headphones' },
			'#a78bfa': { fill: '#b8a1d9', icon: '/themes/lofi/ball-vinyl.png', name: 'vinyl' },
		},
	},
	{
		id: 'poolcore',
		label: 'Poolcore',
		swatch: '/themes/poolcore/theme-icon.png',
		boardBackground: '#e5fbff',
		jarBorder: '#0077b6',
		jarBorderSelected: '#ff7f6e',
		jarBorderHovered: '#00b4d8',
		jarFill: '#c9f5ff',
		jarFillSelected: '#ffe3dc',
		jarFillHovered: '#b7f7ff',
		ballStyles: {
			'#ff5a6f': { fill: '#ff7f6e', icon: '/themes/poolcore/ball-float.png', name: 'float' },
			'#ffd166': { fill: '#ffd45a', icon: '/themes/poolcore/ball-sun.png', name: 'sun' },
			'#49c6e5': { fill: '#35c7f3', icon: '/themes/poolcore/ball-wave.png', name: 'wave' },
			'#65d46e': { fill: '#7fe6c5', icon: '/themes/poolcore/ball-umbrella.png', name: 'umbrella' },
			'#a78bfa': { fill: '#7cb7ff', icon: '/themes/poolcore/ball-tile.png', name: 'tile' },
		},
	},
	{
		id: 'barbie',
		label: 'Barbie',
		swatch: '/themes/barbie/theme-icon.png',
		boardBackground: '#fff0fa',
		jarBorder: '#ff69b4',
		jarBorderSelected: '#ff1493',
		jarBorderHovered: '#f8c04e',
		jarFill: '#ffe1f3',
		jarFillSelected: '#ffc0e6',
		jarFillHovered: '#fff2c7',
		ballStyles: {
			'#ff5a6f': { fill: '#ff1493', icon: '/themes/barbie/ball-heart.png', name: 'heart' },
			'#ffd166': { fill: '#f8c04e', icon: '/themes/barbie/ball-star.png', name: 'star' },
			'#49c6e5': { fill: '#ff9bd7', icon: '/themes/barbie/ball-bow.png', name: 'bow' },
			'#65d46e': { fill: '#ff7ac8', icon: '/themes/barbie/ball-heels.png', name: 'heels' },
			'#a78bfa': { fill: '#ffd1ec', icon: '/themes/barbie/ball-diamond.png', name: 'diamond' },
		},
	},
];

export const defaultTheme = themes[0];
