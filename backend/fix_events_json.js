const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'artist_management_system'
};

async function fixEventsJson() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    // Fix invalid JSON fields in events table
    await connection.execute(`
      UPDATE events 
      SET requirements = '[]' 
      WHERE requirements IS NOT NULL 
      AND requirements != '' 
      AND requirements NOT LIKE '[%'
      AND requirements NOT LIKE '{%'
    `);

    await connection.execute(`
      UPDATE events 
      SET venue_details = '{}' 
      WHERE venue_details IS NOT NULL 
      AND venue_details != '' 
      AND venue_details NOT LIKE '[%'
      AND venue_details NOT LIKE '{%'
    `);

    await connection.execute(`
      UPDATE events 
      SET contact_info = '{}' 
      WHERE contact_info IS NOT NULL 
      AND contact_info != '' 
      AND contact_info NOT LIKE '[%'
      AND contact_info NOT LIKE '{%'
    `);

    console.log('✅ Fixed invalid JSON fields in events table');

    // Check the results
    const [events] = await connection.execute('SELECT id, title, requirements, venue_details, contact_info FROM events LIMIT 5');
    
    console.log(`\nChecking ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title}`);
      console.log(`  Requirements: ${event.requirements || 'NULL'}`);
      console.log(`  Venue Details: ${event.venue_details || 'NULL'}`);
      console.log(`  Contact Info: ${event.contact_info || 'NULL'}`);
    });

    await connection.end();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixEventsJson(); 