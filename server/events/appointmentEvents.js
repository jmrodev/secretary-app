const EventEmitter = require('events');
class AppointmentEventEmitter extends EventEmitter { }
const appointmentEvents = new AppointmentEventEmitter();

module.exports = appointmentEvents;
