const { executeQuery } = require('./backend/config/database');

async function debugBookingPayment() {
    console.log('=== Debugging Booking Payment Issue ===\n');
    
    try {
        // 1. Check if payment columns exist in bookings table
        console.log('1. Checking bookings table structure...');
        const tableStructure = await executeQuery('DESCRIBE bookings');
        
        if (tableStructure.success) {
            console.log('Current columns in bookings table:');
            tableStructure.data.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Check if payment_status column exists
            const hasPaymentStatus = tableStructure.data.find(col => col.Field === 'payment_status');
            console.log('\nPayment status column exists:', hasPaymentStatus ? 'YES' : 'NO');
        }
        
        // 2. Check sample booking data
        console.log('\n2. Checking sample booking data...');
        const bookings = await executeQuery('SELECT * FROM bookings WHERE status = "confirmed" LIMIT 1');
        
        if (bookings.success && bookings.data.length > 0) {
            console.log('Sample confirmed booking:');
            const booking = bookings.data[0];
            console.log(`- ID: ${booking.id}`);
            console.log(`- Status: ${booking.status}`);
            console.log(`- Payment Status: ${booking.payment_status || 'undefined'}`);
            console.log(`- Total Amount: ${booking.total_amount}`);
            console.log(`- Platform Fee: ${booking.platform_fee || 'undefined'}`);
            console.log(`- Net Amount: ${booking.net_amount || 'undefined'}`);
        } else {
            console.log('No confirmed bookings found');
            
            // Show all bookings
            const allBookings = await executeQuery('SELECT id, event_name, status, payment_status FROM bookings LIMIT 5');
            if (allBookings.success) {
                console.log('\nAll bookings:');
                allBookings.data.forEach(b => {
                    console.log(`- ID: ${b.id}, Event: ${b.event_name}, Status: ${b.status}, Payment: ${b.payment_status || 'undefined'}`);
                });
            }
        }
        
        // 3. Test the getBookingDetails query
        console.log('\n3. Testing getBookingDetails query...');
        const detailsQuery = `
            SELECT 
                b.id, b.artist_id, b.organizer_id, b.package_id, b.event_name, b.event_description,
                b.event_date, b.event_time, b.duration, b.venue_address, b.total_amount, b.status, 
                b.special_requirements, b.created_at, b.updated_at, b.payment_status, b.payment_date,
                b.completion_date, b.platform_fee, b.net_amount,
                a.user_id as artist_user_id, u.name as artist_name, u.email as artist_email, u.phone as artist_phone, 
                a.bio as artist_bio, a.hourly_rate as artist_hourly_rate, a.location as artist_location, 
                p.title as package_title, p.description as package_description, p.price as package_price, p.duration as package_duration 
                FROM bookings b 
                JOIN artists a ON b.artist_id = a.id 
                JOIN users u ON a.user_id = u.id 
                LEFT JOIN packages p ON b.package_id = p.id 
                LIMIT 1
        `;
        
        const detailsResult = await executeQuery(detailsQuery);
        if (detailsResult.success && detailsResult.data.length > 0) {
            console.log('✅ getBookingDetails query works');
            const booking = detailsResult.data[0];
            console.log('Sample booking details:');
            console.log(`- Payment Status: ${booking.payment_status}`);
            console.log(`- Platform Fee: ${booking.platform_fee}`);
            console.log(`- Net Amount: ${booking.net_amount}`);
        } else {
            console.log('❌ getBookingDetails query failed:', detailsResult.error);
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
    }
}

debugBookingPayment(); 