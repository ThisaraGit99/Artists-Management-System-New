const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test organizer credentials
const ORGANIZER_CREDENTIALS = {
    email: 'jane.organizer@email.com',
    password: 'organizer123'
};

async function testOrganizerEventActions() {
    try {
        console.log('🧪 Testing Organizer Event Management Action Buttons...\n');

        // 1. Login as organizer
        console.log('1. Logging in as organizer...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ORGANIZER_CREDENTIALS);
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get organizer events
        console.log('\n2. Fetching organizer events...');
        const eventsResponse = await axios.get(`${BASE_URL}/events`, { headers });
        
        if (!eventsResponse.data.success) {
            throw new Error('Failed to fetch events: ' + eventsResponse.data.message);
        }
        
        const events = eventsResponse.data.events || [];
        console.log(`✅ Found ${events.length} events`);
        
        if (events.length === 0) {
            console.log('❌ No events found - cannot test action buttons');
            return;
        }

        const testEvent = events[0];
        console.log(`📅 Testing with event: "${testEvent.title}" (ID: ${testEvent.id})`);

        // 3. Test View Applications action
        console.log('\n3. Testing "View Applications" action...');
        try {
            const applicationsResponse = await axios.get(`${BASE_URL}/event-applications/${testEvent.id}/applications`, { headers });
            
            if (applicationsResponse.data.success) {
                const applications = applicationsResponse.data.data.applications || [];
                console.log(`✅ View Applications working - Found ${applications.length} applications`);
                
                // If there are applications, test approve/reject actions
                if (applications.length > 0) {
                    const testApplication = applications.find(app => app.application_status === 'pending');
                    
                    if (testApplication) {
                        console.log(`\n4. Testing Approve/Reject actions with application ID: ${testApplication.id}`);
                        
                        // Test approve action structure
                        console.log('   - Testing approve endpoint structure...');
                        try {
                            await axios.post(`${BASE_URL}/event-applications/${testEvent.id}/applications/${testApplication.id}/approve`, {
                                organizer_response: 'TEST - This is a test approval'
                            }, { headers });
                            console.log('✅ Approve action working');
                        } catch (approveError) {
                            console.log('❌ Approve action error:', approveError.response?.data?.message || approveError.message);
                        }
                        
                        // Test reject action structure
                        console.log('   - Testing reject endpoint structure...');
                        try {
                            await axios.post(`${BASE_URL}/event-applications/${testEvent.id}/applications/${testApplication.id}/reject`, {
                                organizer_response: 'TEST - This is a test rejection'
                            }, { headers });
                            console.log('✅ Reject action working');
                        } catch (rejectError) {
                            console.log('❌ Reject action error:', rejectError.response?.data?.message || rejectError.message);
                        }
                    } else {
                        console.log('⚠️ No pending applications found to test approve/reject actions');
                    }
                }
            } else {
                console.log('❌ View Applications failed:', applicationsResponse.data.message);
            }
        } catch (applicationsError) {
            console.log('❌ View Applications error:', applicationsError.response?.data?.message || applicationsError.message);
        }

        // 4. Test Event Details action
        console.log('\n5. Testing "View Details" action...');
        try {
            const detailsResponse = await axios.get(`${BASE_URL}/events/${testEvent.id}`, { headers });
            
            if (detailsResponse.data.success) {
                console.log('✅ View Details working');
            } else {
                console.log('❌ View Details failed:', detailsResponse.data.message);
            }
        } catch (detailsError) {
            console.log('❌ View Details error:', detailsError.response?.data?.message || detailsError.message);
        }

        // 5. Test Edit Event action structure
        console.log('\n6. Testing "Edit Event" action structure...');
        try {
            // Just test the endpoint exists, don't actually update
            const updateData = {
                title: testEvent.title, // Keep same title
                description: testEvent.description
            };
            
            await axios.put(`${BASE_URL}/events/${testEvent.id}`, updateData, { headers });
            console.log('✅ Edit Event structure is correct');
        } catch (editError) {
            console.log('❌ Edit Event error:', editError.response?.data?.message || editError.message);
        }

        // 6. Test Delete Event action structure (but don't actually delete)
        console.log('\n7. Testing "Delete Event" action structure...');
        console.log('⚠️ Delete test skipped to preserve data');

        console.log('\n🎉 Event Action Button Tests Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

// Run the test
testOrganizerEventActions(); 