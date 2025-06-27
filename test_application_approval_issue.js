const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testApplicationApproval() {
    console.log('🔧 Testing Application Approval Issue\n');

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

        // 2. Get organizer's events
        console.log('\n2. Getting organizer events...');
        const eventsResponse = await axios.get(`${BASE_URL}/events/organizer`, { headers });
        
        if (!eventsResponse.data.success || eventsResponse.data.data.length === 0) {
            console.log('❌ No events found for organizer');
            return;
        }

        const testEvent = eventsResponse.data.data[0];
        console.log(`✅ Found event: "${testEvent.title}" (ID: ${testEvent.id})`);

        // 3. Check applications for this event
        console.log('\n3. Getting applications for event...');
        const applicationsResponse = await axios.get(`${BASE_URL}/event-applications/${testEvent.id}/applications`, { headers });
        
        if (!applicationsResponse.data.success) {
            console.log('❌ Failed to get applications:', applicationsResponse.data.message);
            return;
        }

        const applications = applicationsResponse.data.data.applications || [];
        console.log(`✅ Found ${applications.length} applications`);

        if (applications.length === 0) {
            console.log('⚠️ No applications to test approval with');
            return;
        }

        // 4. Find a pending application
        const pendingApplication = applications.find(app => app.application_status === 'pending');
        
        if (!pendingApplication) {
            console.log('⚠️ No pending applications found');
            console.log('Available applications:', applications.map(app => ({
                id: app.id,
                artist: app.artist_name,
                status: app.application_status
            })));
            return;
        }

        console.log(`✅ Found pending application from ${pendingApplication.artist_name} (ID: ${pendingApplication.id})`);

        // 5. Try to approve the application
        console.log('\n4. Testing approval...');
        try {
            const approvalResponse = await axios.post(
                `${BASE_URL}/event-applications/${testEvent.id}/applications/${pendingApplication.id}/approve`,
                {
                    organizer_response: 'TEST APPROVAL - This is a test approval message'
                },
                { headers }
            );

            console.log('✅ Approval API Response:', {
                success: approvalResponse.data.success,
                message: approvalResponse.data.message,
                data: approvalResponse.data.data
            });

            // 6. Check if application status changed
            console.log('\n5. Verifying approval...');
            const verifyResponse = await axios.get(`${BASE_URL}/event-applications/${testEvent.id}/applications`, { headers });
            
            if (verifyResponse.data.success) {
                const updatedApplications = verifyResponse.data.data.applications || [];
                const updatedApplication = updatedApplications.find(app => app.id === pendingApplication.id);
                
                if (updatedApplication) {
                    console.log(`✅ Application status: ${updatedApplication.application_status}`);
                    console.log(`✅ Response: ${updatedApplication.organizer_response}`);
                    
                    if (updatedApplication.application_status === 'approved') {
                        console.log('\n🎉 SUCCESS: Application was approved correctly!');
                    } else {
                        console.log('\n⚠️ WARNING: Application status not updated to approved');
                    }
                } else {
                    console.log('❌ Could not find updated application');
                }
            }

        } catch (approvalError) {
            console.log('❌ Approval failed:', {
                status: approvalError.response?.status,
                message: approvalError.response?.data?.message || approvalError.message,
                details: approvalError.response?.data?.details
            });

            // Check if it's a backend error vs frontend error
            if (approvalError.response?.status === 500) {
                console.log('\n🔍 This appears to be a backend error. Check server logs for details.');
            } else if (approvalError.response?.status === 400) {
                console.log('\n🔍 This appears to be a validation error.');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testApplicationApproval().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
}); 