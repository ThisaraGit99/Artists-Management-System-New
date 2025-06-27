const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testApproval() {
    console.log('🧪 Testing Application Approval\n');

    try {
        // 1. Login as organizer
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'jane.organizer@email.com',
            password: 'organizer123'
        });

        const token = loginResponse.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful');

        // 2. Get events
        console.log('\n2. Getting events...');
        const eventsResponse = await axios.get(`${BASE_URL}/events/organizer`, { headers });
        const events = eventsResponse.data.data;
        console.log(`✅ Found ${events.length} events`);

        if (events.length === 0) {
            console.log('❌ No events found');
            return;
        }

        const event = events[0];
        console.log(`   Using event: "${event.title}" (ID: ${event.id})`);

        // 3. Get applications
        console.log('\n3. Getting applications...');
        const appsResponse = await axios.get(`${BASE_URL}/event-applications/${event.id}/applications`, { headers });
        const applications = appsResponse.data.data.applications || [];
        console.log(`✅ Found ${applications.length} applications`);

        if (applications.length === 0) {
            console.log('❌ No applications found');
            return;
        }

        const pendingApp = applications.find(app => app.application_status === 'pending');
        if (!pendingApp) {
            console.log('❌ No pending applications');
            return;
        }

        console.log(`   Testing with application ID: ${pendingApp.id} from ${pendingApp.artist_name}`);

        // 4. Test approval
        console.log('\n4. Testing approval...');
        try {
            const approveResponse = await axios.post(
                `${BASE_URL}/event-applications/${event.id}/applications/${pendingApp.id}/approve`,
                {
                    organizer_response: 'Test approval'
                },
                { headers }
            );

            console.log('📦 Response Status:', approveResponse.status);
            console.log('📦 Response Data:', JSON.stringify(approveResponse.data, null, 2));

            if (approveResponse.data.success) {
                console.log('✅ SUCCESS: Approval worked!');
            } else {
                console.log('❌ FAILED: Server returned success: false');
                console.log('   Message:', approveResponse.data.message);
            }

        } catch (error) {
            console.log('❌ APPROVAL ERROR:');
            console.log('   Status:', error.response?.status);
            console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
        }

    } catch (error) {
        console.log('❌ TEST ERROR:', error.message);
    }
}

testApproval(); 