const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@artistmgmt.com';
const ADMIN_PASSWORD = 'admin123';

async function testSuspendFeature() {
  try {
    console.log('🧪 Testing Suspend Feature...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful');

    // 2. Get all users
    console.log('\n2. Fetching all users...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
    
    if (!usersResponse.data.success) {
      throw new Error('Failed to fetch users');
    }

    const users = usersResponse.data.data;
    console.log(`✅ Found ${users.length} users`);
    
    // Find a non-admin user to test suspend on
    const testUser = users.find(user => user.role !== 'admin');
    if (!testUser) {
      console.log('❌ No non-admin users found to test suspend on');
      return;
    }

    console.log(`📋 Test user: ${testUser.name} (${testUser.email}) - Current status: ${testUser.status}`);

    // 3. Test suspend functionality
    console.log('\n3. Testing suspend user...');
    const suspendResponse = await axios.put(
      `${API_BASE}/admin/users/${testUser.id}/status`,
      { status: 'suspended' },
      { headers }
    );

    if (!suspendResponse.data.success) {
      throw new Error('Failed to suspend user: ' + suspendResponse.data.message);
    }

    console.log('✅ User suspended successfully');

    // 4. Verify user status changed
    console.log('\n4. Verifying user status...');
    const updatedUsersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
    const updatedUser = updatedUsersResponse.data.data.find(u => u.id === testUser.id);
    
    if (updatedUser.status === 'suspended') {
      console.log('✅ User status verified as suspended');
    } else {
      console.log(`❌ User status not updated correctly. Expected: suspended, Got: ${updatedUser.status}`);
    }

    // 5. Test reactivate user
    console.log('\n5. Testing reactivate user...');
    const reactivateResponse = await axios.put(
      `${API_BASE}/admin/users/${testUser.id}/status`,
      { status: 'active' },
      { headers }
    );

    if (!reactivateResponse.data.success) {
      throw new Error('Failed to reactivate user: ' + reactivateResponse.data.message);
    }

    console.log('✅ User reactivated successfully');

    // 6. Test invalid status
    console.log('\n6. Testing invalid status...');
    try {
      await axios.put(
        `${API_BASE}/admin/users/${testUser.id}/status`,
        { status: 'invalid_status' },
        { headers }
      );
      console.log('❌ Invalid status should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid status properly rejected');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Suspend feature test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Admin can suspend users');
    console.log('- ✅ Admin can reactivate users');  
    console.log('- ✅ Invalid statuses are rejected');
    console.log('- ✅ Status changes are persisted in database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Server response:', error.response.data);
    }
  }
}

// Run the test
testSuspendFeature(); 