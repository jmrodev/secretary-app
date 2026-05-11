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

    let d;
    if (typeof dateInput === 'string') {
        // If it's a full ISO string (contains Z or offset), we must parse it to get the absolute time
        // and then extract local components.
        if (dateInput.includes('Z') || dateInput.match(/[+-]\d{2}:?\d{2}$/)) {
            d = new Date(dateInput);
        } else {
            // It's already a local-intended string (e.g. 2026-05-10T14:30)
            return dateInput.replace('T', ' ').slice(0, 19);
        }
    } else {
        d = dateInput;
    }

    if (!(d instanceof Date) || isNaN(d.getTime())) return null;

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
 * without UTC shifting issues.
 */
function formatDateOnlySQL(dateInput) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    
    const pad = (n) => n.toString().padStart(2, '0');
    // Using local methods to match the "Secretary Display" intended date
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats a date for AFIP/ARCA API (YYYYMMDD) in Argentina Timezone.
 */
function formatAfipDate(dateInput = new Date()) {
    const d = new Date(dateInput);
    const pad = (n) => n.toString().padStart(2, '0');
    
    // We can use Intl or just manual local methods if we trust the server time is Argentina
    // To be 100% safe as per Rule 15.4, we use manual local components
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    
    return `${YYYY}${MM}${DD}`;
}

/**
 * Formats a date for display (DD/MM/YYYY).
 */
function formatDateDisplay(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Formats a time for display (HH:mm).
 */
function formatTimeDisplay(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = {
    TIMEZONE,
    formatLocalSQL,
    formatDateOnlySQL,
    nowLocalSQL,
    formatAfipDate,
    formatDateDisplay,
    formatTimeDisplay
};
