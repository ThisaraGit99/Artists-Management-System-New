const { executeQuery } = require('./config/database');

async function fixEvents() {
  try {
    console.log('🔍 Checking current events...');
    const currentEvents = await executeQuery('SELECT id, title, status, is_public FROM events');
    console.log('Current events:', currentEvents.data);
    
    console.log('\n🔧 Setting events to published status...');
    await executeQuery('UPDATE events SET status = "published", is_public = 1');
    
    console.log('\n✅ Updated events:');
    const updatedEvents = await executeQuery('SELECT id, title, status, is_public FROM events');
    console.log('Updated events:', updatedEvents.data);
    
    console.log('\n🔍 Testing browse query...');
    const browseQuery = `
      SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time,
             e.venue_name, e.venue_city, e.venue_state, e.venue_country,
             e.budget_min, e.budget_max, e.currency, e.requirements,
             u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.is_public = true AND e.status = 'published'
      ORDER BY e.event_date ASC
    `;
    
    const browseResult = await executeQuery(browseQuery);
    console.log('Browse result:', browseResult.data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixEvents(); 