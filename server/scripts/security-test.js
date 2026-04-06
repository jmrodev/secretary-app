const { buildUpdateQuery, buildInsertQuery } = require('../utils/sqlUtils');
const assert = require('assert');

// 1. Test filtering of invalid column in Update
{
    const maliciousUpdates = {
        amount: 50,
        status: 'paid',
        'status = "hacked" --': 'exploited'
    };
    const { setClauses, values } = buildUpdateQuery('transactions', maliciousUpdates);

    assert.strictEqual(setClauses, '`amount` = ?, `status` = ?');
    assert.deepStrictEqual(values, [50, 'paid']);
    console.log('Update query whitelisting works correctly.');
}

// 2. Test filtering of invalid column in Insert
{
    const maliciousData = {
        type: 'income',
        amount: 100,
        'injection_attempt") --': 'ignored'
    };
    const { columns, placeholders, values } = buildInsertQuery('transactions', maliciousData);

    assert.strictEqual(columns, '`type`, `amount`');
    assert.strictEqual(placeholders, '?, ?');
    assert.deepStrictEqual(values, ['income', 100]);
    console.log('Insert query whitelisting works correctly.');
}

// 3. Test empty valid keys
{
    const emptyUpdates = { invalid_key: 'test' };
    const { setClauses, values } = buildUpdateQuery('transactions', emptyUpdates);

    assert.strictEqual(setClauses, null);
    assert.deepStrictEqual(values, []);
    console.log('Empty object handling works correctly.');
}

console.log('All tests passed!');
