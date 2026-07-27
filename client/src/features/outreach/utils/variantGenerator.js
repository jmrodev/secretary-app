/**
 * Outreach Message Variant Generator.
 *
 * Pure function: given a message body, generates 3 variants
 * with rotating greeting headers and closing footers.
 *
 * @param {string} body - The message body text.
 * @returns {Array<{header: string, body: string, footer: string}>}
 */
export const generateVariants = (body) => {
    if (!body || !body.trim()) {
        return [];
    }

    const headers = [
        '¡Hola {name}!',
        'Estimado/a {name}',
        '{name}, te recordamos'
    ];

    const footers = [
        'Saludos, Secretaría',
        'Atentamente',
        'Gracias por confiar en nosotros'
    ];

    // Ensure unique rotation each call using the body length as seed offset
    const seedOffset = body.length % 3;

    return headers.map((header, i) => {
        const headerIndex = (i + seedOffset) % headers.length;
        const footerIndex = (i + seedOffset + 1) % footers.length;

        return {
            header: headers[headerIndex],
            body,
            footer: footers[footerIndex]
        };
    });
};
