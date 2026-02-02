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

// --- 1. Formatting for Display ---

/**
 * Formats a date for user display (e.g. "10/03/2026")
 * @param {string|Date} date 
 * @param {Object} options - { time: boolean, weekday: boolean, monthName: boolean }
 */
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Inválida';

    const locale = 'es-AR';
    const opts = {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: options.monthName ? 'long' : '2-digit',
        year: 'numeric',
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

// --- 2. Input Handling (<input type="datetime-local" />) ---

/**
 * Converts a Date object to "YYYY-MM-DDTHH:mm" string for use in datetime-local inputs.
 * Uses local time.
 * @param {Date|string} date 
 */
export const toInputDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Safety check
    if (isNaN(d.getTime())) return '';

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
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

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
    if (!input) return null;
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
};

/**
 * Returns the timezone offset in minutes (e.g. 180 for GMT-3)
 */
export const getClientOffset = () => {
    return new Date().getTimezoneOffset();
};
