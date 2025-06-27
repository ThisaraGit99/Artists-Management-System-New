const { executeQuery } = require('./config/database');

async function testOrganizerQuery() {
    console.log('Testing organizer bookings query...');
    
    try {
        // First check if payment columns exist
        console.log('1. Checking table structure...');
        const describeResult = await executeQuery('DESCRIBE bookings');
        if (describeResult.success) {
            console.log('Bookings table columns:');
            describeResult.data.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        }
        
        // Test the exact query from the controller
        console.log('\n2. Testing the exact query...');
        const query = `SELECT 
            b.id, b.artist_id, b.organizer_id, b.package_id, b.event_name, b.event_description,
            b.event_date, b.event_time, b.duration, b.venue_address, b.total_amount, b.status, 
            b.special_requirements, b.created_at, b.updated_at,
            a.user_id as artist_user_id, u.name as artist_name, u.email as artist_email, u.phone as artist_phone, 
            p.title as package_title, p.description as package_description 
            FROM bookings b 
            JOIN artists a ON b.artist_id = a.id 
            JOIN users u ON a.user_id = u.id 
            LEFT JOIN packages p ON b.package_id = p.id 
            LIMIT 1`;
            
        const result = await executeQuery(query);
        console.log('Query result:', result);
        
        if (result.success && result.data.length > 0) {
            console.log('\n✓ Query successful! Sample data:');
            console.log(result.data[0]);
        } else if (!result.success) {
            console.log('\n✗ Query failed:', result.error);
        } else {
            console.log('\n⚠ Query successful but no data found');
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testOrganizerQuery(); 