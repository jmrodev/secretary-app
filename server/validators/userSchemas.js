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
    }
};

module.exports = schemas;
