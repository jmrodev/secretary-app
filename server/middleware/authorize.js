const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Convertimos a array si nos pasan un solo rol (ej: ROLES.ADMIN)
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        const userRole = req.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ message: "Acceso denegado: permisos insuficientes" });
        }
        next();
    };
};

module.exports = { authorize };
