const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'artist_management'
};

async function testEventsAPI() {
  let connection;
  
  try {
    console.log('🔍 Testing Events API...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Check if we have events
    const [events] = await connection.execute(`
      SELECT e.*, u.name as organizer_name 
      FROM events e 
      LEFT JOIN users u ON e.organizer_id = u.id 
      WHERE e.status = 'published'
      LIMIT 5
    `);
    
    console.log('📅 Published Events:');
    if (events.length === 0) {
      console.log('❌ No published events found');
      
      // Create a sample published event
      console.log('\n📝 Creating sample published event...');
      
      // First, find an organizer
      const [organizers] = await connection.execute(`
        SELECT id FROM users WHERE role = 'organizer' LIMIT 1
      `);
      
      if (organizers.length === 0) {
        console.log('❌ No organizer found. Creating one...');
        
        const hashedPassword = await bcrypt.hash('password123', 10);
        const [result] = await connection.execute(`
          INSERT INTO users (name, email, password, role, is_verified) 
          VALUES (?, ?, ?, ?, ?)
        `, ['Test Organizer', 'organizer@test.com', hashedPassword, 'organizer', 1]);
        
        const organizerId = result.insertId;
        console.log('✅ Created organizer with ID:', organizerId);
        
        // Create the event
        await connection.execute(`
          INSERT INTO events (
            organizer_id, name, description, date, start_time, end_time, 
            location, budget, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          organizerId,
          'Summer Music Festival',
          'Looking for talented musicians to perform at our summer festival. Great opportunity for exposure!',
          '2025-08-15',
          '18:00:00',
          '23:00:00',
          'Central Park, New York',
          5000,
          'published'
        ]);
        
        console.log('✅ Created sample event');
      } else {
        const organizerId = organizers[0].id;
        
        // Create the event
        await connection.execute(`
          INSERT INTO events (
            organizer_id, name, description, date, start_time, end_time, 
            location, budget, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          organizerId,
          'Summer Music Festival',
          'Looking for talented musicians to perform at our summer festival. Great opportunity for exposure!',
          '2025-08-15',
          '18:00:00',
          '23:00:00',
          'Central Park, New York',
          5000,
          'published'
        ]);
        
        console.log('✅ Created sample event');
      }
      
      // Re-fetch events
      const [newEvents] = await connection.execute(`
        SELECT e.*, u.name as organizer_name 
        FROM events e 
        LEFT JOIN users u ON e.organizer_id = u.id 
        WHERE e.status = 'published'
        LIMIT 5
      `);
      
      newEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name}`);
        console.log(`   By: ${event.organizer_name}`);
        console.log(`   Date: ${event.date}`);
        console.log(`   Budget: $${event.budget}`);
        console.log(`   Location: ${event.location}`);
        console.log('');
      });
    } else {
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name}`);
        console.log(`   By: ${event.organizer_name}`);
        console.log(`   Date: ${event.date}`);
        console.log(`   Budget: $${event.budget}`);
        console.log(`   Location: ${event.location}`);
        console.log('');
      });
    }
    
    // Check event applications table
    const [applicationColumns] = await connection.execute(`
      SHOW COLUMNS FROM event_applications
    `);
    
    console.log('📋 Event Applications Table Structure:');
    applicationColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });
    
    console.log('\n✅ Events API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testEventsAPI(); 