const axios = require('axios');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API...');
        
        // Test with a known working user (from the test data)
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@artistmgmt.com',
            password: 'admin123'
        });
        
        console.log('Login response:', loginResponse.data);
        
        if (loginResponse.data.success) {
            const token = loginResponse.data.token;
            console.log('✅ Logged in successfully');
            
            // Test dispute API
            console.log('2. Testing dispute endpoint...');
            const disputeResponse = await axios.post(
                'http://localhost:5000/api/disputes/bookings/8/report-non-delivery',
                {
                    reason: 'Test dispute from API',
                    evidence: []
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Dispute Response:', disputeResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
    }
}

testDisputeAPI(); 