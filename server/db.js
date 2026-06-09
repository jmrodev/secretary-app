const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

let _pool = null;

// Dynamic import required for mariadb 3.x (ESM-only package)
const dbReady = (async () => {
  const mariadbModule = await import('mariadb');
  // mariadb v3 ESM: createPool is a named export on the module namespace
  const { createPool } = mariadbModule.default ?? mariadbModule;
  _pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'clinical_management',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 50
  });
  return _pool;
})();

async function getConnection() {
  if (!_pool) await dbReady;
  try {
    const conn = await _pool.getConnection();
    return conn;
  } catch (err) {
    console.error('Error connecting to MariaDB:', err);
    throw err;
  }
}

// Proxy so that `const { pool } = require('./db')` captures a live reference.
// All method calls on `pool` are forwarded to the real pool once initialized.
// This allows all 60+ existing files to work without modification.
const pool = new Proxy({}, {
  get(_target, prop) {
    if (!_pool) {
      // Pool not ready yet — return async wrapper that waits for init
      return async (...args) => {
        await dbReady;
        return _pool[prop](...args);
      };
    }
    const value = _pool[prop];
    return typeof value === 'function' ? value.bind(_pool) : value;
  }
});

module.exports = { pool, getConnection, dbReady };
