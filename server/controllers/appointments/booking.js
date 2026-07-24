const bookingService = require('../../services/appointments/bookingService');

exports.createAppointment = async (req, res) => {
    try {
        const result = await bookingService.createAppointment(req.user.user_id, req.user.role, req.body);
        res.status(201).json({ id: result.id, message: "Appointment created" });
    } catch (err) {
        console.error("Booking Error:", err);
        // Centralized Error Handling (Basic version here)
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            status: err.status || 'error',
            message: err.message
        });
    }
};
