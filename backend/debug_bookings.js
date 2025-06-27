const { executeQuery } = require('./config/database');

async function debugBookings() {
    console.log('Testing bookings query...');
    
    try {
        // First, let's see if we can get any bookings at all
        console.log('1. Testing simple SELECT...');
        const simpleResult = await executeQuery('SELECT COUNT(*) as count FROM bookings');
        console.log('Simple result:', simpleResult);
        
        // Test if the columns exist
        console.log('2. Testing DESCRIBE table...');
        const describeResult = await executeQuery('DESCRIBE bookings');
        console.log('Table structure:', describeResult);
        
        // Test the exact query that's failing
        console.log('3. Testing full query...');
        const fullQuery = `
            SELECT b.*, a.user_id as artist_user_id, u.name as artist_name, u.email as artist_email, u.phone as artist_phone, p.title as package_title, p.description as package_description 
            FROM bookings b 
            JOIN artists a ON b.artist_id = a.id 
            JOIN users u ON a.user_id = u.id 
            LEFT JOIN packages p ON b.package_id = p.id 
            LIMIT 1
        `;
        
        const fullResult = await executeQuery(fullQuery);
        console.log('Full query result:', fullResult);
        
        if (fullResult.success && fullResult.data.length > 0) {
            console.log('Sample booking data:', fullResult.data[0]);
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugBookings(); 