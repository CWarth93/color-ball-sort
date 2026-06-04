import type { AppProps } from 'next/app';

import '../styles/theme.css';
import '../styles/base.css';
import '../styles/shell.css';
import '../styles/imprint.css';
import '../styles/animations.css';
import '../styles/game.css';

export default function App({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}
