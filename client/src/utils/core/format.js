/**
 * format.js
 * Centralized formatters for the entire application.
 */

export const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
});

export const DECIMAL_FORMATTER = new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/**
 * Formats a numeric value to ARS currency string.
 * @param {number|string} val 
 */
export const formatCurrency = (val) => {
    if (!val && val !== 0) return '';
    return CURRENCY_FORMATTER.format(Number(val));
};

// Alias for compatibility
export const formatPrice = formatCurrency;

/**
 * Formats a numeric value to decimal string.
 * @param {number|string} val 
 */
export const formatDecimal = (val) => {
    if (!val && val !== 0) return '';
    return DECIMAL_FORMATTER.format(Number(val));
};

/**
 * Formats a Date object or ISO string to Argentina locale format (DD/MM/YYYY).
 * 
 * @param {Date|string} date - The date to format.
 * @param {boolean} includeTime - Whether to include hours and minutes.
 * @returns {string} - Formatted date string.
 */
export const formatDate = (date, includeTime = false) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return d.toLocaleDateString('es-AR', options);
};
