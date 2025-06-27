const { executeQuery } = require('./config/database');

async function findIssue() {
    try {
        console.log('1. Checking bookings table structure...');
        const bookingsStructure = await executeQuery('DESCRIBE bookings');
        console.log('Bookings columns:', bookingsStructure.data?.map(col => col.Field) || 'Error getting columns');
        
        console.log('\n2. Checking artists table structure...');
        const artistsStructure = await executeQuery('DESCRIBE artists');
        console.log('Artists columns:', artistsStructure.data?.map(col => col.Field) || 'Error getting columns');
        
        console.log('\n3. Testing individual parts of the failing query...');
        
        // Test basic bookings select
        console.log('\n3a. Testing basic bookings select...');
        const test1 = await executeQuery('SELECT id FROM bookings LIMIT 1');
        console.log('Basic bookings select:', test1.success ? 'SUCCESS' : `ERROR: ${test1.error}`);
        
        // Test join with artists
        console.log('\n3b. Testing JOIN with artists...');
        const test2 = await executeQuery('SELECT b.id, a.id FROM bookings b JOIN artists a ON b.artist_id = a.id LIMIT 1');
        console.log('JOIN with artists:', test2.success ? 'SUCCESS' : `ERROR: ${test2.error}`);
        
        // Test join with users
        console.log('\n3c. Testing full JOIN...');
        const test3 = await executeQuery('SELECT b.id, u.name FROM bookings b JOIN artists a ON b.artist_id = a.id JOIN users u ON a.user_id = u.id LIMIT 1');
        console.log('Full JOIN:', test3.success ? 'SUCCESS' : `ERROR: ${test3.error}`);
        
        // Test specific columns one by one
        console.log('\n4. Testing individual columns...');
        const columns = ['id', 'artist_id', 'organizer_id', 'event_name', 'event_date', 'total_amount', 'status', 'created_at'];
        
        for (const col of columns) {
            try {
                const result = await executeQuery(`SELECT ${col} FROM bookings LIMIT 1`);
                console.log(`Column ${col}:`, result.success ? 'EXISTS' : `ERROR: ${result.error}`);
            } catch (err) {
                console.log(`Column ${col}: ERROR: ${err.message}`);
            }
        }
        
        console.log('\n5. Testing the exact failing query with organizer_id = 1...');
        const failingQuery = `SELECT 
            b.id, 
            b.artist_id, 
            b.organizer_id,
            b.event_name, 
            b.event_date, 
            b.total_amount, 
            b.status,
            b.created_at,
            u.name as artist_name, 
            u.email as artist_email
            FROM bookings b 
            JOIN artists a ON b.artist_id = a.id 
            JOIN users u ON a.user_id = u.id 
            WHERE b.organizer_id = ? 
            ORDER BY b.created_at DESC 
            LIMIT ? OFFSET ?`;
        
        const failingResult = await executeQuery(failingQuery, [1, 10, 0]);
        console.log('Exact failing query:', failingResult.success ? 'SUCCESS' : `ERROR: ${failingResult.error}`);
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

findIssue(); 