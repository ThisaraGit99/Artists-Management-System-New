const { executeQuery } = require('./backend/config/database');

async function debugEventsEndpoint() {
  console.log('🔍 DEBUGGING: /api/events/browse/all?status=published\n');
  
  try {
    // Step 1: Test basic database connection
    console.log('Step 1: Testing database connection...');
    const connectionTest = await executeQuery('SELECT 1 as test');
    console.log('✅ Database connection:', connectionTest.success ? 'OK' : 'FAILED');
    if (!connectionTest.success) {
      console.error('❌ DB Error:', connectionTest.error);
      return;
    }

    // Step 2: Check if events table exists
    console.log('\nStep 2: Checking events table...');
    const tableCheck = await executeQuery('DESCRIBE events');
    console.log('✅ Events table exists:', tableCheck.success ? 'YES' : 'NO');
    if (!tableCheck.success) {
      console.error('❌ Table Error:', tableCheck.error);
      return;
    }

    // Step 3: Count total events
    console.log('\nStep 3: Counting total events...');
    const totalCount = await executeQuery('SELECT COUNT(*) as total FROM events');
    console.log('📊 Total events:', totalCount.data[0].total);

    // Step 4: Check published events
    console.log('\nStep 4: Checking published events...');
    const publishedCount = await executeQuery('SELECT COUNT(*) as total FROM events WHERE status = "published"');
    console.log('📊 Published events:', publishedCount.data[0].total);

    // Step 5: Check public events
    console.log('\nStep 5: Checking public events...');
    const publicCount = await executeQuery('SELECT COUNT(*) as total FROM events WHERE is_public = 1');
    console.log('📊 Public events:', publicCount.data[0].total);

    // Step 6: Check published AND public events
    console.log('\nStep 6: Checking published AND public events...');
    const bothCount = await executeQuery('SELECT COUNT(*) as total FROM events WHERE status = "published" AND is_public = 1');
    console.log('📊 Published + Public events:', bothCount.data[0].total);

    // Step 7: Test the exact query from browseEvents controller
    console.log('\nStep 7: Testing exact browseEvents query...');
    
    // Simulate the exact same logic
    const status = 'published';
    let whereConditions = ['e.is_public = true'];
    let queryParams = [];
    
    whereConditions.push('e.status = ?');
    queryParams.push(status);
    
    const limit = 10;
    const offset = 0;
    
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
    
    const eventsResult = await executeQuery(query, queryParams);
    console.log('✅ Query execution:', eventsResult.success ? 'SUCCESS' : 'FAILED');
    
    if (eventsResult.success) {
      console.log('📊 Events returned:', eventsResult.data.length);
      if (eventsResult.data.length > 0) {
        console.log('📋 First event:', {
          id: eventsResult.data[0].id,
          name: eventsResult.data[0].name,
          date: eventsResult.data[0].date,
          location: eventsResult.data[0].location
        });
      }
    } else {
      console.error('❌ Query Error:', eventsResult.error);
    }

    // Step 8: Test safeJsonParse function
    console.log('\nStep 8: Testing safeJsonParse function...');
    try {
      const { safeJsonParse } = require('./backend/utils/dataFormatters');
      const testResult = safeJsonParse('["test"]', []);
      console.log('✅ safeJsonParse works:', testResult);
    } catch (error) {
      console.error('❌ safeJsonParse error:', error.message);
    }

    // Step 9: Check users table (for LEFT JOIN)
    console.log('\nStep 9: Checking users table...');
    const usersCount = await executeQuery('SELECT COUNT(*) as total FROM users');
    console.log('📊 Total users:', usersCount.data[0].total);

    // Step 10: Test simple events query
    console.log('\nStep 10: Testing simple events query...');
    const simpleQuery = await executeQuery('SELECT id, title, status, is_public FROM events LIMIT 5');
    console.log('📋 Sample events:');
    simpleQuery.data.forEach(event => {
      console.log(`   ${event.id}: "${event.title}" (status: ${event.status}, public: ${event.is_public})`);
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

debugEventsEndpoint(); 