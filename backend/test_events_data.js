const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'artist_management_system'
};

async function checkEventsData() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    // Get all events to check their JSON fields
    const [events] = await connection.execute('SELECT * FROM events LIMIT 5');
    
    console.log(`Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`\n--- Event ${index + 1} ---`);
      console.log('ID:', event.id);
      console.log('Title:', event.title);
      console.log('Requirements:', event.requirements);
      console.log('Venue Details:', event.venue_details);
      console.log('Contact Info:', event.contact_info);
      
      // Test JSON parsing
      if (event.requirements) {
        try {
          JSON.parse(event.requirements);
          console.log('✅ Requirements JSON is valid');
        } catch (e) {
          console.log('❌ Requirements JSON is invalid:', e.message);
        }
      }
      
      if (event.venue_details) {
        try {
          JSON.parse(event.venue_details);
          console.log('✅ Venue Details JSON is valid');
        } catch (e) {
          console.log('❌ Venue Details JSON is invalid:', e.message);
        }
      }
      
      if (event.contact_info) {
        try {
          JSON.parse(event.contact_info);
          console.log('✅ Contact Info JSON is valid');
        } catch (e) {
          console.log('❌ Contact Info JSON is invalid:', e.message);
        }
      }
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEventsData(); 