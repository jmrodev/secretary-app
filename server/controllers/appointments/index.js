const booking = require('./booking');
const modification = require('./modification');
const retrieval = require('./retrieval');
const availability = require('./availability');

module.exports = {
    ...booking,
    ...modification,
    ...retrieval,
    ...availability
};
