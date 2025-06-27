const { pool } = require('./config/database');

async function checkExistingUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');

    // Get all users
    const [users] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             CASE 
               WHEN u.role = 'artist' THEN a.is_verified
               WHEN u.role = 'organizer' THEN o.is_verified
               ELSE 1
             END as is_verified
      FROM users u
      LEFT JOIN artists a ON u.id = a.user_id
      LEFT JOIN organizers o ON u.id = o.user_id
      ORDER BY u.role, u.created_at
    `);

    console.log('📊 EXISTING USERS:');
    console.log('==================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach(user => {
      const verifiedStatus = user.is_verified ? '✅ Verified' : '⚠️  Unverified';
      console.log(`${user.role.toUpperCase()}: ${user.name}`);
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🆔 ID: ${user.id}`);
      console.log(`  ✅ Status: ${verifiedStatus}`);
      console.log(`  📅 Created: ${user.created_at}`);
      console.log('');
    });

    // Check for bookings
    const [bookings] = await pool.execute(`
      SELECT COUNT(*) as count FROM bookings
    `);

    console.log(`📋 EXISTING BOOKINGS: ${bookings[0].count}`);

    if (bookings[0].count > 0) {
      const [bookingDetails] = await pool.execute(`
        SELECT b.id, b.event_name, b.status, b.payment_status, b.total_amount,
               u1.name as organizer_name, u2.name as artist_name
        FROM bookings b
        JOIN organizers o ON b.organizer_id = o.id
        JOIN artists a ON b.artist_id = a.id
        JOIN users u1 ON o.user_id = u1.id
        JOIN users u2 ON a.user_id = u2.id
        ORDER BY b.created_at DESC
        LIMIT 5
      `);

      console.log('\n📋 RECENT BOOKINGS:');
      console.log('==================');
      bookingDetails.forEach(booking => {
        console.log(`Booking #${booking.id}: ${booking.event_name}`);
        console.log(`  👤 Organizer: ${booking.organizer_name}`);
        console.log(`  🎤 Artist: ${booking.artist_name}`);
        console.log(`  📊 Status: ${booking.status}`);
        console.log(`  💰 Payment: ${booking.payment_status} ($${booking.total_amount})`);
        console.log('');
      });
    }

    // Check disputes
    const [disputes] = await pool.execute(`
      SELECT COUNT(*) as count FROM disputes
    `);

    console.log(`⚖️  EXISTING DISPUTES: ${disputes[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkExistingUsers(); 