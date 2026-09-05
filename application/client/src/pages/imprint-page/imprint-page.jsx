import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import ImprintText from '../../components/imprint-text.jsx';

const EMAIL = 'KoflerPhillip@outlook.com';

/**
 * The imprint already existed as the last section of the privacy policy, which
 * meant the only way to reach it was a footer link labelled "Privacy Policy".
 * §5 ECG wants this information *leicht und unmittelbar zugänglich* and
 * recognisably labelled, so it also gets its own route and its own footer link.
 *
 * It shares the `privacy.imprint.*` message ids with that section rather than
 * restating the text, so the two can never drift apart.
 */
export default function ImprintPage() {
    usePageMeta(
        'Impressum',
        'Information pursuant to §5 ECG and §25 MedienG for woofi-developments.at.',
    );

    return (
        <div className="animate-fade-up mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                <FormattedMessage id="privacy.label" defaultMessage="Legal" />
            </p>

            <h1 className="mt-4 text-4xl font-extrabold text-[var(--text)]">
                <FormattedMessage id="privacy.imprint.title" defaultMessage="Imprint" />
            </h1>

            <div className="mt-10 overflow-hidden rounded-lg border border-[var(--line)]">
                <section className="bg-[var(--surface)] p-6 sm:p-8">
                    <div className="whitespace-pre-line text-sm leading-7 text-[var(--text)]">
                        <ImprintText />
                    </div>

                    <p className="mt-6 text-sm leading-7 text-[var(--text)]">
                        <FormattedMessage id="imprint.contact" defaultMessage="Contact: " />
                        <a
                            href={`mailto:${EMAIL}`}
                            className="text-[var(--accent)] underline underline-offset-4"
                        >
                            {EMAIL}
                        </a>
                    </p>

                    <p className="mt-6 text-sm leading-7 text-[var(--muted)]">
                        <Link
                            to="/privacy-policy"
                            className="text-[var(--accent)] underline underline-offset-4"
                        >
                            <FormattedMessage
                                id="imprint.privacyLink"
                                defaultMessage="Read the privacy policy"
                            />
                        </Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
