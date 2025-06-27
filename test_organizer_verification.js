const axios = require('axios');

async function testOrganizerIssue() {
    try {
        // Use the current user's token
        // You need to get this from localStorage in the browser or provide it here
        const token = 'your_token_here'; // Replace with actual token
        
        console.log('=== Testing Organizer Verification Issue ===\n');
        
        // 1. Test organizer dashboard stats to check verification
        console.log('1. Testing organizer verification status:');
        const dashboardResponse = await axios.get('http://localhost:5000/api/organizers/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Dashboard stats:', JSON.stringify(dashboardResponse.data, null, 2));
        
        // 2. Test getting bookings list
        console.log('\n2. Testing organizer bookings list:');
        const bookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Bookings list:', JSON.stringify(bookingsResponse.data, null, 2));
        
        // 3. If there are bookings, try to get details of the first one
        if (bookingsResponse.data.success && bookingsResponse.data.data.length > 0) {
            const firstBookingId = bookingsResponse.data.data[0].id;
            console.log(`\n3. Testing booking details for ID ${firstBookingId}:`);
            
            const detailsResponse = await axios.get(`http://localhost:5000/api/organizers/bookings/${firstBookingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Booking details:', JSON.stringify(detailsResponse.data, null, 2));
        }
        
        // 4. Try the problematic booking ID 7
        console.log('\n4. Testing problematic booking ID 7:');
        try {
            const booking7Response = await axios.get('http://localhost:5000/api/organizers/bookings/7', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Booking 7 details:', JSON.stringify(booking7Response.data, null, 2));
        } catch (error) {
            console.log('ERROR with booking 7:', error.response?.status, error.response?.data);
        }
        
    } catch (error) {
        console.error('Test failed:', error.response?.status, error.response?.data || error.message);
    }
}

// You need to replace 'your_token_here' with an actual organizer token
console.log('Please update the token in this file and run again');
// testOrganizerIssue(); 