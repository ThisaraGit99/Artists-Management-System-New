const { executeQuery } = require('./config/database');

async function testFixedQuery() {
    console.log('=== Testing Fixed Booking Query ===\n');
    
    try {
        // Test the fixed query
        const query = `
            SELECT 
                b.id, b.artist_id, b.organizer_id, b.package_id, b.event_name, b.event_description,
                b.event_date, b.event_time, b.duration, b.venue_address, b.total_amount, b.status, 
                b.special_requirements, b.created_at, b.updated_at,
                a.user_id as artist_user_id, u.name as artist_name, u.email as artist_email, u.phone as artist_phone, 
                a.bio as artist_bio, a.hourly_rate as artist_hourly_rate, a.location as artist_location, 
                p.title as package_title, p.description as package_description, p.price as package_price, p.duration as package_duration 
                FROM bookings b 
                JOIN artists a ON b.artist_id = a.id 
                JOIN users u ON a.user_id = u.id 
                LEFT JOIN packages p ON b.package_id = p.id 
                WHERE b.id = 7`;
                
        console.log('Testing query for booking ID 7...');
        const result = await executeQuery(query);
        
        if (result.success) {
            if (result.data.length > 0) {
                console.log('✅ Query successful! Booking details:');
                const booking = result.data[0];
                console.log(`Event: ${booking.event_name}`);
                console.log(`Artist: ${booking.artist_name}`);
                console.log(`Date: ${booking.event_date}`);
                console.log(`Venue: ${booking.venue_address}`);
                console.log(`Status: ${booking.status}`);
                console.log(`Amount: $${booking.total_amount}`);
            } else {
                console.log('⚠️ Query successful but no booking found with ID 7');
            }
        } else {
            console.log('❌ Query failed:', result.error);
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testFixedQuery(); 