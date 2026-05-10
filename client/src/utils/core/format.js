/**
 * Formats a number as a currency string.
 * Uses 'es-AR' locale by default to show thousands separator as dot (10.000).
 * 
 * @param {number|string} value - The value to format.
 * @returns {string} - Formatted currency string (e.g. "$ 10.000,00" or "$ 10.000")
 */
export const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '$ 0';
    const num = Number(value);
    if (isNaN(num)) return '$ 0';

    // Using es-AR for dot thousands separator and comma decimal
    // maximumFractionDigits: 0 to avoid cents if not needed, or 2 if precise.
    // User requested "ver los valores mas facil", usually integers for these prices.
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
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
