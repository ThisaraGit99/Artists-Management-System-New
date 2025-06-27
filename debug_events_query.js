const { executeQuery } = require('./backend/config/database');

async function debugEventsQuery() {
  try {
    console.log('🔍 Testing the exact query from browseEvents controller...\n');
    
    // This is the exact same query logic from the controller
    let whereConditions = ['e.is_public = true'];
    let queryParams = [];
    
    // Filter by status - default to 'published' for public browsing  
    const eventStatus = 'published';
    whereConditions.push('e.status = ?');
    queryParams.push(eventStatus);
    
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const finalQueryParams = [...queryParams, parseInt(limit), offset];
    
    const query = `
      SELECT e.id, e.title as name, e.description, e.event_type, e.event_date as date, e.start_time,
             e.end_time, e.venue_name as location, e.venue_city, e.venue_state, e.venue_country,
             e.budget_min, e.budget_max, e.currency, e.requirements,
             u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.event_date ASC
      LIMIT ? OFFSET ?
    `;
    
    console.log('📋 Query:', query);
    console.log('📋 WHERE conditions:', whereConditions);
    console.log('📋 Parameters:', finalQueryParams);
    console.log('');
    
    const eventsResult = await executeQuery(query, finalQueryParams);
    console.log('✅ Query result success:', eventsResult.success);
    console.log('📊 Events found:', eventsResult.data?.length || 0);
    
    if (eventsResult.data && eventsResult.data.length > 0) {
      console.log('\n📋 Sample events:');
      eventsResult.data.slice(0, 3).forEach(event => {
        console.log(`  - ${event.id}: "${event.name}" at ${event.location}`);
      });
    } else {
      console.log('\n❌ No events returned by query');
      
      // Let's check what events actually exist
      console.log('\n🔍 Checking what events exist in database...');
      const allEvents = await executeQuery('SELECT id, title, status, is_public, venue_name FROM events LIMIT 5');
      console.log('📊 Sample events in DB:');
      allEvents.data.forEach(event => {
        console.log(`  - ${event.id}: "${event.title}" (status: ${event.status}, public: ${event.is_public})`);
      });
    }
    
    // Test the count query too
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    console.log('\n📊 Total count:', countResult.data[0]?.total || 0);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugEventsQuery(); 