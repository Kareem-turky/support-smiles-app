const axios = require('axios');
async function run() {
  try {
    const login = await axios.post('http://localhost:3000/auth/login', { email: 'admin@company.com', password: 'admin123' });
    const token = login.data.access_token;
    console.log("Logged in");
    const reasons = await axios.get('http://localhost:3000/ticket-reasons', { headers: { Authorization: `Bearer ${token}` }});
    const reason_id = reasons.data[0].id;
    console.log("Got reason", reason_id);
    const res = await axios.post('http://localhost:3000/tickets', {
      order_number: '12345',
      courier_company: 'Aramex',
      issue_type: 'DELIVERY',
      description: 'Test ticket',
      reason_id: reason_id,
      assigned_to: ''
    }, { headers: { Authorization: `Bearer ${token}` }});
    console.log("Success", res.data);
  } catch (e) {
    console.error("Error Response Body:", e.response ? e.response.data : e.message);
  }
}
run();
