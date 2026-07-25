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

/**
 * How many months it has been, but only on the days where that number is round.
 *
 * Deliberately calendar-only: the counter above is exact to the second, but an
 * anniversary is a day, not an instant - it shouldn't wait until 15:37:48 to
 * admit what day it is, and it shouldn't stop being true at midnight-minus-one.
 * A start day past the end of the current month (the 31st in a 30-day month)
 * lands on that month's last day, so those months get one too.
 *
 * @param {Date} start
 * @param {Date} end
 * @returns {number|null} months completed today, or null on an ordinary day
 */
export function monthlyMilestone(start, end) {
    const months =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    if (months < 1) {
        return null;
    }

    // Day 0 of the next month is the last day of this one.
    const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const anniversaryDay = Math.min(start.getDate(), lastDayOfMonth);

    return end.getDate() === anniversaryDay ? months : null;
}
