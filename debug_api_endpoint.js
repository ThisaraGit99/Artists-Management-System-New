const { executeQuery } = require('./backend/config/database');

// Test the exact browseEvents controller logic
async function testBrowseEventsLogic() {
  try {
    console.log('🔍 Testing browseEvents controller logic...\n');
    
    // Simulate the exact request that's failing
    const req = {
      query: {
        status: 'published',
        page: 1,
        limit: 10
      }
    };
    
    // Extract parameters like in the controller
    const {
      event_type,
      city,
      state,
      country,
      date_from,
      date_to,
      budget_min,
      budget_max,
      page = 1,
      limit = 10,
      status
    } = req.query;

    let whereConditions = ['e.is_public = true'];
    let queryParams = [];

    // Filter by status - default to 'published' for public browsing
    const eventStatus = status || 'published';
    whereConditions.push('e.status = ?');
    queryParams.push(eventStatus);

    const offset = (page - 1) * limit;

    // Test the query that was fixed
    const query = `
      SELECT e.id, e.title as name, e.description, e.event_type, e.event_date as date, e.start_time,
             e.end_time, e.venue_name as location, e.venue_city, e.venue_state, e.venue_country,
             e.budget_min, e.budget_max, e.currency, e.requirements,
             u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.event_date ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    console.log('📋 Query:', query);
    console.log('📋 Parameters:', queryParams);
    console.log('📋 Where conditions:', whereConditions);
    console.log('');

    const eventsResult = await executeQuery(query, queryParams);
    
    console.log('✅ Query execution result:');
    console.log('  - Success:', eventsResult.success);
    
    if (eventsResult.success) {
      console.log('  - Events found:', eventsResult.data.length);
      
      if (eventsResult.data.length > 0) {
        console.log('\n📋 Sample events:');
        eventsResult.data.slice(0, 3).forEach(event => {
          console.log(`  ✓ ${event.id}: "${event.name}" at ${event.location}`);
        });
        
        // Test the formatting logic
        const safeJsonParse = (str, defaultValue) => {
          try {
            return str ? JSON.parse(str) : defaultValue;
          } catch {
            return defaultValue;
          }
        };
        
        const formattedEvents = eventsResult.data.map(event => ({
          ...event,
          requirements: safeJsonParse(event.requirements, []),
          budget: event.budget_max || event.budget_min || 0
        }));
        
        console.log('\n🎯 Final API response would be:');
        console.log({
          success: true,
          data: formattedEvents.slice(0, 2), // Show first 2 events
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: eventsResult.data.length
          }
        });
        
      } else {
        console.log('\n⚠️ No events found');
        
        // Check what's in the database
        const dbCheck = await executeQuery('SELECT id, title, status, is_public FROM events LIMIT 5');
        console.log('\n🔍 Database check - sample events:');
        dbCheck.data.forEach(event => {
          console.log(`  - ${event.id}: "${event.title}" (status: ${event.status}, public: ${event.is_public})`);
        });
      }
      
    } else {
      console.log('  - Error:', eventsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Also test a simple database connection
async function testBasicDB() {
  try {
    console.log('\n🔍 Testing basic database connection...');
    const result = await executeQuery('SELECT COUNT(*) as total FROM events');
    console.log('✅ Basic DB test:', result.success ? `${result.data[0].total} events total` : result.error);
  } catch (error) {
    console.error('❌ Basic DB error:', error);
  }
}

async function runTests() {
  await testBasicDB();
  await testBrowseEventsLogic();
}

runTests(); 