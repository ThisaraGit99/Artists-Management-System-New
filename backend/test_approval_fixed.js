const http = require('http');
const mysql = require('mysql2/promise');

console.log('🧪 Testing Approval After Fix\n');

async function testApproval() {
    let connection;
    
    try {
        // Connect to database and reset application
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });
        
        console.log('1. Resetting application 10...');
        await connection.execute('UPDATE event_applications SET application_status = "pending", organizer_response = NULL, responded_at = NULL WHERE id = 10');
        
        // Get organizer email
        const [event7] = await connection.execute(`
            SELECT u.email 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = 7
        `);
        
        const organizerEmail = event7[0].email;
        console.log(`✅ Will use organizer: ${organizerEmail}`);
        
        await connection.end();
        
        // Login
        console.log('\n2. Logging in...');
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            email: organizerEmail,
            password: 'password123'
        }));
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed:', loginResponse.data);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Test approval
        console.log('\n3. Testing approval...');
        const approvalResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/event-applications/7/applications/10/approve',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, JSON.stringify({
            organizer_response: 'Test approval after fix'
        }));
        
        console.log(`Status: ${approvalResponse.status}`);
        console.log('Response:', approvalResponse.data);
        
        if (approvalResponse.status === 200) {
            console.log('\n🎉 SUCCESS! The 500 error is FIXED!');
            console.log('The approval endpoint is now working correctly.');
        } else {
            console.log('\n❌ Still getting error');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

testApproval()
    .then(() => console.log('\n🏁 Test completed'))
    .catch(error => console.error('Script error:', error)); 