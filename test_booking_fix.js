const axios = require('axios');

async function testBookingDetailsFix() {
    try {
        console.log('=== Testing Booking Details Fix ===\n');
        
        // You'll need to get a valid organizer token
        // Replace this with an actual token from your browser's localStorage
        const token = 'REPLACE_WITH_ACTUAL_TOKEN';
        
        console.log('1. Testing organizer dashboard stats (to verify organizer is logged in):');
        try {
            const dashboardResponse = await axios.get('http://localhost:5000/api/organizers/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Dashboard accessible, organizer verified:', dashboardResponse.data.data?.organizer?.is_verified);
        } catch (error) {
            console.log('❌ Dashboard error:', error.response?.status, error.response?.data?.message);
            console.log('Please update the token in this test file');
            return;
        }
        
        console.log('\n2. Testing get organizer bookings:');
        const bookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (bookingsResponse.data.success && bookingsResponse.data.data.length > 0) {
            console.log(`✅ Found ${bookingsResponse.data.data.length} bookings`);
            
            const firstBooking = bookingsResponse.data.data[0];
            console.log(`\n3. Testing booking details for ID ${firstBooking.id}:`);
            
            const detailsResponse = await axios.get(`http://localhost:5000/api/organizers/bookings/${firstBooking.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (detailsResponse.data.success) {
                console.log('✅ Booking details retrieved successfully!');
                console.log('Event:', detailsResponse.data.data.event_name);
                console.log('Artist:', detailsResponse.data.data.artist_name);
                console.log('Date:', detailsResponse.data.data.event_date);
                console.log('Venue:', detailsResponse.data.data.venue_address);
            } else {
                console.log('❌ Booking details failed:', detailsResponse.data.message);
            }
        } else {
            console.log('⚠️ No bookings found. Create a booking first to test details.');
        }
        
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('❌ 404 Error - The booking details endpoint is still broken');
            console.log('Error:', error.response.data?.message);
        } else {
            console.log('❌ Test error:', error.response?.status, error.response?.data?.message || error.message);
        }
    }
}

console.log('To test this:');
console.log('1. Get your token from browser localStorage');
console.log('2. Replace REPLACE_WITH_ACTUAL_TOKEN with your actual token');
console.log('3. Run: node test_booking_fix.js');
console.log('');

// Uncomment this line after updating the token
// testBookingDetailsFix(); 