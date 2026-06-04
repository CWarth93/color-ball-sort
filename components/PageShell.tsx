import Link from 'next/link';
import type { PropsWithChildren } from 'react';

type PageShellProps = PropsWithChildren<{
	showImprintLink?: boolean;
}>;

export function PageShell({ children, showImprintLink = true }: PageShellProps) {
	return (
		<div className="pageShell">
			<header className="siteHeader">
				<Link href="/" className="brand">
					Color Ball Sort
				</Link>
				{showImprintLink && (
					<nav aria-label="Main navigation">
						<Link href="/imprint">Imprint</Link>
					</nav>
				)}
			</header>
			{children}
		</div>
	);
}
