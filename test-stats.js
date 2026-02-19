const { pool } = require('./server/db');
const statsService = require('./server/services/finance/statsService');

async function test() {
    try {
        const stats = await statsService.getDetailedStats(10);
        console.log(JSON.stringify(stats, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
            , 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
