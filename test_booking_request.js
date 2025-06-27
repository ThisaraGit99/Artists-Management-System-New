const axios = require('axios');

async function testBookingRequest() {
    try {
        console.log('Testing the exact request that fails...');
        
        // First, let's test without authentication to see what happens
        console.log('\n1. Testing without authentication:');
        try {
            const response = await axios.get('http://localhost:5000/api/organizers/bookings?status=&page=1&limit=10');
            console.log('✓ Success:', response.status, response.data);
        } catch (error) {
            console.log('✗ Error Status:', error.response?.status);
            console.log('✗ Error Message:', error.response?.data?.message);
            console.log('✗ Error Details:', error.response?.data);
        }
        
        // Test with a dummy token to see where it fails
        console.log('\n2. Testing with dummy token:');
        try {
            const response = await axios.get('http://localhost:5000/api/organizers/bookings?status=&page=1&limit=10', {
                headers: {
                    'Authorization': 'Bearer dummy_token'
                }
            });
            console.log('✓ Success:', response.status, response.data);
        } catch (error) {
            console.log('✗ Error Status:', error.response?.status);
            console.log('✗ Error Message:', error.response?.data?.message);
            console.log('✗ Error Details:', error.response?.data);
        }
        
        // Let's check what users exist and their roles
        console.log('\n3. Checking database users:');
        const { executeQuery } = require('./backend/config/database');
        const usersResult = await executeQuery("SELECT id, name, email, role FROM users WHERE role = 'organizer'");
        console.log('Organizer users:', usersResult);
        
        // Check organizers table
        const organizersResult = await executeQuery("SELECT id, user_id, organization_name, is_verified FROM organizers");
        console.log('Organizers table:', organizersResult);
        
    } catch (error) {
        console.error('Test script error:', error.message);
    }
}

testBookingRequest(); 