const { LoginTicket } = require('afip-apis');
const path = require('path');
const fs = require('fs');

async function getAuth() {
    const cuit = '27252572592';
    const certPath = path.resolve(__dirname, '../certs/doctors/10/cert.crt');
    const keyPath = path.resolve(__dirname, '../certs/doctors/10/private.key');
    const wsaaUrl = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    const cachePath = path.resolve(__dirname, '../certs/doctors/10/ta_dev.json');

    const lt = new LoginTicket();

    try {
        console.log(`Requesting new TA for ${cuit}...`);
        const res = await lt.wsaaLogin('wsfe', wsaaUrl, certPath, keyPath);

        const tokenData = {
            token: res.token,
            sign: res.sign,
            expirationTime: res.expirationTime
        };

        fs.writeFileSync(cachePath, JSON.stringify(tokenData));
        console.log(`Success! TA saved to ${cachePath}`);
        console.log(`Expires at: ${res.expirationTime}`);
    } catch (err) {
        console.error("Error:", err.message);
        if (err.extra) console.error("Extra:", JSON.stringify(err.extra, null, 2));
    }
}

getAuth();
