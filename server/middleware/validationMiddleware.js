const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        const data = req.body;

        Object.keys(schema).forEach(field => {
            const rules = schema[field];
            const value = data[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`El campo '${field}' es obligatorio.`);
            }

            if (value !== undefined && value !== null && value !== '') {
                if (rules.type === 'number' && isNaN(Number(value))) {
                    errors.push(`El campo '${field}' debe ser un número.`);
                }
                if (rules.type === 'date' && isNaN(Date.parse(value))) {
                    errors.push(`El campo '${field}' debe ser una fecha válida.`);
                }
                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`El campo '${field}' debe ser uno de: ${rules.enum.join(', ')}.`);
                }
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'fail',
                errors: errors
            });
        }

        next();
    };
};

module.exports = validate;
