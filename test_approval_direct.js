const axios = require('axios');

async function testApprovalDirect() {
    console.log('🧪 Testing Approval Endpoint Directly\n');

    try {
        // First, let's check if application 10 exists and is pending
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('1. Checking application 10 status...');
        const [appRows] = await connection.execute('SELECT * FROM event_applications WHERE id = 10');
        
        if (appRows.length > 0) {
            const app = appRows[0];
            console.log(`✅ Application 10: Status = ${app.application_status}, Event = ${app.event_id}`);
            
            // Reset to pending if needed
            if (app.application_status !== 'pending') {
                await connection.execute('UPDATE event_applications SET application_status = "pending", organizer_response = NULL, responded_at = NULL WHERE id = 10');
                console.log('🔄 Reset application to pending');
            }
        } else {
            console.log('❌ Application 10 not found');
            return;
        }

        await connection.end();

        console.log('\n2. Testing approval endpoint with correct auth...');

        // We need to login as the organizer first
        console.log('   Logging in as organizer...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'jane.organizer@email.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');

        // Now try the approval
        console.log('\n   Calling approval endpoint...');
        const approvalResponse = await axios.post(
            'http://localhost:5000/api/event-applications/7/applications/10/approve',
            {
                organizer_response: 'Test approval via direct script'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Approval successful!');
        console.log('Response:', approvalResponse.data);

    } catch (error) {
        console.error('❌ Test error:');
        
        if (error.response) {
            // Server responded with error status
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // Request was made but no response
            console.error('No response received:', error.request);
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        
        console.error('Full error object:', error);
    }
}

testApprovalDirect().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}); 