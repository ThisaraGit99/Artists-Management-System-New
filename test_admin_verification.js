const http = require('http');

// Test tokens - you'll need to update these with actual tokens
const artistToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImVtYWlsIjoidGVzdGFydGlzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhcnRpc3QiLCJpYXQiOjE3NTAzMjkwODMsImV4cCI6MTc1MDkzMzg4MywiaXNzIjoiYXJ0aXN0LW1hbmFnZW1lbnQtc3lzdGVtIn0.dVz7MS4UWyol32U0VvsvnV-zV6gEQquyllRd1wGnnLs';

// We need to get an admin token first by logging in as admin
let adminToken = '';

// Utility function to make HTTP requests
function makeRequest(options, postData = '') {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000);
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Step 1: Login as admin to get admin token
async function loginAsAdmin() {
    console.log('\n🔐 Step 1: Login as Admin');
    
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
        console.log(`Status: ${result.statusCode}`);
        
        if (result.statusCode === 200 && result.data.success) {
            adminToken = result.data.data.token;
            console.log('✅ Admin login successful');
            console.log(`Admin: ${result.data.data.user.name} (${result.data.data.user.role})`);
            return true;
        } else {
            console.log('❌ Admin login failed:', result.data?.message || result.raw);
            return false;
        }
    } catch (error) {
        console.error('❌ Admin login error:', error.message);
        return false;
    }
}

// Step 2: Artist requests verification (already done from previous test)
async function artistRequestVerification() {
    console.log('\n📝 Step 2: Artist Request Verification');
    
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/request-verification',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${artistToken}`
        }
    };

    try {
        const result = await makeRequest(options);
        console.log(`Status: ${result.statusCode}`);
        console.log(`Response: ${result.data?.message || result.raw}`);
        return result.statusCode === 200;
    } catch (error) {
        console.error('❌ Verification request error:', error.message);
        return false;
    }
}

// Step 3: Admin views pending verification requests
async function getVerificationRequests() {
    console.log('\n📋 Step 3: Admin Get Verification Requests');
    
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/admin/verification-requests',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    };

    try {
        const result = await makeRequest(options);
        console.log(`Status: ${result.statusCode}`);
        
        if (result.statusCode === 200 && result.data.success) {
            console.log('✅ Verification requests retrieved');
            console.log(`Found ${result.data.data.length} pending requests`);
            
            result.data.data.forEach((request, index) => {
                console.log(`\n📄 Request ${index + 1}:`);
                console.log(`  User: ${request.user.name} (${request.user.email})`);
                console.log(`  Role: ${request.user.role}`);
                console.log(`  Request Date: ${request.requestDate}`);
                console.log(`  Status: ${request.status}`);
            });
            
            return result.data.data;
        } else {
            console.log('❌ Failed to get verification requests:', result.data?.message || result.raw);
            return [];
        }
    } catch (error) {
        console.error('❌ Get verification requests error:', error.message);
        return [];
    }
}

// Step 4: Admin approves user verification
async function approveUserVerification(userId) {
    console.log(`\n✅ Step 4: Admin Approve User ${userId}`);
    
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/admin/users/${userId}/verify`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        }
    };

    const approvalData = JSON.stringify({
        verified: true
    });

    try {
        const result = await makeRequest(options, approvalData);
        console.log(`Status: ${result.statusCode}`);
        console.log(`Response: ${result.data?.message || result.raw}`);
        return result.statusCode === 200;
    } catch (error) {
        console.error('❌ User approval error:', error.message);
        return false;
    }
}

// Step 5: Verify that user is now verified
async function checkUserVerificationStatus() {
    console.log('\n🔍 Step 5: Check User Verification Status');
    
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/verification-status',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${artistToken}`
        }
    };

    try {
        const result = await makeRequest(options);
        console.log(`Status: ${result.statusCode}`);
        
        if (result.statusCode === 200 && result.data.success) {
            console.log('✅ Verification status retrieved');
            console.log(`Is Verified: ${result.data.data.isVerified}`);
            console.log(`Role: ${result.data.data.role}`);
            console.log(`Can Request Verification: ${result.data.data.canRequestVerification}`);
            return result.data.data.isVerified;
        } else {
            console.log('❌ Failed to get verification status:', result.data?.message || result.raw);
            return false;
        }
    } catch (error) {
        console.error('❌ Verification status error:', error.message);
        return false;
    }
}

// Main test workflow
async function runAdminVerificationTest() {
    console.log('🚀 ADMIN VERIFICATION WORKFLOW TEST');
    console.log('=====================================');

    try {
        // Step 1: Login as admin
        const adminLoggedIn = await loginAsAdmin();
        if (!adminLoggedIn) {
            console.log('\n❌ Cannot proceed without admin access');
            return;
        }

        // Step 2: Artist requests verification (optional - may already be done)
        await artistRequestVerification();

        // Step 3: Admin gets verification requests
        const requests = await getVerificationRequests();
        if (requests.length === 0) {
            console.log('\n⚠️  No pending verification requests found');
            return;
        }

        // Step 4: Admin approves the first request
        const firstRequest = requests[0];
        const userId = firstRequest.user.id;
        const approved = await approveUserVerification(userId);
        
        if (approved) {
            // Step 5: Verify the approval worked
            const isVerified = await checkUserVerificationStatus();
            
            if (isVerified) {
                console.log('\n🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
                console.log('✅ User verification approved by admin');
                console.log('✅ User is now verified');
            } else {
                console.log('\n⚠️  Approval succeeded but user is still not verified');
            }
        } else {
            console.log('\n❌ User approval failed');
        }

    } catch (error) {
        console.error('\n❌ Test workflow failed:', error);
    }
}

// Run the test
runAdminVerificationTest(); 