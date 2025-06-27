const { executeQuery } = require('./backend/config/database');

async function checkEvents() {
  try {
    // Check all events
    const allEvents = await executeQuery('SELECT id, title, status, is_public, organizer_id FROM events');
    console.log('📊 Total events in database:', allEvents.data.length);
    
    if (allEvents.data.length > 0) {
      console.log('All events:');
      allEvents.data.forEach(event => {
        console.log(`  ${event.id}: ${event.title} (status: ${event.status}, public: ${event.is_public})`);
      });

      // Make sure they're published and public
      await executeQuery('UPDATE events SET status = "published", is_public = 1');
      console.log('✅ Set all events to published and public');
      
      // Check published events
      const published = await executeQuery('SELECT COUNT(*) as count FROM events WHERE status = "published" AND is_public = 1');
      console.log('📈 Published public events:', published.data[0].count);
    } else {
      console.log('❌ No events found! Creating sample events...');
      
      // Create a simple test event
      const testEvent = await executeQuery(`
        INSERT INTO events (title, description, event_type, event_date, start_time, end_time, 
                           venue_name, venue_city, venue_state, venue_country, 
                           budget_min, budget_max, currency, status, is_public, organizer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Test Music Festival',
        'A great music festival for artists to showcase their talents',
        'festival',
        '2024-12-25',
        '18:00:00',
        '23:00:00',
        'Test Venue',
        'New York',
        'NY',
        'USA',
        500,
        2000,
        'USD',
        'published',
        1,
        1  // assuming organizer ID 1 exists
      ]);
      
      console.log('✅ Created test event:', testEvent);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEvents(); 