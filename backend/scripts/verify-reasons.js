const axios = require('axios');

const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASS = 'admin123';
const ACCOUNTING_EMAIL = 'sarah@company.com';
const ACCOUNTING_PASS = 'accounting123';

async function login(email, password) {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        return res.data.data.access_token;
    } catch (error) {
        console.error(`Login failed for ${email}:`, error.response?.data || error.message);
        process.exit(1);
    }
}

async function main() {
    console.log('🔍 Starting Ticket Reasons Verification...');

    // 1. Login
    const adminToken = await login(ADMIN_EMAIL, ADMIN_PASS);
    const userToken = await login(ACCOUNTING_EMAIL, ACCOUNTING_PASS);
    console.log('✅ Logged in');

    // 2. Create Reason (Admin)
    const reasonName = `Test Reason ${Date.now()}`;
    let reasonId;
    try {
        const res = await axios.post(`${API_URL}/admin/ticket-reasons`, {
            name: reasonName,
            category: 'SHIPPING',
            sort_order: 1
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        reasonId = res.data.id;
        console.log(`✅ Admin Created Reason: ${reasonName} (${reasonId})`);
    } catch (error) {
        console.error('❌ Failed to create reason:', error.response?.data || error.message);
        process.exit(1);
    }

    // 3. List Reasons (Public)
    try {
        const res = await axios.get(`${API_URL}/ticket-reasons?activeOnly=true`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const found = res.data.find(r => r.id === reasonId);
        if (found) console.log('✅ Public List contains new reason');
        else throw new Error('Reason not found in list');
    } catch (error) {
        console.error('❌ Failed to list reasons:', error.response?.data || error.message);
        process.exit(1);
    }

    // 4. Create Ticket with Reason (User)
    try {
        const res = await axios.post(`${API_URL}/tickets`, {
            order_number: `ORD-TEST-${Date.now()}`,
            courier_company: 'TestEx',
            issue_type: 'DELIVERY',
            priority: 'MEDIUM',
            description: 'Test Description',
            reason_id: reasonId
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log(`✅ User Created Ticket with Reason: ${res.data.id}`);
    } catch (error) {
        console.error('❌ Failed to create ticket with reason:', error.response?.data || error.message);
        process.exit(1);
    }

    // 5. Fail to create ticket without reason
    try {
        await axios.post(`${API_URL}/tickets`, {
            order_number: `ORD-FAIL-${Date.now()}`,
            courier_company: 'TestEx',
            issue_type: 'DELIVERY',
            priority: 'MEDIUM',
            description: 'Test Description',
            // No reason_id
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.error('❌ Ticket creation should have failed without reason!');
        process.exit(1);
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 422) {
            console.log('✅ Ticket creation correctly failed without reason');
        } else {
            console.error('❌ Unexpected error when creating invalid ticket:', error.response?.status);
        }
    }

    console.log('🎉 ALL BACKEND CHECKS PASSED');
}

main();
