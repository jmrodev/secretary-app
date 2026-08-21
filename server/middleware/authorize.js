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
 * Authorizes admins unconditionally, or secretaries if they hold the specific permission flag.
 * @param {string} permissionKey e.g. 'can_crud_licenses'
 */
const authorizePermission = (permissionKey) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "No autenticado" });
        }

        if (user.role === ROLES.ADMIN) {
            return next();
        }

        if (user.role === ROLES.SECRETARY) {
            const hasPerm = Boolean(
                user.permissions?.[permissionKey] || 
                user[permissionKey] ||
                (permissionKey === 'can_manage_users' && user.canManageUsers)
            );
            if (hasPerm) {
                return next();
            }
        }

        return res.status(403).json({ message: "Acceso denegado: permisos insuficientes" });
    };
};

const authorizeCanManageUsers = authorizePermission('can_manage_users');

module.exports = { authorize, authorizePermission, authorizeCanManageUsers };

