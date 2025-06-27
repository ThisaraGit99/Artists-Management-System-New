const { executeQuery } = require('./backend/config/database');

async function checkDatabaseEvents() {
  try {
    console.log('🔍 Checking events in database...\n');
    
    // 1. Total events count
    const totalCount = await executeQuery('SELECT COUNT(*) as total FROM events');
    console.log('📊 Total events in database:', totalCount.data[0].total);
    
    // 2. Events by status
    const statusCount = await executeQuery('SELECT status, COUNT(*) as count FROM events GROUP BY status');
    console.log('📊 Events by status:');
    statusCount.data.forEach(row => {
      console.log(`   ${row.status}: ${row.count} events`);
    });
    
    // 3. Published and public events (what the API should return)
    const publishedEvents = await executeQuery('SELECT COUNT(*) as count FROM events WHERE status = "published" AND is_public = 1');
    console.log('📊 Published & public events:', publishedEvents.data[0].count);
    
    // 4. Sample events
    const sampleEvents = await executeQuery('SELECT id, title, status, is_public FROM events LIMIT 5');
    console.log('\n📋 Sample events:');
    sampleEvents.data.forEach(event => {
      console.log(`   ${event.id}: "${event.title}" (status: ${event.status}, public: ${event.is_public})`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

checkDatabaseEvents(); 