const schemas = {
    login: {
        username: { required: true },
        password: { required: true }
    },
    register: {
        username: { required: true },
        password: { required: true },
        role: { required: true, enum: ['admin', 'secretary', 'doctor', 'patient'] },
        fullName: { required: true }
    },
    publicRegister: {
        fullName: { required: true },
        dni: { required: true },
        phone: { required: true }
    },
    resetPassword: {
        newPassword: { required: true }
    },
    createUser: {
        username: { required: true },
        password: { required: true },
        role: { required: true, enum: ['admin', 'secretary', 'doctor', 'patient'] },
        fullName: { required: true },
        adminPassword: { required: true }
    },
    updateUser: {
        username: { required: true },
        role: { required: true, enum: ['admin', 'secretary', 'doctor', 'patient'] }
    },
    deleteUser: {
        adminPassword: { required: true }
    },
    updateSecretaryPermissions: {
        secretaryIds: { type: 'array', items: { type: 'integer' } },
        grantToAll: { type: 'boolean' },
        revoke: { type: 'boolean' }
    },
    completeReminder: {
        patientId: { required: true, type: 'number' },
        type: { required: true, enum: ['visit', 'prescription', 'license', 'medication'] }
    }
};

module.exports = schemas;
