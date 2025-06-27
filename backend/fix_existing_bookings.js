const { executeQuery } = require('./config/database');

async function fixExistingBookings() {
    console.log('Fixing existing bookings...');

    try {
        // Update existing bookings with default payment status
        const updateResult = await executeQuery(`
            UPDATE bookings 
            SET 
                payment_status = COALESCE(payment_status, 'pending_payment'),
                event_status = COALESCE(event_status, 'pending'),
                platform_fee = COALESCE(platform_fee, 0),
                net_amount = COALESCE(net_amount, total_amount)
        `);

        console.log('Update result:', updateResult);

        // Test query
        const testResult = await executeQuery('SELECT COUNT(*) as count FROM bookings');
        console.log('Test result:', testResult);

    } catch (error) {
        console.error('Error:', error);
    }
}

fixExistingBookings(); 