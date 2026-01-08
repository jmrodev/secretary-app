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
