const officeService = require('../services/officeService');

exports.getAllConsultorios = async (req, res) => {
    try {
        const rows = await officeService.getAllOffices();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.createConsultorio = async (req, res) => {
    try {
        await officeService.createOffice(req.body);
        res.status(201).send("Consultorio created");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.createRental = async (req, res) => {
    try {
        await officeService.createRental(req.user.user_id, req.body);
        res.status(201).send("Rental created");
    } catch (err) {
        if (err.message === "Not a doctor") return res.status(403).send(err.message);
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getMyRentals = async (req, res) => {
    try {
        const rows = await officeService.getMyRentals(req.user.user_id);
        res.json(rows);
    } catch (err) {
        if (err.message === "Not a doctor") return res.status(403).send(err.message);
        console.error(err);
        res.status(500).send("Server Error");
    }
};
