const axios = require('axios');

async function testPaymentStatusFlow() {
    console.log('🧪 Testing Payment Status Display Flow...\n');
    
    try {
        // Test credentials (replace with actual test user credentials)
        const loginData = {
            email: 'organizer@test.com',
            password: 'password123'
        };
        
        console.log('1. Logging in as organizer...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Get bookings
        console.log('\n2. Fetching organizer bookings...');
        const bookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (bookingsResponse.data.success) {
            console.log(`✅ Found ${bookingsResponse.data.data.length} bookings`);
            
            bookingsResponse.data.data.forEach(booking => {
                console.log(`📋 Booking ${booking.id}:`);
                console.log(`   Event: ${booking.event_name}`);
                console.log(`   Status: ${booking.status}`);
                console.log(`   Payment Status: ${booking.payment_status || 'undefined'}`);
                console.log(`   Amount: $${booking.total_amount}`);
                console.log(`   Platform Fee: $${booking.platform_fee || 'N/A'}`);
                console.log('');
            });
            
            // Find a confirmed booking to test payment
            const confirmedBooking = bookingsResponse.data.data.find(b => 
                b.status === 'confirmed' && (!b.payment_status || b.payment_status === 'pending')
            );
            
            if (confirmedBooking) {
                console.log(`3. Testing payment for booking ${confirmedBooking.id}...`);
                
                const paymentResponse = await axios.post(
                    `http://localhost:5000/api/organizers/bookings/${confirmedBooking.id}/payment`,
                    {},
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                if (paymentResponse.data.success) {
                    console.log('✅ Payment processed successfully!');
                    console.log('Payment details:', paymentResponse.data.data);
                    
                    // Fetch bookings again to see updated status
                    console.log('\n4. Fetching updated bookings...');
                    const updatedBookingsResponse = await axios.get('http://localhost:5000/api/organizers/bookings', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (updatedBookingsResponse.data.success) {
                        const updatedBooking = updatedBookingsResponse.data.data.find(b => b.id === confirmedBooking.id);
                        if (updatedBooking) {
                            console.log(`📋 Updated Booking ${updatedBooking.id}:`);
                            console.log(`   Status: ${updatedBooking.status}`);
                            console.log(`   Payment Status: ${updatedBooking.payment_status}`);
                            console.log(`   Platform Fee: $${updatedBooking.platform_fee}`);
                            console.log(`   Net Amount: $${updatedBooking.net_amount}`);
                            
                            if (updatedBooking.payment_status === 'paid') {
                                console.log('✅ Payment status correctly updated to "paid"');
                                console.log('🎯 Frontend should now show "💳 Payment Made" badge');
                            } else {
                                console.log('❌ Payment status not updated correctly');
                            }
                        }
                    }
                } else {
                    console.log('❌ Payment failed:', paymentResponse.data.message);
                }
            } else {
                console.log('⚠️ No confirmed bookings available for payment testing');
                
                // Show what bookings we have
                const paidBookings = bookingsResponse.data.data.filter(b => b.payment_status === 'paid');
                if (paidBookings.length > 0) {
                    console.log('\n📋 Bookings with payment made (should show "💳 Payment Made"):');
                    paidBookings.forEach(booking => {
                        console.log(`   - Booking ${booking.id}: ${booking.event_name} (payment_status: ${booking.payment_status})`);
                    });
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

testPaymentStatusFlow(); 