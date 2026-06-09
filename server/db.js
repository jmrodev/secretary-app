const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

let pool;

// Dynamic import required for mariadb 3.x (ESM-only package)
const dbReady = (async () => {
  const mariadbModule = await import('mariadb');
  // mariadb v3 ESM: createPool may be on default or directly on the module namespace
  const { createPool } = mariadbModule.default ?? mariadbModule;
  pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'clinical_management',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 50
  });
  return pool;
})();

async function getConnection() {
  if (!pool) await dbReady;
  try {
    const conn = await pool.getConnection();
    return conn;
  } catch (err) {
    console.error('Error connecting to MariaDB:', err);
    throw err;
  }
}

// Use getter so pool reference is always current after async init
module.exports = {
  get pool() { return pool; },
  getConnection,
  dbReady
};
