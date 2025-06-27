const { executeQuery } = require('./backend/config/database');

async function testFixedQuery() {
  try {
    console.log('🔧 Testing fixed browseEvents query...\n');
    
    // Simulate the request parameters
    const req = {
      query: {
        status: 'published',
        page: 1,
        limit: 10
      }
    };
    
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

    // Add filters (none for this test)
    
    const offset = (page - 1) * limit;
    
    // FIXED: Use string interpolation for LIMIT and OFFSET instead of parameters
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

    console.log('📋 Fixed Query:');
    console.log(query);
    console.log('\n📋 Parameters:', queryParams);
    
    const eventsResult = await executeQuery(query, queryParams);
    
    console.log('\n✅ Query success:', eventsResult.success);
    
    if (eventsResult.success) {
      console.log('📊 Events found:', eventsResult.data.length);
      
      if (eventsResult.data.length > 0) {
        console.log('\n📋 Sample events:');
        eventsResult.data.slice(0, 3).forEach(event => {
          console.log(`  ✓ ${event.id}: "${event.name}" at ${event.location}`);
          console.log(`    Date: ${event.date}, Budget: $${event.budget_min}-$${event.budget_max}`);
        });
      }
      
      // Format events like the controller does
      const formattedEvents = eventsResult.data.map(event => ({
        ...event,
        requirements: JSON.parse(event.requirements || '[]'),
        budget: event.budget_max || event.budget_min || 0
      }));
      
      const response = {
        success: true,
        data: formattedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: eventsResult.data.length
        }
      };
      
      console.log('\n🎯 API Response format:');
      console.log('Success:', response.success);
      console.log('Data length:', response.data.length);
      console.log('Pagination:', response.pagination);
      
    } else {
      console.log('❌ Query error:', eventsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testFixedQuery(); 