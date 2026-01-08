const { pool } = require('./db');

const insurances = [
    {
        name: 'IOMA',
        cuit: '30-62824952-7',
        email: 'delegtandil@ioma.gba.gov.ar',
        phone: '(0249) 442-5643 / 443-3125',
        website: 'www.ioma.gba.gob.ar',
        address: 'Av. España 950 (Delegación) / Belgrano 1188 (Policonsultorio)'
    },
    {
        name: 'PAMI',
        cuit: '30-66607401-3',
        email: '',
        phone: '(0249) 442-2531 / 442-9320',
        website: 'www.pami.org.ar',
        address: 'Pinto 869'
    },
    {
        name: 'OSECAC',
        cuit: '30-55027355-8',
        email: '',
        phone: '(0249) 443-7470 / 443-7479',
        website: 'www.osecac.org.ar',
        address: 'San Martín 250'
    },
    {
        name: 'OSDE',
        cuit: '30-54674125-3',
        email: 'contacto@osde.com.ar',
        phone: '(0249) 444-0200',
        website: 'www.osde.com.ar',
        address: 'Av. Santamarina 451'
    },
    {
        name: 'Medifé',
        cuit: '30-68273765-0',
        email: '',
        phone: '0800-333-2700 / Emergencias locales USICOM: (0249) 4425107',
        website: 'www.medife.com.ar',
        address: 'San Martín 467'
    },
    {
        name: 'Galeno',
        cuit: '30-52242816-3',
        email: 'galenoazul@galenoargentina.com.ar',
        phone: '0810-777-2583',
        website: 'www.galeno.com.ar',
        address: 'Chacabuco 739'
    },
    {
        name: 'Unión Personal / Accord Salud',
        cuit: '30-68303222-7',
        email: 'info@unionpersonal.com.ar',
        phone: '0810-888-8646',
        website: 'www.unionpersonal.com.ar',
        address: '9 de Julio 244'
    },
    {
        name: 'UTHGRA',
        cuit: '30-53133865-7',
        email: 'uthgratandil2012@hotmail.com.ar',
        phone: '(0249) 4423-982',
        website: 'www.uthgra.org.ar',
        address: 'J.B. Alberdi 420'
    },
    {
        name: 'UOM',
        cuit: '30-58520776-0',
        email: '',
        phone: '(0249) 442-6757 / 438-8878',
        website: 'www.osuomra.org.ar',
        address: 'Rodríguez y Montevideo'
    },
    {
        name: 'OSDOP',
        cuit: '30-58541245-3',
        email: 'delegacion.tandil@osdop.org.ar',
        phone: '(0249) 444-8400',
        website: 'www.osdop.org.ar',
        address: '4 de Abril 494'
    },
    {
        name: 'OSDEPYM',
        cuit: '30-58666171-6',
        email: 'comercialcentral@osdepym.com.ar',
        phone: '(0249) 4463637',
        website: 'www.osdepym.com.ar',
        address: 'Mitre 856'
    },
    {
        name: 'Construir Salud',
        cuit: '30-61445509-4',
        email: 'medb220@uocra.org',
        phone: '(0249) 4425076',
        website: 'www.construirsalud.com.ar',
        address: 'Alem 1232'
    },
    {
        name: 'OSPACP',
        cuit: '30-57962881-9',
        email: 'info@ospacp.org.ar',
        phone: '(0249) 4426775',
        website: 'www.ospacp.org.ar',
        address: 'Gral. Rodríguez 1012'
    },
    {
        name: 'OSPERYH',
        cuit: '',
        email: 'regioncentro@osperyhra.org.ar',
        phone: '(02494) 43-0927',
        website: 'www.fateryh.org.ar',
        address: 'Maipú 190'
    },
    {
        name: 'Caja de Escribanos',
        cuit: '30-61800102-0',
        email: 'tandil@colescba.org.ar',
        phone: '(0249) 442-5734 / 443-1101',
        website: '',
        address: 'General Rodríguez 453'
    }
];

async function seedInsurances() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected to database.');

        // Expand phone column size to accommodate long numbers/descriptions
        await conn.query('ALTER TABLE insurances MODIFY COLUMN phone VARCHAR(255)');
        console.log('Updated insurances table schema: phone column resized to VARCHAR(255).');

        for (const insurance of insurances) {
            // Check if insurance already exists by name
            const rows = await conn.query('SELECT id FROM insurances WHERE name = ?', [insurance.name]);

            if (rows.length > 0) {
                // Update existing insurance
                await conn.query(
                    'UPDATE insurances SET cuit = ?, email = ?, phone = ?, website = ?, address = ?, status = ? WHERE id = ?',
                    [insurance.cuit, insurance.email, insurance.phone, insurance.website, insurance.address, 'active', rows[0].id]
                );
                console.log(`Updated insurance: ${insurance.name}`);
            } else {
                // Insert new insurance
                await conn.query(
                    'INSERT INTO insurances (name, cuit, email, phone, website, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [insurance.name, insurance.cuit, insurance.email, insurance.phone, insurance.website, insurance.address, 'active']
                );
                console.log(`Inserted insurance: ${insurance.name}`);
            }
        }

        console.log('Seeding completed.');

    } catch (err) {
        console.error('Error seeding insurances:', err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

seedInsurances();
