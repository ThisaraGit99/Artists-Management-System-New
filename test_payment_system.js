const axios = require('axios');

async function testPaymentSystem() {
    console.log('=== Testing Payment System ===\n');
    
    try {
        // Test organizer token (you'll need to get a real token)
        const organizerToken = 'REPLACE_WITH_ORGANIZER_TOKEN';
        
        console.log('1. Testing organizer dashboard stats...');
        const dashboardResponse = await axios.get('http://localhost:5000/api/organizers/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${organizerToken}` }
        });
        
        if (dashboardResponse.data.success) {
            console.log('✅ Dashboard accessible');
            console.log('Organizer verified:', dashboardResponse.data.data?.organizer?.is_verified);
        }
        
        console.log('\n2. Testing get organizer bookings...');
        const bookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
            headers: { 'Authorization': `Bearer ${organizerToken}` }
        });
        
        if (bookingsResponse.data.success && bookingsResponse.data.data.length > 0) {
            console.log(`✅ Found ${bookingsResponse.data.data.length} bookings`);
            
            const confirmedBooking = bookingsResponse.data.data.find(b => b.status === 'confirmed');
            if (confirmedBooking) {
                console.log('\n3. Testing payment for confirmed booking...');
                console.log(`Booking ID: ${confirmedBooking.id}`);
                console.log(`Amount: $${confirmedBooking.total_amount}`);
                console.log(`Current payment status: ${confirmedBooking.payment_status || 'pending'}`);
                
                // Test make payment
                if (confirmedBooking.payment_status === 'pending') {
                    console.log('\n4. Testing make payment...');
                    const paymentResponse = await axios.post(
                        `http://localhost:5000/api/organizers/bookings/${confirmedBooking.id}/payment`,
                        {},
                        { headers: { 'Authorization': `Bearer ${organizerToken}` } }
                    );
                    
                    if (paymentResponse.data.success) {
                        console.log('✅ Payment processed successfully!');
                        console.log('Payment details:', paymentResponse.data.data);
                    } else {
                        console.log('❌ Payment failed:', paymentResponse.data.message);
                    }
                } else {
                    console.log('⚠️ Booking already has payment status:', confirmedBooking.payment_status);
                }
                
                // Test booking details after payment
                console.log('\n5. Testing booking details with payment info...');
                const detailsResponse = await axios.get(
                    `http://localhost:5000/api/organizers/bookings/${confirmedBooking.id}`,
                    { headers: { 'Authorization': `Bearer ${organizerToken}` } }
                );
                
                if (detailsResponse.data.success) {
                    console.log('✅ Booking details retrieved');
                    const booking = detailsResponse.data.data;
                    console.log('Payment status:', booking.payment_status);
                    console.log('Platform fee:', booking.platform_fee);
                    console.log('Net amount:', booking.net_amount);
                }
            } else {
                console.log('⚠️ No confirmed bookings found to test payment');
            }
        } else {
            console.log('⚠️ No bookings found');
        }
        
    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data?.message);
        } else {
            console.log('❌ Network Error:', error.message);
        }
    }
}

console.log('To test the payment system:');
console.log('1. Get an organizer token from browser localStorage');
console.log('2. Replace REPLACE_WITH_ORGANIZER_TOKEN with the actual token');
console.log('3. Make sure you have a confirmed booking in the system');
console.log('4. Run: node test_payment_system.js');
console.log('');

// Uncomment this line after updating the token
// testPaymentSystem(); 