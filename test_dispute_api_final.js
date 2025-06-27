const axios = require('axios');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API endpoint with proper authentication...');
        
        // Step 1: Create a test organizer user if needed
        console.log('1. Setting up test user...');
        
        try {
            const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
                name: 'Test Organizer',
                email: 'test.organizer@test.com',
                password: 'test123',
                role: 'organizer'
            });
            console.log('✅ Test organizer registered');
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                console.log('✅ Test organizer already exists');
            } else {
                console.log('⚠️ Registration error:', error.response?.data?.message || error.message);
            }
        }
        
        // Step 2: Login as organizer
        console.log('2. Logging in as organizer...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test.organizer@test.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Logged in successfully');
        
        // Step 3: Test the dispute API endpoint
        console.log('3. Testing dispute API endpoint...');
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
        
        // Clean up the test dispute if created
        if (disputeResponse.data.success && disputeResponse.data.data?.disputeId) {
            console.log('4. Cleaning up test data...');
            // Note: In a real scenario, you'd need admin access to clean up
            console.log('✅ Test dispute created with ID:', disputeResponse.data.data.disputeId);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status Code:', error.response.status);
        }
    }
}

testDisputeAPI(); 