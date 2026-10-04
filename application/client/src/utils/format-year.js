// Year of an ISO date, or 'now' for an open end.
export const fmtYear = (d) => (d ? new Date(d).getFullYear() : 'now');
