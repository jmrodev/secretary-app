/**
 * dateUtils.js
 * 
 * Centralized utility for robust Date handling, specifically designed to bridge
 * the gap between Client Local Time, HTML Input elements, and the Backend API.
 * 
 * Target Behavior:
 * - Inputs use Local Time (YYYY-MM-DDTHH:mm).
 * - API receives ISO UTC Strings (YYYY-MM-DDTHH:mm:ss.sssZ).
 * - Backend converts ISO UTC -> Argentina Time for storage.
 */

// --- 1. Parsing ---

/**
 * Safely parses "DD/MM/YYYY" or ISO strings into a Date object.
 * @param {string|Date} input 
 */
export const parseDate = (input) => {
    if (!input) return null;
    if (input instanceof Date) return input;

    // Check if it's DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const match = input.match(ddmmyyyy);
    if (match) {
        return new Date(match[3], match[2] - 1, match[1]);
    }

    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
};

// --- 2. Formatting for Display ---

/**
 * Formats a date for user display (e.g. "10/03/2026")
 * @param {string|Date} date 
 * @param {Object} options - { time: boolean, weekday: boolean, monthName: boolean, hideYear: boolean }
 */
export const formatDate = (date, options = {}) => {
    const d = parseDate(date);
    if (!d) return options.fallback || 'N/A';

    const locale = 'es-AR';
    const opts = {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: options.monthName ? 'long' : '2-digit',
        ...(options.hideYear ? {} : { year: 'numeric' }),
        ...(options.weekday && { weekday: 'long' }),
        ...(options.time && { hour: '2-digit', minute: '2-digit' })
    };

    let str = d.toLocaleDateString(locale, opts);
    // Capitalize first letter if it's a weekday/month name
    if (options.weekday || options.monthName) {
        str = str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
};

/**
 * Formats only the time (e.g. "14:30")
 * @param {string|Date} date 
 */
export const formatTime = (date) => {
    const d = parseDate(date);
    if (!d) return '--:--';
    return d.toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- 2. Input Handling (<input type="datetime-local" />) ---

/**
 * Converts a Date object to "YYYY-MM-DDTHH:mm" string for use in datetime-local inputs.
 * Uses local time.
 * @param {Date|string} date 
 */
export const toInputDateTime = (date) => {
    const d = parseDate(date);
    if (!d) return '';

    // We need 'YYYY-MM-DDTHH:mm' in Local Time.
    // d.toISOString() gives UTC.
    // Trick: Shift time by timezone offset, then ISO, then slice.
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
    return localISOTime;
};

/**
 * Converts a Date object to "YYYY-MM-DD" string for use in date inputs.
 * Uses local time.
 * @param {Date|string} date 
 */
export const toInputDate = (date) => {
    const d = parseDate(date);
    if (!d) return '';

    // YYYY-MM-DD
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localISODate = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 10);
    return localISODate;
};

// --- 3. API Communication ---

/**
 * Prepares a date for the API.
 * Ensures we send a full ISO UTC string.
 * @param {string|Date} input - Can be Date object or "YYYY-MM-DDTHH:mm" string
 */
export const toApiDate = (input) => {
    const d = parseDate(input);
    if (!d) return null;
    return d.toISOString();
};

/**
 * Returns the timezone offset in minutes (e.g. 180 for GMT-3)
 */
export const getClientOffset = () => {
    return new Date().getTimezoneOffset();
};
