const { executeQuery } = require('./backend/config/database');

async function verifyAndFixEvents() {
  try {
    console.log('🔍 Checking current events...');
    
    // Check all events
    const allEvents = await executeQuery('SELECT id, title, status, is_public FROM events');
    console.log('📊 Total events:', allEvents.data.length);
    
    allEvents.data.forEach(event => {
      console.log(`  ${event.id}: "${event.title}" - status: ${event.status}, public: ${event.is_public}`);
    });
    
    // Update all events to be published and public
    console.log('\n🔧 Setting all events to published and public...');
    const updateResult = await executeQuery('UPDATE events SET status = ?, is_public = ?', ['published', 1]);
    console.log('✅ Updated rows:', updateResult.data.affectedRows || updateResult.data.changedRows || 'unknown');
    
    // Verify the update
    console.log('\n✅ Verification - events that should appear in browse:');
    const publishedEvents = await executeQuery(`
      SELECT e.id, e.title, e.status, e.is_public, u.name as organizer_name
      FROM events e 
      LEFT JOIN users u ON e.organizer_id = u.id 
      WHERE e.status = 'published' AND e.is_public = 1
    `);
    
    publishedEvents.data.forEach(event => {
      console.log(`  ✓ ${event.id}: "${event.title}" by ${event.organizer_name || 'Unknown'}`);
    });
    
    console.log('\n🎯 Total published events:', publishedEvents.data.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAndFixEvents(); 