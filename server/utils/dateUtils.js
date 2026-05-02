/**
 * Timezone Utility for Secretary App
 * 
 * This file centralizes the logic to ensure dates are always handled in 
 * the local timezone (America/Argentina/Buenos_Aires) and prevents
 * the typical UTC shift (+3hs) issue.
 */

const TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Formats a date object or string into a MariaDB-compatible string (YYYY-MM-DD HH:mm:ss)
 * without shifting to UTC.
 */
function formatLocalSQL(dateInput) {
    if (!dateInput) return null;

    // If it's a string, we assume it's already in the intended "local" display format
    // (e.g., from an <input type="datetime-local"> like "2026-02-05T14:30")
    if (typeof dateInput === 'string') {
        return dateInput.replace('T', ' ').slice(0, 19);
    }

    // If it's a Date object, we manually build the string to avoid .toISOString() shift
    const d = dateInput;
    const pad = (n) => n.toString().padStart(2, '0');

    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());

    return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

/**
 * Returns the current date/time as a SQL string in local time.
 */
function nowLocalSQL() {
    return formatLocalSQL(new Date());
}

/**
 * Formats a date object or string into a MariaDB-compatible DATE string (YYYY-MM-DD)
 */
function formatDateOnlySQL(dateInput) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

module.exports = {
    TIMEZONE,
    formatLocalSQL,
    formatDateOnlySQL,
    nowLocalSQL
};
