const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'clinical_management',
    connectionLimit: 5
});

async function importVademecum() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB. Clearing existing vademecum data...");
        await conn.query("TRUNCATE TABLE vademecum");

        const filePath = path.join(__dirname, 'vademecum_iosfa.csv');
        if (!fs.existsSync(filePath)) {
            console.error("CSV file not found:", filePath);
            return;
        }

        const results = [];
        console.log("Reading CSV...");

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`CSV read complete. ${results.length} records found. Inserting into DB...`);

                // Batch insert
                const batchSize = 1000;
                for (let i = 0; i < results.length; i += batchSize) {
                    const batch = results.slice(i, i + batchSize);
                    const sql = "INSERT INTO vademecum (nombre, presentacion, monodroga, laboratorio, vademecum_type, fcias_propias, fcias_convenidas, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    const values = batch.map(row => [
                        row['NOMBRE'] || '',
                        row['PRESENTACIÓN'] || '',
                        row['MONODROGA'] || '',
                        row['LABORATORIO'] || '',
                        row['VADEMÉCUM'] || '',
                        row['FCIAS. PROPIAS'] || '',
                        row['FCIAS. CONVENIDAS'] || '',
                        row['OBSERV'] || ''
                    ]);

                    await conn.batch(sql, values);
                    console.log(`Inserted ${i + batch.length} / ${results.length}`);
                }

                console.log("Import finished successfully!");
                process.exit(0);
            });

    } catch (err) {
        console.error("Import error:", err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

importVademecum();
