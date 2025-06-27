const mysql = require('mysql2/promise');
const http = require('http');

console.log('🧪 Debugging 500 Error for Application Approval\n');

async function debugApproval() {
    let connection;
    
    try {
        console.log('1. Connecting to database...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });
        
        console.log('✅ Connected to database');

        console.log('\n2. Checking organizer for Event 7:');
        console.log('   Executing query...');
        const [event7] = await connection.execute(`
            SELECT e.id, e.title, e.organizer_id, u.name, u.email 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = 7
        `);
        console.log('   Query result:', event7);
        
        if (event7.length > 0) {
            const event = event7[0];
            console.log(`✅ Event 7: "${event.title}"`);
            console.log(`   Organizer: ${event.name} (${event.email})`);
            console.log(`   User ID: ${event.organizer_id}`);
            
            const organizerEmail = event.email;
            
            // Reset application 10 to pending
            await connection.execute('UPDATE event_applications SET application_status = "pending", organizer_response = NULL, responded_at = NULL WHERE id = 10');
            console.log('✅ Reset application 10 to pending');

            await connection.end();

            console.log('\n3. Testing login...');
            const loginResult = await testLogin(organizerEmail, 'password123');
            
            if (loginResult.success) {
                console.log('✅ Login successful');
                
                console.log('\n4. Testing approval endpoint...');
                const approvalResult = await testApproval(loginResult.token);
                
                if (approvalResult.success) {
                    console.log('✅ Approval successful!');
                    console.log('Response:', approvalResult.data);
                } else {
                    console.log('❌ Approval failed');
                    console.log('Status:', approvalResult.status);
                    console.log('Error:', approvalResult.error);
                }
            } else {
                console.log('❌ Login failed');
                console.log('Error:', loginResult.error);
            }
            
        } else {
            console.log('❌ Event 7 not found');
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testLogin(email, password) {
    try {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const postData = JSON.stringify({ email, password });
        const response = await makeRequest(options, postData);
        
        if (response.status === 200 && response.data.token) {
            return { success: true, token: response.data.token };
        } else {
            return { success: false, error: response.data };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testApproval(token) {
    try {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/event-applications/7/applications/10/approve',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const postData = JSON.stringify({
            organizer_response: 'Test approval from debug script'
        });
        
        const response = await makeRequest(options, postData);
        
        if (response.status === 200) {
            return { success: true, data: response.data };
        } else {
            return { success: false, status: response.status, error: response.data };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

debugApproval()
    .then(() => {
        console.log('\n🏁 Debug completed');
    })
    .catch(error => {
        console.error('Script error:', error);
    }); 