// Quick test to fix approval issue
const axios = require('axios');

async function quickTest() {
    try {
        // Test if server is running
        const healthCheck = await axios.get('http://localhost:5000/health');
        console.log('✅ Server is running:', healthCheck.data.message);
        
        // Test login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'jane.organizer@email.com',
            password: 'organizer123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            
            const token = loginResponse.data.data.token;
            const headers = { Authorization: `Bearer ${token}` };
            
            // Get events
            try {
                const eventsResponse = await axios.get('http://localhost:5000/api/events/organizer', { headers });
                console.log('✅ Events API working, found', eventsResponse.data.data.length, 'events');
                
                if (eventsResponse.data.data.length > 0) {
                    const eventId = eventsResponse.data.data[0].id;
                    
                    // Get applications
                    try {
                        const appsResponse = await axios.get(`http://localhost:5000/api/event-applications/${eventId}/applications`, { headers });
                        console.log('✅ Applications API working, found', appsResponse.data.data.applications?.length || 0, 'applications');
                        
                        // Test approval endpoint structure
                        console.log('\n🔧 The approval endpoint should be:');
                        console.log(`POST /api/event-applications/${eventId}/applications/{applicationId}/approve`);
                        console.log('Headers: Authorization: Bearer <token>');
                        console.log('Body: { organizer_response: "message" }');
                        
                    } catch (appsError) {
                        console.log('❌ Applications API error:', appsError.response?.data?.message || appsError.message);
                    }
                }
                
            } catch (eventsError) {
                console.log('❌ Events API error:', eventsError.response?.data?.message || eventsError.message);
            }
            
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

quickTest(); 