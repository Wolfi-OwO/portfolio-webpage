/**
 * Calendar-accurate time between two dates, as years/months/days/h/m/s.
 *
 * Deliberately not a millisecond division: "a month" isn't a fixed length, so
 * dividing by 30 days drifts and would eventually show the wrong month count on
 * an anniversary. This subtracts field by field and borrows, using the real
 * length of the month being borrowed from.
 *
 * @param {Date} start
 * @param {Date} end
 * @returns {{years: number, months: number, days: number, hours: number, minutes: number, seconds: number}}
 */
export function elapsedSince(start, end) {
    if (end < start) {
        return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    let hours = end.getHours() - start.getHours();
    let minutes = end.getMinutes() - start.getMinutes();
    let seconds = end.getSeconds() - start.getSeconds();

    if (seconds < 0) {
        seconds += 60;
        minutes -= 1;
    }

    if (minutes < 0) {
        minutes += 60;
        hours -= 1;
    }

    if (hours < 0) {
        hours += 24;
        days -= 1;
    }

    if (days < 0) {
        // Day 0 of the current month is the last day of the previous one, which
        // is exactly the month we're borrowing days from.
        days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        months -= 1;
    }

    if (months < 0) {
        months += 12;
        years -= 1;
    }

    return { years, months, days, hours, minutes, seconds };
}
