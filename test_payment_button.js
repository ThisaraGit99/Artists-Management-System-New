const axios = require('axios');

async function testPaymentButton() {
    console.log('=== Testing Payment Button Issue ===\n');
    
    try {
        // You need to replace this with a real organizer token from your browser
        const token = 'REPLACE_WITH_REAL_TOKEN';
        
        console.log('1. Testing organizer bookings list...');
        const bookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (bookingsResponse.data.success && bookingsResponse.data.data.length > 0) {
            const bookings = bookingsResponse.data.data;
            console.log(`✅ Found ${bookings.length} bookings`);
            
            bookings.forEach(booking => {
                console.log(`- Booking ${booking.id}: ${booking.event_name} | Status: ${booking.status} | Payment: ${booking.payment_status || 'undefined'}`);
            });
            
            // Test booking details for the first booking
            const firstBooking = bookings[0];
            console.log(`\n2. Testing booking details for booking ${firstBooking.id}...`);
            
            const detailsResponse = await axios.get(`http://localhost:5000/api/organizers/bookings/${firstBooking.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (detailsResponse.data.success) {
                const booking = detailsResponse.data.data;
                console.log('✅ Booking details retrieved successfully');
                console.log('Booking details:');
                console.log(`- ID: ${booking.id}`);
                console.log(`- Event: ${booking.event_name}`);
                console.log(`- Status: ${booking.status}`);
                console.log(`- Payment Status: ${booking.payment_status || 'undefined'}`);
                console.log(`- Total Amount: ${booking.total_amount}`);
                console.log(`- Platform Fee: ${booking.platform_fee || 'undefined'}`);
                console.log(`- Net Amount: ${booking.net_amount || 'undefined'}`);
                
                console.log('\n3. Payment button logic check:');
                if (booking.status === 'confirmed' && (booking.payment_status === 'pending' || !booking.payment_status)) {
                    console.log('✅ Payment button SHOULD appear (confirmed booking with pending payment)');
                } else {
                    console.log(`⚠️ Payment button will NOT appear:`);
                    console.log(`   - Status: ${booking.status} (needs to be 'confirmed')`);
                    console.log(`   - Payment Status: ${booking.payment_status || 'undefined'} (needs to be 'pending' or undefined)`);
                }
            } else {
                console.log('❌ Failed to get booking details:', detailsResponse.data.message);
            }
        } else {
            console.log('⚠️ No bookings found');
        }
        
    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data?.message);
            if (error.response.status === 401) {
                console.log('🔑 Please update the token in this script with a valid organizer token');
            }
        } else {
            console.log('❌ Network Error:', error.message);
            console.log('🔧 Make sure the backend server is running on port 5000');
        }
    }
}

console.log('📋 Instructions:');
console.log('1. Login to your organizer account in the browser');
console.log('2. Open browser DevTools → Application → Local Storage');
console.log('3. Copy the "token" value');
console.log('4. Replace REPLACE_WITH_REAL_TOKEN in this file');
console.log('5. Run: node test_payment_button.js');
console.log('');

// Uncomment this line after updating the token
// testPaymentButton(); 