const schemas = {
    createAppointment: {
        doctor_id: { required: true, type: 'number' },
        patient_id: { required: false, type: 'number' }, // Optional if role is patient
        appointment_date: { required: true, type: 'date' },
        type: { required: false, enum: ['consultation', 'virtual'] },
        institution_id: { required: false }
    },
    updateStatus: {
        status: { required: true, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'suspended', 'absent', 'rescheduled', 'arrived'] },
        reason: { required: false }
    },
    updatePayment: {
        status: { required: true, enum: ['pending', 'debt', 'paid', 'partially_paid'] }
    }
};

module.exports = schemas;
