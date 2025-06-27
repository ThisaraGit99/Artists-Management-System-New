const { pool } = require('./config/database');

async function createTestDisputeData() {
  try {
    console.log('🧪 Creating test data for dispute system...\n');

    // Create a test booking that can be used for dispute testing
    const [result] = await pool.execute(`
      INSERT INTO bookings (
        organizer_id, artist_id, event_name, event_date, event_time, 
        duration, venue_address, total_amount, platform_fee, net_amount,
        status, payment_status, created_at
      ) VALUES (
        1, 1, 'Test Concert for Dispute', '2024-12-20', '19:00:00',
        2, 'Test Venue, Test City', 200.00, 20.00, 180.00,
        'completed', 'paid', NOW()
      )
    `);

    const testBookingId = result.insertId;

    console.log(`✅ Created test booking #${testBookingId} for dispute testing`);
    console.log('   Event: Test Concert for Dispute');
    console.log('   Organizer: Jane Smith (ID: 1)');
    console.log('   Artist: John Doe (ID: 1)');
    console.log('   Status: completed, Payment: paid');
    console.log('   Amount: $200.00\n');

    // Create another booking for cancellation testing
    const [result2] = await pool.execute(`
      INSERT INTO bookings (
        organizer_id, artist_id, event_name, event_date, event_time, 
        duration, venue_address, total_amount, platform_fee, net_amount,
        status, payment_status, created_at
      ) VALUES (
        1, 1, 'Future Event for Cancellation', '2025-01-15', '20:00:00',
        3, 'Future Venue, Test City', 300.00, 30.00, 270.00,
        'confirmed', 'paid', NOW()
      )
    `);

    const testBookingId2 = result2.insertId;

    console.log(`✅ Created test booking #${testBookingId2} for cancellation testing`);
    console.log('   Event: Future Event for Cancellation');
    console.log('   Date: January 15, 2025 (future date)');
    console.log('   Status: confirmed, Payment: paid');
    console.log('   Amount: $300.00\n');

    console.log('🎯 TEST SCENARIOS READY:');
    console.log('========================');
    console.log(`1. Non-Delivery Dispute: Use booking #${testBookingId}`);
    console.log(`2. Cancellation Test: Use booking #${testBookingId2}`);
    console.log('3. Auto-Resolution: Create dispute and wait (or modify timer)');
    console.log('4. Admin Investigation: Create dispute, artist responds, admin decides\n');

    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('=====================');
    console.log('ADMIN: admin@artistmgmt.com / admin123');
    console.log('ORGANIZER: jane.organizer@email.com / organizer123');
    console.log('ARTIST: john.artist@email.com / artist123\n');

    console.log('🌐 ACCESS URLS:');
    console.log('===============');
    console.log('Frontend: http://localhost:3000');
    console.log('Backend API: http://localhost:5000');
    console.log('Health Check: http://localhost:5000/health\n');

    console.log('✅ Test data creation complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestDisputeData(); 