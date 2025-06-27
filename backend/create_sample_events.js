const { executeQuery } = require('./config/database');

async function createSampleEvents() {
  try {
    console.log('Creating sample events...');
    
    // Sample Event 1
    const event1 = await executeQuery(`
      INSERT INTO events (organizer_id, title, description, event_type, event_date, start_time, end_time,
                          venue_name, venue_city, venue_state, budget_min, budget_max, status, is_public)
      VALUES (1, 'Summer Music Festival', 'A vibrant outdoor music festival with multiple stages', 'concert', 
              '2025-07-15', '18:00:00', '23:00:00', 'Central Park Amphitheater', 'New York', 'NY', 
              3000, 5000, 'published', true)
    `);
    console.log('✅ Event 1 created:', event1.insertId);
    
    // Sample Event 2  
    const event2 = await executeQuery(`
      INSERT INTO events (organizer_id, title, description, event_type, event_date, start_time, end_time,
                          venue_name, venue_city, venue_state, budget_min, budget_max, status, is_public)
      VALUES (1, 'Wedding Reception', 'Elegant wedding reception with live entertainment', 'wedding', 
              '2025-08-20', '19:00:00', '24:00:00', 'Grand Ballroom Hotel', 'Los Angeles', 'CA', 
              2000, 4000, 'published', true)
    `);
    console.log('✅ Event 2 created:', event2.insertId);
    
    // Sample Event 3
    const event3 = await executeQuery(`
      INSERT INTO events (organizer_id, title, description, event_type, event_date, start_time, end_time,
                          venue_name, venue_city, venue_state, budget_min, budget_max, status, is_public)
      VALUES (1, 'Corporate Gala', 'Annual company celebration with entertainment', 'corporate', 
              '2025-09-10', '20:00:00', '23:30:00', 'Convention Center', 'Chicago', 'IL', 
              4000, 7000, 'published', true)
    `);
    console.log('✅ Event 3 created:', event3.insertId);
    
    console.log('🎉 All sample events created successfully!');
  } catch (error) {
    console.error('❌ Error creating events:', error);
  }
}

createSampleEvents(); 