const { ROLES } = require('../constants/roles');

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

/**
 * Grants access to admins and to secretaries whose JWT carries
 * canManageUsers: true. Used to protect user-management endpoints
 * beyond the plain role check.
 */
const authorizeCanManageUsers = (req, res, next) => {
    const userRole = req.user?.role;
    const canManageUsers = req.user?.canManageUsers === true;

    if (userRole === ROLES.ADMIN || (userRole === ROLES.SECRETARY && canManageUsers)) {
        return next();
    }

    return res.status(403).json({ message: "Acceso denegado: permisos insuficientes" });
};

module.exports = { authorize, authorizeCanManageUsers };
