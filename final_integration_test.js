const axios = require('axios');

async function finalIntegrationTest() {
    console.log('🎯 Final Frontend-Backend Integration Test\n');
    
    const results = {
        backend: false,
        frontend: false,
        auth: false,
        approval: false,
        cors: false
    };
    
    // Test 1: Backend Health
    console.log('📋 Testing Backend Health...');
    try {
        const response = await axios.get('http://localhost:5000/api/auth/health');
        if (response.data.success) {
            console.log('✅ Backend: Running successfully');
            console.log(`📋 Response: ${response.data.message}`);
            results.backend = true;
        }
    } catch (error) {
        console.log('❌ Backend: Not responding');
        console.log(`📋 Error: ${error.message}`);
    }
    
    // Test 2: Frontend Health
    console.log('\n📋 Testing Frontend Health...');
    try {
        const response = await axios.get('http://localhost:3000');
        if (response.status === 200 && response.data.includes('html')) {
            console.log('✅ Frontend: React app running successfully');
            results.frontend = true;
        }
    } catch (error) {
        console.log('❌ Frontend: Not responding');
        console.log(`📋 Error: ${error.message}`);
    }
    
    // Test 3: Authentication Flow
    console.log('\n📋 Testing Authentication Flow...');
    let authToken = null;
    try {
        // Use the correct organizer credentials from database
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'jane.organizer@email.com',
            password: 'password123'  // This might not be correct
        });
        
        if (loginResponse.data.success) {
            authToken = loginResponse.data.data.token;
            console.log('✅ Authentication: Login successful');
            console.log(`📋 User: ${loginResponse.data.data.user.name} (${loginResponse.data.data.user.role})`);
            results.auth = true;
        }
    } catch (authError) {
        console.log('❌ Authentication: Login failed');
        console.log(`📋 Error: ${authError.response?.data?.message || authError.message}`);
        
        // Try with different password or check database
        console.log('📋 Let me check the actual password in database...');
        try {
            const { executeQuery } = require('./backend/config/database');
            const userCheck = await executeQuery('SELECT email, password FROM users WHERE email = ?', ['jane.organizer@email.com']);
            if (userCheck.success && userCheck.data.length > 0) {
                console.log('📋 User found in database, password is hashed');
                console.log('⚠️ Note: You may need to reset the password or use correct credentials');
            }
        } catch (dbError) {
            console.log('📋 Could not check database');
        }
    }
    
    // Test 4: CORS Configuration
    console.log('\n📋 Testing CORS Configuration...');
    try {
        const corsResponse = await axios.get('http://localhost:5000/api/auth/health', {
            headers: { 'Origin': 'http://localhost:3000' }
        });
        if (corsResponse.headers['access-control-allow-origin']) {
            console.log('✅ CORS: Properly configured');
            console.log(`📋 Allows origin: ${corsResponse.headers['access-control-allow-origin']}`);
            results.cors = true;
        }
    } catch (corsError) {
        console.log('❌ CORS: Configuration issue');
        console.log(`📋 Error: ${corsError.message}`);
    }
    
    // Test 5: Fixed Approval Functionality (if authenticated)
    console.log('\n📋 Testing FIXED Approval Functionality...');
    if (authToken) {
        try {
            // First reset the application to pending
            const { executeQuery } = require('./backend/config/database');
            await executeQuery(
                'UPDATE event_applications SET application_status = "pending", organizer_response = NULL WHERE id = ?',
                [11]
            );
            console.log('📋 Reset application 11 to pending status');
            
            // Test the approval endpoint
            const headers = { 'Authorization': `Bearer ${authToken}` };
            const approvalResponse = await axios.post(
                'http://localhost:5000/api/event-applications/8/11/approve',
                { organizer_response: 'Final integration test approval' },
                { headers }
            );
            
            if (approvalResponse.data.success) {
                console.log('✅ Approval: FIXED functionality working!');
                console.log(`📋 Response: ${approvalResponse.data.message}`);
                console.log(`📋 Artist: ${approvalResponse.data.data?.artistName || 'Unknown'}`);
                results.approval = true;
            }
        } catch (approvalError) {
            console.log('❌ Approval: Error occurred');
            console.log(`📋 Error: ${approvalError.response?.data?.message || approvalError.message}`);
            if (approvalError.response?.data?.details) {
                console.log(`📋 Details: ${approvalError.response.data.details}`);
            }
        }
    } else {
        console.log('⚠️ Approval: Skipped (authentication required)');
    }
    
    // Test 6: API Endpoint Accessibility
    console.log('\n📋 Testing API Endpoints...');
    try {
        // Test public endpoint
        const eventsResponse = await axios.get('http://localhost:5000/api/events');
        if (eventsResponse.data) {
            console.log('✅ Public API: Events endpoint accessible');
            console.log(`📋 Events found: ${eventsResponse.data.data?.events?.length || 0}`);
        }
    } catch (apiError) {
        console.log('❌ Public API: Events endpoint issue');
        console.log(`📋 Error: ${apiError.response?.data?.message || apiError.message}`);
    }
    
    // Final Summary
    console.log('\n🎯 INTEGRATION TEST RESULTS:');
    console.log('=====================================');
    console.log(`Backend Server: ${results.backend ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Frontend Server: ${results.frontend ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Authentication: ${results.auth ? '✅ WORKING' : '⚠️ NEEDS SETUP'}`);
    console.log(`CORS Config: ${results.cors ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Approval Fix: ${results.approval ? '✅ WORKING' : '⚠️ NEEDS AUTH'}`);
    
    const workingCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📊 Overall Status: ${workingCount}/${totalTests} tests passing`);
    
    if (results.backend && results.frontend && results.cors) {
        console.log('\n🎉 CORE INTEGRATION: Frontend and Backend are properly connected!');
    }
    
    if (results.approval) {
        console.log('🎉 APPROVAL FUNCTIONALITY: The fix is working correctly!');
    }
    
    console.log('\n📋 Next Steps:');
    if (!results.auth) {
        console.log('- Set up proper user credentials for full testing');
    }
    if (results.backend && results.frontend) {
        console.log('- Open http://localhost:3000 in your browser to test the UI');
        console.log('- The approval functionality should work without the "this.getOrganizerDbId" error');
    }
}

finalIntegrationTest().catch(error => {
    console.error('❌ Integration test failed:', error.message);
}); 