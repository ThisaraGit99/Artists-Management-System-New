const { executeQuery } = require('./backend/config/database');

async function checkTableStructure() {
    try {
        console.log('Checking bookings table structure...');
        
        // Show table structure
        const describeResult = await executeQuery('DESCRIBE bookings');
        console.log('\nBookings table columns:');
        console.log(describeResult);
        
        // Show sample data
        const sampleResult = await executeQuery('SELECT * FROM bookings LIMIT 1');
        console.log('\nSample booking data:');
        console.log(sampleResult);
        
        // Check artists table
        const artistsResult = await executeQuery('DESCRIBE artists');
        console.log('\nArtists table columns:');
        console.log(artistsResult);
        
        // Check users table
        const usersResult = await executeQuery('DESCRIBE users');
        console.log('\nUsers table columns:');
        console.log(usersResult);
        
    } catch (error) {
        console.error('Error checking table structure:', error);
    }
}

checkTableStructure(); 