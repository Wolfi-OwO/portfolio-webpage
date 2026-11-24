// The logo that hangs under a career row, found from the organisation's name. Records keep the language they were
// written in and carry the other one in `translations`, so every organisation needs both of its names here:
// the Bundesheer entry reads "Austrian Armed Forces" in English and had no logo until this list knew that.
const LOGOS = [
    [/infineon/i, '/logos/infineon.png'],
    [/bundesheer|armed forces/i, '/logos/bundesheer.png'],
    [/htl villach/i, '/logos/htl-villach.png'],
    [/perau/i, '/logos/perau.png'],
];

export const logoFor = (org = '') => LOGOS.find(([re]) => re.test(org))?.[1];
