import Head from 'next/head';
import Link from 'next/link';

import { PageShell } from '../components/PageShell';

export default function HomePage() {
	return (
		<>
			<Head>
				<title>Color Ball Sort</title>
				<meta name="description" content="A fast two-minute color ball sorting game built with Next.js, TypeScript, React, and Phaser." />
			</Head>
			<PageShell>
				<section className="hero" aria-labelledby="page-title">
					<div className="heroCopy">
						<p className="eyebrow">Next.js + Phaser game sample</p>
						<h1 id="page-title">Color Ball Sort</h1>
						<p className="lede">
							A two-minute sprint puzzle: sort five colors across small jars, clear as many generated levels as possible, and chase a clean high score loop.
						</p>
						<div className="actionRow">
							<button className="primaryButton" type="button" disabled>
								Game canvas coming next
							</button>
							<Link href="/imprint" className="secondaryLink">
								Imprint
							</Link>
						</div>
					</div>
					<div className="jarPreview" aria-hidden="true">
						{['#ff5a6f', '#ffd166', '#49c6e5', '#65d46e', '#a78bfa', 'empty'].map((color, jarIndex) => (
							<div className="jar" key={`${color}-${jarIndex}`}>
								{color !== 'empty' &&
									Array.from({ length: 3 }).map((_, ballIndex) => <span className="ball" style={{ backgroundColor: color }} key={`${color}-${ballIndex}`} />)}
							</div>
						))}
					</div>
				</section>
			</PageShell>
		</>
	);
}
