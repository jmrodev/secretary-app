/**
 * Query Builders - Exporta todos los builders disponibles
 */

const BaseQueryBuilder = require('./BaseQueryBuilder');
const PatientsQueryBuilder = require('./PatientsQueryBuilder');
const DoctorsQueryBuilder = require('./DoctorsQueryBuilder');

module.exports = {
    BaseQueryBuilder,
    PatientsQueryBuilder,
    DoctorsQueryBuilder
    // Aquí agregaremos AppointmentsQueryBuilder, TransactionsQueryBuilder, etc.
};
