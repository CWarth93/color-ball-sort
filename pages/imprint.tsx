import Head from 'next/head';
import Link from 'next/link';

import { PageShell } from '../components/PageShell';
import { useThemeSelection } from '../hooks/useThemeSelection';

export default function ImprintPage() {
	useThemeSelection();

	return (
		<>
			<Head>
				<title>Imprint | Color Ball Sort</title>
			</Head>
			<PageShell showImprintLink={false}>
				<main className="contentPage">
					<h1>Impressum</h1>
					<p>
						Christopher Warth
						<br />
						<br />
						Ziegelstra&szlig;e 3
						<br />
						01069 Dresden
					</p>
					<p>
						Telefon: 015255280055
						<br />
						E-Mail:{' '}
						<a title="email" href="mailto:christopher.warth@web.de">
							christopher.warth@web.de
						</a>
					</p>
					<h2>Hinweis gem&auml;&szlig; Online-Streitbeilegungs-Verordnung</h2>
					<p>
						Nach geltendem Recht sind wir verpflichtet, Verbraucher auf die Existenz der Europ&auml;ischen Online-Streitbeilegungs-Plattform hinzuweisen, die
						f&uuml;r die Beilegung von Streitigkeiten genutzt werden kann, ohne dass ein Gericht eingeschaltet werden muss. F&uuml;r die Einrichtung der
						Plattform ist die Europ&auml;ische Kommission zust&auml;ndig. Die Europ&auml;ische Online-Streitbeilegungs-Plattform ist hier zu finden:{' '}
						<a title="imprint-1" href="http://ec.europa.eu/odr" target="_blank" rel="noreferrer noopener">
							http://ec.europa.eu/odr
						</a>
						. Unsere E-Mail lautet:{' '}
						<a title="email-2" href="mailto:christopher.warth@web.de">
							christopher.warth@web.de
						</a>
					</p>
					<p>
						Wir weisen aber darauf hin, dass wir nicht bereit sind, uns am Streitbeilegungsverfahren im Rahmen der Europ&auml;ischen
						Online-Streitbeilegungs-Plattform zu beteiligen. Nutzen Sie zur Kontaktaufnahme bitte unsere obige E-Mail und Telefonnummer.
					</p>
					<h2>Disclaimer &ndash; rechtliche Hinweise</h2>
					<p>&sect; 1 Warnhinweis zu Inhalten</p>
					<p>
						Die kostenlosen und frei zug&auml;nglichen Inhalte dieser Webseite wurden mit gr&ouml;&szlig;tm&ouml;glicher Sorgfalt erstellt. Der Anbieter dieser
						Webseite &uuml;bernimmt jedoch keine Gew&auml;hr f&uuml;r die Richtigkeit und Aktualit&auml;t der bereitgestellten kostenlosen und frei
						zug&auml;nglichen journalistischen Ratgeber und Nachrichten. Namentlich gekennzeichnete Beitr&auml;ge geben die Meinung des jeweiligen Autors und
						nicht immer die Meinung des Anbieters wieder. Allein durch den Aufruf der kostenlosen und frei zug&auml;nglichen Inhalte kommt keinerlei
						Vertragsverh&auml;ltnis zwischen dem Nutzer und dem Anbieter zustande, insoweit fehlt es am Rechtsbindungswillen des Anbieters.
					</p>
					<p>&sect; 2 Externe Links</p>
					<p>
						Diese Website enth&auml;lt Verkn&uuml;pfungen zu Websites Dritter (&bdquo;externe Links&ldquo;). Diese Websites unterliegen der Haftung der
						jeweiligen Betreiber. Der Anbieter hat bei der erstmaligen Verkn&uuml;pfung der externen Links die fremden Inhalte daraufhin &uuml;berpr&uuml;ft, ob
						etwaige Rechtsverst&ouml;&szlig;e bestehen. Zu dem Zeitpunkt waren keine Rechtsverst&ouml;&szlig;e ersichtlich. Der Anbieter hat keinerlei Einfluss
						auf die aktuelle und zuk&uuml;nftige Gestaltung und auf die Inhalte der verkn&uuml;pften Seiten. Das Setzen von externen Links bedeutet nicht, dass
						sich der Anbieter die hinter dem Verweis oder Link liegenden Inhalte zu Eigen macht. Eine st&auml;ndige Kontrolle der externen Links ist f&uuml;r
						den Anbieter ohne konkrete Hinweise auf Rechtsverst&ouml;&szlig;e nicht zumutbar. Bei Kenntnis von Rechtsverst&ouml;&szlig;en werden jedoch
						derartige externe Links unverz&uuml;glich gel&ouml;scht.
					</p>
					<p>&sect; 3 Urheber- und Leistungsschutzrechte</p>
					<p>
						Die auf dieser Website ver&ouml;ffentlichten Inhalte unterliegen dem deutschen Urheber- und Leistungsschutzrecht. Jede vom deutschen Urheber- und
						Leistungsschutzrecht nicht zugelassene Verwertung bedarf der vorherigen schriftlichen Zustimmung des Anbieters oder jeweiligen Rechteinhabers. Dies
						gilt insbesondere f&uuml;r Vervielf&auml;ltigung, Bearbeitung, &Uuml;bersetzung, Einspeicherung, Verarbeitung bzw. Wiedergabe von Inhalten in
						Datenbanken oder anderen elektronischen Medien und Systemen. Inhalte und Rechte Dritter sind dabei als solche gekennzeichnet. Die unerlaubte
						Vervielf&auml;ltigung oder Weitergabe einzelner Inhalte oder kompletter Seiten ist nicht gestattet und strafbar. Lediglich die Herstellung von
						Kopien und Downloads f&uuml;r den pers&ouml;nlichen, privaten und nicht kommerziellen Gebrauch ist erlaubt.
					</p>
					<p>Die Darstellung dieser Website in fremden Frames ist nur mit schriftlicher Erlaubnis zul&auml;ssig.</p>
					<p>&sect; 4 Besondere Nutzungsbedingungen</p>
					<p>
						Soweit besondere Bedingungen f&uuml;r einzelne Nutzungen dieser Website von den vorgenannten Paragraphen abweichen, wird an entsprechender Stelle
						ausdr&uuml;cklich darauf hingewiesen. In diesem Falle gelten im jeweiligen Einzelfall die besonderen Nutzungsbedingungen.
					</p>
					<p>
						Quelle:{' '}
						<a title="imprint-source" href="https://www.juraforum.de/impressum-generator/">
							Impressum Generator von JuraForum.de
						</a>
					</p>
					<Link href="/">Back to game</Link>
				</main>
			</PageShell>
		</>
	);
}
