import Head from 'next/head';
import Link from 'next/link';

import { PageShell } from '../components/PageShell';

export default function ImprintPage() {
	return (
		<>
			<Head>
				<title>Imprint | Color Ball Sort</title>
			</Head>
			<PageShell>
				<main className="contentPage">
					<h1>Imprint</h1>
					<p>This project is a portfolio game sample for Color Ball Sort.</p>
					<Link href="/">Back to game</Link>
				</main>
			</PageShell>
		</>
	);
}
