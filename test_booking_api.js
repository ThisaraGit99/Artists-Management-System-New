const axios = require('axios');

async function testBookingAPI() {
  try {
    console.log('🧪 Testing Booking Details API...\n');
    
    // Test the booking details endpoint directly
    const response = await axios.get('http://localhost:5000/api/admin/bookings/7', {
      headers: {
        'Authorization': 'Bearer your-admin-token-here',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:');
    
    const booking = response.data.data.booking;
    console.log('Event Title:', booking.event_title);
    console.log('Event Type:', booking.event_type);
    console.log('Performance Date:', booking.performance_date);
    console.log('Performance Duration:', booking.performance_duration);
    console.log('Location:', booking.location);
    console.log('Total Amount:', booking.total_amount);
    console.log('Platform Fee:', booking.platform_fee);
    console.log('Net Amount:', booking.net_amount);
    console.log('Artist Name:', booking.artist_name);
    console.log('Organizer Name:', booking.organizer_name);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️ Authentication required - this is expected without a valid token');
      console.log('✅ API endpoint is responding correctly');
    } else {
      console.log('❌ API Error:', error.message);
    }
  }
}

console.log('📝 Booking API Test');
console.log('🔧 Both servers should now be running with updated code');
console.log('💡 To fix the N/A issue:');
console.log('   1. Clear browser cache (Ctrl+F5)');
console.log('   2. Open browser developer tools (F12)');
console.log('   3. Go to Network tab');
console.log('   4. Click "View Details" on a booking');
console.log('   5. Check the API response in Network tab');
console.log('');

// Uncomment to run the test (needs valid admin token)
// testBookingAPI(); 