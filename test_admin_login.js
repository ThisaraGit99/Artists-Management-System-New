const http = require('http');

function makeRequest(options, postData = '') {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${body}`);
                try {
                    const data = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.setTimeout(5000);
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login...');
    
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const loginData = JSON.stringify({
        email: 'admin@artistmgmt.com',
        password: 'admin123'
    });

    try {
        const result = await makeRequest(options, loginData);
        
        if (result.statusCode === 200 && result.data?.success) {
            console.log('✅ Admin login successful!');
            console.log(`Admin: ${result.data.data.user.name}`);
            console.log(`Role: ${result.data.data.user.role}`);
            console.log(`Token: ${result.data.data.token.substring(0, 50)}...`);
            return result.data.data.token;
        } else {
            console.log('❌ Admin login failed');
            return null;
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
}

testAdminLogin(); 