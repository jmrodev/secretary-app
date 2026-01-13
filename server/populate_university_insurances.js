const { pool } = require('./db');

const insurances = [
    {
        name: 'OSFATUN',
        address: 'Belgrano 391, Tandil',
        phone: '0249 4516930',
        email: 'tandil@osfatun.org.ar',
        website: 'https://www.osfatun.com.ar'
    },
    {
        name: 'OSPUNCPBA (UNICEN)',
        address: '14 de Julio 380, Tandil',
        phone: '0249 443-1289',
        email: 'obrasoc@rec.unicen.edu.ar',
        website: 'https://www.unicen.edu.ar'
    }
];

async function populate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database. Populating university insurances...");

        for (const ins of insurances) {
            // Check if exists
            const exists = await conn.query("SELECT id FROM insurances WHERE name = ?", [ins.name]);
            if (exists.length === 0) {
                await conn.query(
                    "INSERT INTO insurances (name, address, phone, email, website, status) VALUES (?, ?, ?, ?, ?, 'active')",
                    [ins.name, ins.address, ins.phone, ins.email, ins.website]
                );
                console.log(`Inserted: ${ins.name}`);
            } else {
                console.log(`Skipped (already exists): ${ins.name}`);
            }
        }
        console.log("Done!");
        process.exit(0);
    } catch (err) {
        console.error("Error populating:", err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

populate();
