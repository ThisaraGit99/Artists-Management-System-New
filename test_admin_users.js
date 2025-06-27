const fetch = require('node-fetch');

async function testAdminUserManagement() {
    try {
        console.log('🔑 Testing Admin Login...');
        
        // Step 1: Admin Login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@artistmgmt.com',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', loginData.success ? '✅ Success' : '❌ Failed');
        
        if (!loginData.success) {
            console.error('Admin login failed:', loginData.message);
            return;
        }
        
        const token = loginData.data.token;
        console.log('Admin token received ✅');
        
        // Step 2: Test Get All Users
        console.log('\n👥 Testing Get All Users...');
        const usersResponse = await fetch('http://localhost:5000/api/admin/users?page=1&limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const usersData = await usersResponse.json();
        console.log('Get Users Response:', usersData.success ? '✅ Success' : '❌ Failed');
        
        if (usersData.success) {
            console.log(`Found ${usersData.data.length} users`);
            console.log('Pagination:', usersData.pagination);
            
            // Show first user details
            if (usersData.data.length > 0) {
                const firstUser = usersData.data[0];
                console.log('First User:', {
                    id: firstUser.id,
                    name: firstUser.name,
                    email: firstUser.email,
                    role: firstUser.role,
                    status: firstUser.status
                });
                
                // Step 3: Test Get User Details
                console.log('\n🔍 Testing Get User Details...');
                const userDetailResponse = await fetch(`http://localhost:5000/api/admin/users/${firstUser.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const userDetailData = await userDetailResponse.json();
                console.log('Get User Details:', userDetailData.success ? '✅ Success' : '❌ Failed');
                
                if (userDetailData.success) {
                    console.log('User Details:', {
                        user: userDetailData.data.user,
                        stats: userDetailData.data.stats
                    });
                }
            }
        }
        
        // Step 4: Test Role Filter
        console.log('\n🎭 Testing Role Filter (Artists only)...');
        const artistsResponse = await fetch('http://localhost:5000/api/admin/users?role=artist&page=1&limit=3', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const artistsData = await artistsResponse.json();
        console.log('Get Artists:', artistsData.success ? '✅ Success' : '❌ Failed');
        
        if (artistsData.success) {
            console.log(`Found ${artistsData.data.length} artists`);
            artistsData.data.forEach(user => {
                console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
            });
        }
        
        // Step 5: Test Search Functionality
        console.log('\n🔎 Testing Search Functionality...');
        const searchResponse = await fetch('http://localhost:5000/api/admin/users?search=test&page=1&limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const searchData = await searchResponse.json();
        console.log('Search Users:', searchData.success ? '✅ Success' : '❌ Failed');
        
        if (searchData.success) {
            console.log(`Search results: ${searchData.data.length} users found`);
        }
        
        console.log('\n✨ Admin User Management Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdminUserManagement(); 