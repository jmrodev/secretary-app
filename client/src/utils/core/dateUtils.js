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
    const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
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
 * Returns the month name for a given month index (0-11).
 * @param {number} monthIndex 
 * @param {Function} t - Translation function
 */
export const getMonthName = (monthIndex, t = null) => {
    if (t && t('months_array')) {
        return t('months_array')[monthIndex];
    }
    return new Date(2026, monthIndex, 1).toLocaleDateString('es-AR', {
        month: 'long',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
};

/**
 * Returns an array of month options for use in Select components.
 * @param {Function} t - Translation function
 * @param {string} allLabelKey - Translation key for "All Months"
 */
export const getMonthsOptions = (t, allLabelKey = 'all_months') => {
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: getMonthName(i, t)
    }));

    if (allLabelKey) {
        return [{ value: 'all', label: t(allLabelKey) || 'Todos los meses' }, ...months];
    }
    return months;
};

/**
 * Formats only the time (e.g. "14:30")
 * @param {string|Date} date 
 */
export const formatTime = (date, options = {}) => {
    const d = parseDate(date);
    if (!d) return '--:--';
    return d.toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        hour12: options.hour12 !== undefined ? options.hour12 : true
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
 * Formats a date with full time and AM/PM (e.g. "20/02/2026 06:54 a. m.")
 * @param {string|Date} date 
 */
export const formatDateTimeLong = (date) => {
    const d = parseDate(date);
    if (!d) return 'N/A';
    return d.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');
};

/**
 * Returns true if the date is before the current time.
 */
export const isPast = (date) => {
    const d = parseDate(date);
    if (!d) return false;
    return d < new Date();
};

/**
 * Returns true if the date is before today (at 00:00:00).
 */
export const isPastDay = (date) => {
    const d = parseDate(date);
    if (!d) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d < today;
};

/**
 * Returns true if two dates represent the same day (Year, Month, Day)
 */
export const isSameDay = (d1, d2) => {
    const a = parseDate(d1);
    const b = parseDate(d2);
    if (!a || !b) return false;

    // Use toLocaleDateString with Argentina timezone to get a stable comparison string "YYYY-MM-DD"
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const strA = a.toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD
    const strB = b.toLocaleDateString('en-CA', options);
    
    return strA === strB;
};

/**
 * Returns true if the date is today.
 */
export const isToday = (date) => {
    return isSameDay(date, new Date());
};

/**
 * Returns a "time ago" string from a date.
 * e.g. "hace 2 horas", "hace 5 min", "Justo ahora"
 */
export const timeAgo = (date) => {
    const d = parseDate(date);
    if (!d) return '';
    const now = new Date();
    const diffMs = now - d;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'Justo ahora';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;

    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;

    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;

    const years = Math.floor(days / 365);
    return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
};

/**
 * Calculates age based on a birth date.
 * @param {string|Date} dob 
 */
export const calculateAge = (dob) => {
    const birthDate = parseDate(dob);
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Returns the timezone offset in minutes (e.g. 180 for GMT-3)
 */
export const getClientOffset = () => {
    return new Date().getTimezoneOffset();
};
