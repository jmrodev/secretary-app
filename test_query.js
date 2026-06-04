const PatientsQueryBuilder = require('./server/utils/database/queryBuilders/PatientsQueryBuilder');

try {
    const builder = new PatientsQueryBuilder();
    builder.withFullDetails().where('p.id = ?', 8608);
    const { query, params } = builder.build();
    console.log('Query:', query);
    console.log('Params:', params);
} catch (err) {
    console.error('Error generating query:', err);
}
