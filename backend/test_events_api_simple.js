const { executeQuery } = require('./config/database');

async function testEventsAPI() {
  try {
    console.log('🔍 Testing Events API...');
    
    // 1. Check if events exist
    console.log('\n1. Checking events in database:');
    const eventsCheck = await executeQuery('SELECT id, title, status, is_public FROM events');
    console.log('Events found:', eventsCheck.data.length);
    eventsCheck.data.forEach(event => {
      console.log(`  - ${event.title} (status: ${event.status}, public: ${event.is_public})`);
    });
    
    // 2. Test the exact query used in browseEvents
    console.log('\n2. Testing browseEvents query:');
    const whereConditions = ['e.is_public = true', 'e.status = ?'];
    const queryParams = ['published'];
    
    const query = `
      SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time,
             e.venue_name, e.venue_city, e.venue_state, e.venue_country,
             e.budget_min, e.budget_max, e.currency, e.requirements,
             u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.event_date ASC
      LIMIT 10 OFFSET 0
    `;
    
    console.log('Query:', query);
    console.log('Params:', queryParams.concat([10, 0]));
    
    const result = await executeQuery(query, queryParams.concat([10, 0]));
    console.log('Result:', result);
    console.log('Events found:', result.data.length);
    
    if (result.data.length > 0) {
      console.log('First event:', result.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEventsAPI(); 