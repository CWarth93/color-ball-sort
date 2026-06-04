import { useEffect, useState } from 'react';

import { themeStorageKey } from '../lib/themeStorage';
import { defaultTheme, themes } from '../lib/themes';
import type { GameTheme } from '../lib/themes';

const getStoredTheme = () => {
	if (typeof window === 'undefined') {
		return defaultTheme;
	}

	const storedThemeId = window.localStorage.getItem(themeStorageKey);

	return themes.find((theme) => theme.id === storedThemeId) ?? defaultTheme;
};

const applyTheme = (theme: GameTheme) => {
	document.documentElement.dataset.theme = theme.id;
	window.localStorage.setItem(themeStorageKey, theme.id);
};

export const useThemeSelection = () => {
	const [activeTheme, setActiveTheme] = useState(getStoredTheme);

	useEffect(() => {
		applyTheme(activeTheme);

		return () => {
			delete document.documentElement.dataset.theme;
		};
	}, [activeTheme]);

	const selectTheme = (theme: GameTheme) => {
		applyTheme(theme);
		setActiveTheme(theme);
	};

	return { activeTheme, selectTheme };
};
