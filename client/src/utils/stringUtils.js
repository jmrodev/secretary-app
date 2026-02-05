
/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str 
 * @returns {string}
 */
export const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/(^|\s)\S/g, l => l.toUpperCase());
};

/**
 * Capitalizes the first letter of the string only.
 * @param {string} str 
 * @returns {string}
 */
export const capitalizeFirst = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};
