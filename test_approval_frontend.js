const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testApprovalFunctionality() {
    console.log('🧪 Testing Application Approval Functionality\n');

    try {
        // 1. Login as organizer
        console.log('1. Logging in as organizer...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'jane.organizer@email.com',
            password: 'organizer123'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful');

        // 2. Get first event
        console.log('\n2. Getting organizer events...');
        const eventsResponse = await axios.get(`${BASE_URL}/events/organizer`, { headers });
        
        if (!eventsResponse.data.success || eventsResponse.data.data.length === 0) {
            console.log('❌ No events found');
            return;
        }

        const event = eventsResponse.data.data[0];
        console.log(`✅ Using event: "${event.title}" (ID: ${event.id})`);

        // 3. Get applications
        console.log('\n3. Getting applications...');
        const appsResponse = await axios.get(`${BASE_URL}/event-applications/${event.id}/applications`, { headers });
        
        if (!appsResponse.data.success) {
            console.log('❌ Failed to get applications:', appsResponse.data.message);
            return;
        }

        const applications = appsResponse.data.data.applications || [];
        console.log(`✅ Found ${applications.length} applications`);

        if (applications.length === 0) {
            console.log('⚠️ No applications to test with');
            return;
        }

        // 4. Test with first pending application
        const pendingApp = applications.find(app => app.application_status === 'pending');
        
        if (!pendingApp) {
            console.log('⚠️ No pending applications found');
            console.log('Available statuses:', applications.map(app => app.application_status));
            return;
        }

        console.log(`\n4. Testing approval of application ${pendingApp.id} from ${pendingApp.artist_name}...`);

        // 5. Approve the application
        try {
            const approveResponse = await axios.post(
                `${BASE_URL}/event-applications/${event.id}/applications/${pendingApp.id}/approve`,
                {
                    organizer_response: 'Test approval - automated test'
                },
                { headers }
            );

            console.log('📦 Raw Response Status:', approveResponse.status);
            console.log('📦 Raw Response Data:', approveResponse.data);

            if (approveResponse.data.success) {
                console.log('✅ Approval successful!');
                console.log('   Message:', approveResponse.data.message);
                
                // 6. Verify the approval
                console.log('\n5. Verifying approval...');
                const verifyResponse = await axios.get(`${BASE_URL}/event-applications/${event.id}/applications`, { headers });
                
                if (verifyResponse.data.success) {
                    const updatedApps = verifyResponse.data.data.applications || [];
                    const updatedApp = updatedApps.find(app => app.id === pendingApp.id);
                    
                    if (updatedApp && updatedApp.application_status === 'approved') {
                        console.log('✅ Verification successful - Application is approved');
                        console.log('   Response:', updatedApp.organizer_response);
                    } else {
                        console.log('❌ Verification failed - Status not updated');
                    }
                }
            } else {
                console.log('❌ Approval failed:', approveResponse.data.message);
            }

        } catch (error) {
            console.log('❌ Approval request failed:');
            console.log('   Status:', error.response?.status);
            console.log('   Data:', error.response?.data);
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testApprovalFunctionality().then(() => {
        console.log('\n🏁 Test completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });
}

module.exports = { testApprovalFunctionality }; 