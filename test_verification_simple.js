const https = require('https');
const http = require('http');

// Your token from the successful login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImVtYWlsIjoidGVzdGFydGlzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhcnRpc3QiLCJpYXQiOjE3NTAzMjkwODMsImV4cCI6MTc1MDkzMzg4MywiaXNzIjoiYXJ0aXN0LW1hbmFnZW1lbnQtc3lzdGVtIn0.dVz7MS4UWyol32U0VvsvnV-zV6gEQquyllRd1wGnnLs';

// Test the verification request endpoint
async function testVerificationRequest() {
    return new Promise((resolve, reject) => {
        const postData = '';
        
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/auth/request-verification',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('🧪 Testing verification request endpoint...');
        console.log('Options:', options);

        const req = http.request(options, (res) => {
            console.log(`✅ Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                console.log(`📄 Raw Response:`, body);
                try {
                    const data = JSON.parse(body);
                    console.log(`📊 Parsed Response:`, JSON.stringify(data, null, 2));
                    resolve(data);
                } catch (error) {
                    console.log(`❌ JSON Parse Error:`, error.message);
                    resolve({ raw: body });
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error);
            reject(error);
        });

        req.on('timeout', () => {
            console.error('❌ Request Timeout');
            reject(new Error('Request timeout'));
        });

        req.setTimeout(5000);
        req.write(postData);
        req.end();
    });
}

// Test the verification status endpoint
async function testVerificationStatus() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/auth/verification-status',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        console.log('\n🧪 Testing verification status endpoint...');

        const req = http.request(options, (res) => {
            console.log(`✅ Status Code: ${res.statusCode}`);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                console.log(`📄 Raw Response:`, body);
                try {
                    const data = JSON.parse(body);
                    console.log(`📊 Parsed Response:`, JSON.stringify(data, null, 2));
                    resolve(data);
                } catch (error) {
                    console.log(`❌ JSON Parse Error:`, error.message);
                    resolve({ raw: body });
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error);
            reject(error);
        });

        req.setTimeout(5000);
        req.end();
    });
}

// Run tests
async function runTests() {
    try {
        console.log('🚀 Starting Verification System Tests\n');
        
        // Test 1: Request verification
        const verificationResult = await testVerificationRequest();
        
        // Test 2: Get verification status
        const statusResult = await testVerificationStatus();
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

runTests(); 