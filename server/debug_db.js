const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'cima1255',
  database: 'clinical_management',
  port: 3307,
  connectionLimit: 5
});

async function test() {
    try {
        console.log("--- Checking User: admin ---");
        const rows = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        console.log("Rows returned:", rows);
        console.log("Rows length:", rows.length);
        console.log("First row type:", typeof rows[0]);
        console.log("First row content:", rows[0]);
        
        if (rows.length > 0) {
            console.log("SUCCESS: admin user found.");
        } else {
            console.log("ERROR: admin user NOT found.");
        }
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}
test();
