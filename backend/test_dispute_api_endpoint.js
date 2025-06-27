const axios = require('axios');

async function testDisputeAPIEndpoint() {
    try {
        console.log('🔍 Testing actual dispute API endpoint...');
        
        // First, login as organizer to get auth token
        console.log('1. Logging in as organizer...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'jane.organizer@email.com',
            password: 'organizer123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Logged in successfully');
        
        // Test the dispute API endpoint
        console.log('2. Testing dispute API endpoint...');
        const disputeResponse = await axios.post(
            'http://localhost:5000/api/disputes/bookings/8/report-non-delivery',
            {
                reason: 'Artist did not show up for the event',
                evidence: []
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Dispute API Response:', disputeResponse.data);
        console.log('🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status Code:', error.response.status);
        }
    }
}

testDisputeAPIEndpoint(); 