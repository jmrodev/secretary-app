require('dotenv').config({ path: '../server/.env' });
const axios = require('axios');

async function testConnection() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    // REPLACE WITH YOUR TEST PHONE NUMBER (International format, e.g., 52155555555)
    const testPhoneNumber = '56912345678';

    console.log('--- WhatsApp API Connection Test ---');
    console.log('Token exists:', !!token);
    console.log('Phone ID:', phoneId);

    if (!token || !phoneId) {
        console.error('ERROR: Missing credentials in .env file.');
        return;
    }

    try {
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

        console.log(`Attempting to send hello_world to ${testPhoneNumber}...`);
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('SUCCESS: Message sent!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('FAILED: Error sending message.');
        if (error.response) {
            console.error('API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testConnection();
