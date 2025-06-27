const { executeQuery } = require('./config/database');

async function testPaymentStatus() {
    console.log('🔍 Testing Payment Status in Database...\n');
    
    try {
        // 1. Check if payment_status column exists
        console.log('1. Checking if payment_status column exists...');
        const tableStructure = await executeQuery('DESCRIBE bookings');
        
        if (tableStructure.success) {
            const paymentStatusColumn = tableStructure.data.find(col => col.Field === 'payment_status');
            if (paymentStatusColumn) {
                console.log('✅ payment_status column exists:', paymentStatusColumn.Type);
            } else {
                console.log('❌ payment_status column NOT found');
                return;
            }
        }
        
        // 2. Check sample booking data
        console.log('\n2. Checking sample booking data...');
        const bookings = await executeQuery(`
            SELECT id, event_name, status, payment_status, total_amount, platform_fee, net_amount 
            FROM bookings 
            LIMIT 3
        `);
        
        if (bookings.success && bookings.data.length > 0) {
            console.log('Sample bookings:');
            bookings.data.forEach(booking => {
                console.log(`- ID: ${booking.id}, Event: ${booking.event_name}`);
                console.log(`  Status: ${booking.status}, Payment: ${booking.payment_status || 'NULL'}`);
                console.log(`  Amount: $${booking.total_amount}, Fee: $${booking.platform_fee || 'NULL'}`);
            });
        } else {
            console.log('No bookings found');
        }
        
        // 3. Test the exact query used in getOrganizerBookings
        console.log('\n3. Testing organizer bookings query...');
        const orgBookings = await executeQuery(`
            SELECT 
                b.id, 
                b.event_name, 
                b.status,
                b.payment_status,
                b.platform_fee,
                b.net_amount,
                b.total_amount,
                u.name as artist_name
            FROM bookings b 
            JOIN artists a ON b.artist_id = a.id 
            JOIN users u ON a.user_id = u.id 
            LIMIT 2
        `);
        
        if (orgBookings.success && orgBookings.data.length > 0) {
            console.log('Organizer bookings query result:');
            orgBookings.data.forEach(booking => {
                console.log(`- Event: ${booking.event_name}, Artist: ${booking.artist_name}`);
                console.log(`  Status: ${booking.status}, Payment Status: ${booking.payment_status || 'NULL'}`);
                console.log(`  Amount: $${booking.total_amount}, Platform Fee: $${booking.platform_fee || 'NULL'}`);
            });
        } else {
            console.log('No organizer bookings found or query failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPaymentStatus(); 