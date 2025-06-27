const mysql = require('mysql2/promise');

async function checkBookingData() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'artist_management_system',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('🔍 Checking booking data...\n');
    
    // Check if booking with ID 7 exists
    const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = 7');
    
    if (bookings.length === 0) {
      console.log('❌ No booking found with ID 7\n');
      
      // Check what bookings exist
      const [allBookings] = await pool.execute('SELECT id, event_name, event_date, total_amount, status FROM bookings LIMIT 5');
      console.log('📋 Available bookings:');
      if (allBookings.length === 0) {
        console.log('   No bookings found in database!');
      } else {
        allBookings.forEach(booking => {
          console.log(`  ID: ${booking.id}, Event: ${booking.event_name}, Date: ${booking.event_date}, Amount: ${booking.total_amount}`);
        });
      }
    } else {
      const booking = bookings[0];
      console.log('✅ Found booking #7:');
      console.log('Event Name:', booking.event_name || 'NULL');
      console.log('Event Date:', booking.event_date || 'NULL');
      console.log('Duration:', booking.duration || 'NULL');
      console.log('Venue Address:', booking.venue_address || 'NULL');
      console.log('Total Amount:', booking.total_amount || 'NULL');
      console.log('Platform Fee:', booking.platform_fee || 'NULL');
      console.log('Net Amount:', booking.net_amount || 'NULL');
      console.log('Status:', booking.status || 'NULL');
      console.log('Payment Status:', booking.payment_status || 'NULL');
      console.log('Created At:', booking.created_at || 'NULL');
      console.log('Artist ID:', booking.artist_id || 'NULL');
      console.log('Organizer ID:', booking.organizer_id || 'NULL');
    }
    
    // Also check if the related tables have data
    console.log('\n🔍 Checking related data...');
    const [artists] = await pool.execute('SELECT COUNT(*) as count FROM artists');
    const [organizers] = await pool.execute('SELECT COUNT(*) as count FROM organizers');
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`Artists: ${artists[0].count}`);
    console.log(`Organizers: ${organizers[0].count}`);
    console.log(`Users: ${users[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkBookingData(); 