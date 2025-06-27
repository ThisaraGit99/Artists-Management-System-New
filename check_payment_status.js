const mysql = require('mysql2/promise');

async function checkPaymentStatus() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'artist_management'
        });

        console.log('🔍 Checking Payment System Status...\n');

        // 1. Check confirmed bookings
        const [confirmed] = await connection.execute(
            'SELECT id, event_name, status, payment_status, total_amount FROM bookings WHERE status = "confirmed" LIMIT 5'
        );
        console.log(`✅ Found ${confirmed.length} confirmed bookings ready for payment:`);
        confirmed.forEach(booking => {
            console.log(`   - ID: ${booking.id}, Event: ${booking.event_name}, Payment: ${booking.payment_status || 'pending'}`);
        });

        // 2. Check paid bookings
        const [paid] = await connection.execute(
            'SELECT id, event_name, payment_status, platform_fee, net_amount FROM bookings WHERE payment_status = "paid" LIMIT 5'
        );
        console.log(`\n💳 Found ${paid.length} bookings with payment made:`);
        paid.forEach(booking => {
            console.log(`   - ID: ${booking.id}, Event: ${booking.event_name}, Fee: $${booking.platform_fee}, Net: $${booking.net_amount}`);
        });

        // 3. Check completed bookings
        const [completed] = await connection.execute(
            'SELECT id, event_name, status, payment_status FROM bookings WHERE payment_status = "released" OR status = "completed" LIMIT 5'
        );
        console.log(`\n✅ Found ${completed.length} completed bookings:`);
        completed.forEach(booking => {
            console.log(`   - ID: ${booking.id}, Event: ${booking.event_name}, Status: ${booking.status}, Payment: ${booking.payment_status}`);
        });

        console.log('\n🎯 Payment system is ready for testing!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkPaymentStatus(); 