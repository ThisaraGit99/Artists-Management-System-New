const mysql = require('mysql2/promise');

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'artist_management'
});

async function testPaymentFlow() {
    try {
        console.log('🔍 Testing Payment Flow...\n');

        // 1. Check if there are any confirmed bookings
        console.log('1. Checking for confirmed bookings...');
        const [confirmedBookings] = await connection.execute(`
            SELECT id, event_name, status, payment_status, total_amount 
            FROM bookings 
            WHERE status = 'confirmed' 
            LIMIT 5
        `);
        
        console.log(`Found ${confirmedBookings.length} confirmed bookings:`);
        confirmedBookings.forEach(booking => {
            console.log(`   - Booking ${booking.id}: ${booking.event_name} (Status: ${booking.status}, Payment: ${booking.payment_status || 'pending'})`);
        });

        // 2. Check bookings with payment made
        console.log('\n2. Checking bookings with payment made...');
        const [paidBookings] = await connection.execute(`
            SELECT id, event_name, status, payment_status, total_amount, platform_fee, net_amount
            FROM bookings 
            WHERE payment_status = 'paid'
            LIMIT 5
        `);
        
        console.log(`Found ${paidBookings.length} bookings with payment made:`);
        paidBookings.forEach(booking => {
            console.log(`   - Booking ${booking.id}: ${booking.event_name} (Status: ${booking.status}, Payment: ${booking.payment_status})`);
            console.log(`     Amount: $${booking.total_amount}, Fee: $${booking.platform_fee}, Net: $${booking.net_amount}`);
        });

        // 3. Check completed bookings (payment released)
        console.log('\n3. Checking completed bookings...');
        const [completedBookings] = await connection.execute(`
            SELECT id, event_name, status, payment_status, total_amount, completion_date
            FROM bookings 
            WHERE payment_status = 'released' OR status = 'completed'
            LIMIT 5
        `);
        
        console.log(`Found ${completedBookings.length} completed bookings:`);
        completedBookings.forEach(booking => {
            console.log(`   - Booking ${booking.id}: ${booking.event_name} (Status: ${booking.status}, Payment: ${booking.payment_status})`);
            if (booking.completion_date) {
                console.log(`     Completed: ${booking.completion_date}`);
            }
        });

        // 4. Check if payment columns exist
        console.log('\n4. Checking payment columns...');
        const [columns] = await connection.execute(`
            DESCRIBE bookings
        `);
        
        const paymentColumns = columns.filter(col => 
            col.Field.includes('payment') || 
            col.Field.includes('platform_fee') || 
            col.Field.includes('net_amount') ||
            col.Field.includes('completion_date')
        );
        
        console.log('Payment-related columns:');
        paymentColumns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });

        // 5. Test payment status enum values
        console.log('\n5. Checking payment_status enum values...');
        const paymentStatusColumn = columns.find(col => col.Field === 'payment_status');
        if (paymentStatusColumn) {
            console.log(`Payment status enum: ${paymentStatusColumn.Type}`);
        } else {
            console.log('❌ payment_status column not found!');
        }

        console.log('\n✅ Payment flow test completed!');

    } catch (error) {
        console.error('❌ Error testing payment flow:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the test
testPaymentFlow();