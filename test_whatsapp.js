require('dotenv').config({ path: './server/.env' }); // Adjust path if running from root
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_ID;

console.log('--- WhatsApp API Connection Test ---');

if (!token || !phoneId) {
    console.error('❌ ERROR: Missing credentials in server/.env file.');
    console.error('Please open server/.env and add:');
    console.error('WHATSAPP_TOKEN=your_token_here');
    console.error('WHATSAPP_PHONE_ID=your_phone_id_here');
    process.exit(1);
}

console.log('✅ Credentials found in .env');

function askPhoneNumber() {
    return new Promise((resolve) => {
        const argPhone = process.argv[2];
        if (argPhone) {
            resolve(argPhone);
        } else {
            rl.question('Enter recipient phone number (e.g., 54911...): ', (answer) => {
                resolve(answer.trim());
            });
        }
    });
}

async function testConnection() {
    const testPhoneNumber = await askPhoneNumber();
    if (!testPhoneNumber) {
        console.error('❌ No phone number provided.');
        rl.close();
        return;
    }

    // Basic template message (hello_world is a default Meta template)
    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    const data = {
        messaging_product: 'whatsapp',
        to: testPhoneNumber,
        type: 'template',
        template: {
            name: 'hello_world',
            language: { code: 'en_US' }
        }
    };

    console.log(`\nAttempting to send 'hello_world' template to ${testPhoneNumber}...`);

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ SUCCESS: Message sent!');
        console.log('Message ID:', response.data.messages[0].id);
        console.log('Response Body:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('\n❌ FAILED: Error sending message.');
        if (error.response) {
            console.error('API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        rl.close();
    }
}

testConnection();
