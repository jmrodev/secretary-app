export const replaceTemplateVariables = (template, replacements = {}) => {
    return Object.entries(replacements).reduce(
        (acc, [key, value]) => acc.replaceAll(`{${key}}`, value ?? ''),
        template
    );
};

export const capitalizeFirst = (value = '') => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
};

export const capitalizeWords = (value = '') => {
    return value
        .split(' ')
        .filter(Boolean)
        .map(capitalizeFirst)
        .join(' ');
};
