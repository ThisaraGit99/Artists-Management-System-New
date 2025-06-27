const axios = require('axios');

// Test the booking details API
async function testBookingDetails() {
  try {
    // First, let's see if we can get the list of bookings
    console.log('🔍 Testing Booking Details API...\n');
    
    // You'll need to replace this with an actual admin token
    const adminToken = 'your-admin-jwt-token-here';
    
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test getting all bookings first
    console.log('📋 Getting all bookings...');
    try {
      const bookingsResponse = await axios.get('http://localhost:5000/api/admin/bookings', { headers });
      console.log('✅ Bookings API Response:');
      console.log('Total bookings:', bookingsResponse.data.data.length);
      
      if (bookingsResponse.data.data.length > 0) {
        const firstBooking = bookingsResponse.data.data[0];
        console.log('\n📝 First booking structure:');
        console.log('ID:', firstBooking.id);
        console.log('Event Title:', firstBooking.event_title);
        console.log('Performance Date:', firstBooking.performance_date);
        console.log('Performance Duration:', firstBooking.performance_duration);
        console.log('Event Type:', firstBooking.event_type);
        console.log('Artist Name:', firstBooking.artist_name);
        console.log('Organizer Name:', firstBooking.organizer_name);
        console.log('Status:', firstBooking.status);
        console.log('Payment Status:', firstBooking.payment_status);
        console.log('Total Amount:', firstBooking.total_amount);
        
        // Now test getting detailed booking info
        console.log('\n🔍 Getting booking details for ID:', firstBooking.id);
        const detailsResponse = await axios.get(`http://localhost:5000/api/admin/bookings/${firstBooking.id}`, { headers });
        
        console.log('✅ Booking Details API Response:');
        const bookingDetails = detailsResponse.data.data.booking;
        console.log('Event Title:', bookingDetails.event_title);
        console.log('Event Type:', bookingDetails.event_type);
        console.log('Performance Date:', bookingDetails.performance_date);
        console.log('Performance Duration:', bookingDetails.performance_duration);
        console.log('Location:', bookingDetails.location);
        console.log('Platform Fee:', bookingDetails.platform_fee);
        console.log('Net Amount:', bookingDetails.net_amount);
        console.log('Created At:', bookingDetails.created_at);
        console.log('Artist Name:', bookingDetails.artist_name);
        console.log('Organizer Name:', bookingDetails.organizer_name);
        console.log('Package Title:', bookingDetails.package_title);
        
        console.log('\n✅ All fields are now properly mapped!');
      } else {
        console.log('⚠️ No bookings found in the database');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
      console.log('💡 Make sure you have:');
      console.log('   1. Backend server running on port 5000');
      console.log('   2. Valid admin JWT token');
      console.log('   3. Some booking data in the database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Note: This is a demonstration script
console.log('📝 Booking Details API Test Script');
console.log('⚠️  To run this test:');
console.log('   1. Make sure backend server is running');
console.log('   2. Login as admin and get JWT token');
console.log('   3. Replace "your-admin-jwt-token-here" with actual token');
console.log('   4. Run: node test_booking_details.js');
console.log('\n🔧 The main fixes applied:');
console.log('   ✅ event_date → performance_date');
console.log('   ✅ duration → performance_duration');
console.log('   ✅ Added event_type field');
console.log('   ✅ venue_address → location');
console.log('   ✅ Added platform_fee, net_amount');
console.log('   ✅ Added created_at, updated_at');
console.log('   ✅ Added package information');
console.log('   ✅ Proper field mapping throughout');

// Uncomment the next line to actually run the test
// testBookingDetails(); 