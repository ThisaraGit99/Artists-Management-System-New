const { executeQuery } = require('./backend/config/database');

async function testDatabase() {
    try {
        console.log('=== Testing Database Queries ===');
        
        // 1. Check if organizers exist
        console.log('1. Checking organizers...');
        const orgResult = await executeQuery('SELECT id, user_id FROM organizers LIMIT 1');
        console.log('Organizers result:', orgResult);
        
        if (!orgResult.success) {
            console.log('❌ Cannot query organizers table');
            return;
        }
        
        if (orgResult.data.length === 0) {
            console.log('⚠️ No organizers found in database');
            return;
        }
        
        const organizerId = orgResult.data[0].id;
        console.log('✓ Found organizer with ID:', organizerId);
        
        // 2. Check bookings table structure
        console.log('\n2. Checking bookings table structure...');
        const describeResult = await executeQuery('DESCRIBE bookings');
        if (describeResult.success) {
            console.log('Bookings columns:');
            describeResult.data.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });
        }
        
        // 3. Check if bookings have organizer_id
        console.log('\n3. Checking bookings...');
        const bookingsResult = await executeQuery('SELECT id, artist_id, organizer_id, event_name FROM bookings LIMIT 3');
        console.log('Bookings result:', bookingsResult);
        
        if (bookingsResult.success && bookingsResult.data.length > 0) {
            console.log('Sample bookings:');
            bookingsResult.data.forEach(booking => {
                console.log(`  - Booking ${booking.id}: artist_id=${booking.artist_id}, organizer_id=${booking.organizer_id}`);
            });
        }
        
        // 4. Test the JOIN query
        console.log('\n4. Testing JOIN query...');
        const joinQuery = `
            SELECT b.id, b.event_name, u.name as artist_name
            FROM bookings b 
            JOIN artists a ON b.artist_id = a.id 
            JOIN users u ON a.user_id = u.id 
            WHERE b.organizer_id = ?
            LIMIT 1
        `;
        
        const joinResult = await executeQuery(joinQuery, [organizerId]);
        console.log('JOIN result:', joinResult);
        
        if (joinResult.success) {
            console.log('✓ JOIN query works!');
            if (joinResult.data.length > 0) {
                console.log('Sample data:', joinResult.data[0]);
            }
        } else {
            console.log('❌ JOIN query failed:', joinResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testDatabase(); 