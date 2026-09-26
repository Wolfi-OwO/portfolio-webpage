import { FormattedMessage } from 'react-intl';

/**
 * The imprint body, defined once. It is shown both as the last section of the
 * privacy policy and as the standalone /impressum page, and §5 ECG information
 * that differs between two places on the same site is worse than useless — so
 * the English source text lives here rather than in either page.
 */
export default function ImprintText() {
    return (
        <FormattedMessage
            id="privacy.imprint.text"
            defaultMessage={
                'Information pursuant to §5 ECG and §25 MedienG:\n\nPhillip Kofler\nSoftware Engineer | Fullstack Developer\nVillach, Carinthia, Austria\n\nBusiness activity: software development, web development and digital solutions — modern web applications, REST APIs, dashboards and cloud-based systems.\n\nResponsible for the content of this site: Phillip Kofler. The contents are written with care, but I give no guarantee of accuracy, completeness or currentness. Where this site links to external pages, I have no influence over their content and take no responsibility for it. All content here is protected by copyright; use beyond the statutory limits needs my permission first.'
            }
        />
    );
}
