import Link from 'next/link';
import type { PropsWithChildren } from 'react';

export function PageShell({ children }: PropsWithChildren) {
	return (
		<div className="pageShell">
			<header className="siteHeader">
				<Link href="/" className="brand">
					Color Ball Sort
				</Link>
				<nav aria-label="Main navigation">
					<Link href="/imprint">Imprint</Link>
				</nav>
			</header>
			{children}
		</div>
	);
}
