/**
 * Nigerian Public Holidays
 *
 * Update this list whenever the Federal Government
 * announces the official holidays for a new year.
 */

const publicHolidays = {
    2026: [
        {
            date: '2026-01-01',
            name: "New Year's Day"
        },
        {
            date: '2026-03-19',
            name: 'Eid-ul-Fitr'
        },
        {
            date: '2026-03-20',
            name: 'Eid-ul-Fitr'
        },
        {
            date: '2026-04-03',
            name: 'Good Friday'
        },
        {
            date: '2026-04-06',
            name: 'Easter Monday'
        },
        {
            date: '2026-05-01',
            name: "Workers' Day"
        },
        {
            date: '2026-05-27',
            name: 'Eid-ul-Adha'
        },
        {
            date: '2026-05-28',
            name: 'Eid-ul-Adha'
        },
        {
            date: '2026-06-12',
            name: 'Democracy Day'
        },
        {
            date: '2026-10-01',
            name: 'Independence Day'
        },
        {
            date: '2026-12-25',
            name: 'Christmas Day'
        },
        {
            date: '2026-12-26',
            name: 'Boxing Day'
        }
    ]
};


/**
 * Checks whether a date is a public holiday.
 *
 * @param {Date} date
 * @returns {boolean}
 */
function isPublicHoliday(date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dateKey = `${year}-${month}-${day}`;

    const holidaysForYear = publicHolidays[year] || [];

    return holidaysForYear.some(
        holiday => holiday.date === dateKey
    );
}


/**
 * Returns the public holiday information
 * for a given date.
 *
 * @param {Date} date
 * @returns {Object|null}
 */
function getPublicHoliday(date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dateKey = `${year}-${month}-${day}`;

    const holidaysForYear = publicHolidays[year] || [];

    return holidaysForYear.find(
        holiday => holiday.date === dateKey
    ) || null;
}


module.exports = {
    publicHolidays,
    isPublicHoliday,
    getPublicHoliday
};