const mariadb = require('mariadb');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'clinical_management',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 50
});

async function getConnection() {
  try {
    const conn = await pool.getConnection();
    return conn;
  } catch (err) {
    console.error('Error connecting to MariaDB:', err);
    throw err;
  }
}

module.exports = { pool, getConnection };
