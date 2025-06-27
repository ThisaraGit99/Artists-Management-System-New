const { executeQuery } = require('./config/database');

async function testArtistPaymentStatus() {
    console.log('🔍 Testing Artist Payment Status Display...\n');
    
    try {
        // Test 1: Check if payment columns exist in bookings table
        console.log('1. Checking payment columns in bookings table...');
        const columns = await executeQuery('DESCRIBE bookings');
        
        if (columns.success) {
            const paymentColumns = columns.data.filter(col => 
                col.Field.includes('payment') || 
                col.Field.includes('platform_fee') || 
                col.Field.includes('net_amount')
            );
            
            console.log('Payment-related columns found:');
            paymentColumns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type}`);
            });
        }
        
        // Test 2: Check artist bookings data
        console.log('\n2. Checking artist bookings with payment data...');
        const artistBookings = await executeQuery(`
            SELECT 
                b.id,
                b.event_name,
                b.status,
                b.payment_status,
                b.platform_fee,
                b.net_amount,
                b.total_amount,
                o.name as organizer_name
            FROM bookings b
            JOIN organizers org ON b.organizer_id = org.id
            JOIN users o ON org.user_id = o.id
            LIMIT 5
        `);
        
        if (artistBookings.success && artistBookings.data.length > 0) {
            console.log(`Found ${artistBookings.data.length} bookings:`);
            artistBookings.data.forEach(booking => {
                console.log(`\n   📋 Booking ${booking.id}:`);
                console.log(`      Event: ${booking.event_name}`);
                console.log(`      Status: ${booking.status}`);
                console.log(`      Payment Status: ${booking.payment_status || 'NULL'}`);
                console.log(`      Platform Fee: $${booking.platform_fee || 'NULL'}`);
                console.log(`      Net Amount: $${booking.net_amount || 'NULL'}`);
                console.log(`      Total Amount: $${booking.total_amount}`);
            });
        } else {
            console.log('No bookings found or query failed');
        }
        
        // Test 3: Check specific bookings with payment made
        console.log('\n3. Checking bookings with payment made...');
        const paidBookings = await executeQuery(`
            SELECT 
                b.id,
                b.event_name,
                b.status,
                b.payment_status,
                b.platform_fee,
                b.net_amount
            FROM bookings b
            WHERE b.payment_status = 'paid'
            LIMIT 3
        `);
        
        if (paidBookings.success && paidBookings.data.length > 0) {
            console.log(`Found ${paidBookings.data.length} bookings with payment made:`);
            paidBookings.data.forEach(booking => {
                console.log(`   💳 Booking ${booking.id}: ${booking.event_name}`);
                console.log(`      Payment Status: ${booking.payment_status}`);
                console.log(`      Platform Fee: $${booking.platform_fee}`);
                console.log(`      Net Amount: $${booking.net_amount}`);
            });
        } else {
            console.log('No paid bookings found');
        }
        
        console.log('\n✅ Artist payment status test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testArtistPaymentStatus(); 