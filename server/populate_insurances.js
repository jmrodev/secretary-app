const { pool } = require('./db');

const insurances = [
    { name: 'IOMA', address: 'Av. España 350, Tandil', phone: '0249 444-2458', email: 'consultas@ioma.gba.gob.ar', website: 'https://www.ioma.gba.gob.ar' },
    { name: 'PAMI', address: 'Pinto 865, Tandil', phone: '138', email: 'consultas@pami.org.ar', website: 'https://www.pami.org.ar' },
    { name: 'OSDE', address: 'Santamarina 451, Tandil', phone: '0810-555-6733', email: 'contacto@osde.com.ar', website: 'https://www.osde.com.ar' },
    { name: 'Swiss Medical', address: 'Gral. Rodríguez 664, Tandil', phone: '0810-444-7700', email: 'info@swissmedical.com.ar', website: 'https://www.swissmedical.com.ar' },
    { name: 'Galeno', address: 'Sarmiento 740, Tandil', phone: '0810-222-7800', email: '', website: 'https://www.galeno.com.ar' },
    { name: 'Sancor Salud', address: 'Chacabuco 649, Tandil', phone: '0810-444-72583', email: '', website: 'https://www.sancorsalud.com.ar' },
    { name: 'OSECAC', address: '9 de Julio 555, Tandil', phone: '0249 442-4545', email: 'info@osecac.org.ar', website: 'https://www.osecac.org.ar' },
    { name: 'Medifé', address: 'Belgrano 553, Tandil', phone: '0800-333-2700', email: '', website: 'https://www.medife.com.ar' },
    { name: 'Prevención Salud', address: 'Av. España 898, Tandil', phone: '0810-888-0008', email: '', website: 'https://www.prevencionsalud.com.ar' },
    { name: 'Federada Salud', address: 'San Martín 650, Tandil', phone: '0810-222-3333', email: '', website: 'https://www.federada.com' },
    { name: 'Avalian', address: 'Fuerte Independencia 350, Tandil', phone: '0810-222-72583', email: '', website: 'https://www.avalian.com' },
    { name: 'OMINT', address: 'Tandil', phone: '0800-555-66468', email: '', website: 'https://www.omint.com.ar' },
    { name: 'Jerárquicos Salud', address: '14 de Julio 563, Tandil', phone: '0800-555-4844', email: '', website: 'https://www.jerarquicos.com' },
    { name: 'Unión Personal (UP)', address: 'Tandil', phone: '0810-888-8646', email: '', website: 'https://www.unionpersonal.com.ar' },
    { name: 'Accord Salud', address: 'Tandil', phone: '0810-888-2226', email: '', website: 'https://www.accordsalud.com.ar' },
    { name: 'OSPRERA', address: 'Sarmiento 838, Tandil', phone: '0249 442-3030', email: '', website: 'https://www.osprera.org.ar' }
];

async function populate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database. Populating insurances...");

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
