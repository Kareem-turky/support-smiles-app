
const axios = require('axios');

async function run() {
    const API_URL = 'http://localhost:4001';
    let adminToken = '';
    let apiKey = '';
    let clientId = '';

    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        adminToken = loginRes.data.data.access_token;
        console.log('✅ Admin logged in.');

        console.log('2. Creating Integration Client...');
        const clientRes = await axios.post(`${API_URL}/admin/integrations/clients`,
            { name: 'E2E Test Client' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        clientId = clientRes.data.id;
        console.log('✅ Client created:', clientId);

        console.log('3. Generating API Key...');
        const keyRes = await axios.post(`${API_URL}/admin/integrations/clients/${clientId}/keys`,
            { scopes: ['issues:write'] },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        apiKey = keyRes.data.key;
        console.log('✅ API Key generated:', apiKey);

        console.log('4. Creating Webhook Subscription...');
        await axios.post(`${API_URL}/admin/integrations/webhooks`,
            {
                clientId,
                name: 'Test Webhook',
                url: 'https://webhook.site/test',
                secret: 'test_secret',
                events: ['TICKET_CREATED']
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Webhook subscribed.');

        console.log('5. Testing Inbound Issue (First Attempt)...');
        const issuePayload = {
            source: 'e2e_test',
            external_id: 'ord_12345',
            order_number: 'ORD-12345',
            issue_type: 'DELIVERY',
            priority: 'HIGH',
            title: 'Missing package',
            description: 'Customer says package not arrived.'
        };

        const issueRes1 = await axios.post(`${API_URL}/api/v1/integrations/issues`,
            issuePayload,
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        console.log('✅ Issue 1 Created. Ticket ID:', issueRes1.data.data.ticket_id);
        console.log('   Duplicate?', issueRes1.data.data.duplicate);

        if (issueRes1.data.data.duplicate) throw new Error('First attempt should not be duplicate');

        console.log('6. Testing Inbound Issue (Idempotency check)...');
        const issueRes2 = await axios.post(`${API_URL}/api/v1/integrations/issues`,
            issuePayload,
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        console.log('✅ Issue 2 Response. Duplicate?', issueRes2.data.data.duplicate);

        if (!issueRes2.data.data.duplicate) throw new Error('Second attempt MUST be duplicate');
        if (issueRes1.data.data.ticket_id !== issueRes2.data.data.ticket_id) throw new Error('Ticket IDs must match');

        console.log('7. Verifying Ticket in System...');
        const ticketRes = await axios.get(`${API_URL}/tickets/${issueRes1.data.data.ticket_id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        if (ticketRes.data.description !== issuePayload.description) throw new Error('Ticket description mismatch');
        console.log('✅ Ticket verified in main API.');

        console.log('🎉 E2E INTEGRATION TEST PASSED!');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

run();
