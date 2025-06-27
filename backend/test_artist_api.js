const axios = require('axios');

async function testArtistBookingsAPI() {
    console.log('🧪 Testing Artist Bookings API...\n');
    
    try {
        // Test login as artist
        console.log('1. Logging in as artist...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'john.artist@email.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Test artist bookings endpoint
        console.log('\n2. Fetching artist bookings...');
        const bookingsResponse = await axios.get('http://localhost:5000/api/artists/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (bookingsResponse.data.success) {
            console.log(`✅ Found ${bookingsResponse.data.data.length} bookings`);
            
            bookingsResponse.data.data.forEach((booking, index) => {
                console.log(`\n📋 Booking ${index + 1}:`);
                console.log(`   ID: ${booking.id}`);
                console.log(`   Event: ${booking.event_name}`);
                console.log(`   Status: ${booking.status}`);
                console.log(`   Payment Status: ${booking.payment_status || 'undefined'}`);
                console.log(`   Platform Fee: $${booking.platform_fee || 'undefined'}`);
                console.log(`   Net Amount: $${booking.net_amount || 'undefined'}`);
                console.log(`   Total Amount: $${booking.total_amount}`);
                
                // Check if payment status should show "Payment Made"
                if (booking.payment_status === 'paid') {
                    console.log('   🎯 Should show: "💳 Payment Made" badge');
                } else if (booking.payment_status === 'released') {
                    console.log('   🎯 Should show: "✅ Payment Released" badge');
                } else {
                    console.log(`   🎯 Should show: "${booking.status}" status badge`);
                }
            });
            
            // Test booking details endpoint
            if (bookingsResponse.data.data.length > 0) {
                const firstBookingId = bookingsResponse.data.data[0].id;
                console.log(`\n3. Testing booking details for booking ${firstBookingId}...`);
                
                const detailsResponse = await axios.get(`http://localhost:5000/api/artists/bookings/${firstBookingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (detailsResponse.data.success) {
                    const booking = detailsResponse.data.data.booking;
                    console.log('✅ Booking details retrieved');
                    console.log(`   Payment Status: ${booking.payment_status || 'undefined'}`);
                    console.log(`   Platform Fee: $${booking.platform_fee || 'undefined'}`);
                    console.log(`   Net Amount: $${booking.net_amount || 'undefined'}`);
                } else {
                    console.log('❌ Failed to get booking details:', detailsResponse.data.message);
                }
            }
        } else {
            console.log('❌ Failed to fetch bookings:', bookingsResponse.data.message);
        }
        
    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data?.message);
        } else {
            console.log('❌ Network Error:', error.message);
        }
    }
}

testArtistBookingsAPI(); 