const { executeQuery } = require('./backend/config/database');

async function quickTest() {
  try {
    console.log('🔍 Quick Debug Test for Events Endpoint');
    
    // Check published + public events count
    const bothCount = await executeQuery(
      'SELECT COUNT(*) as total FROM events WHERE status = "published" AND is_public = 1'
    );
    console.log('📊 Published + Public events:', bothCount.data[0].total);
    
    // Test the exact query pattern from controller with boolean conversion
    const testQuery1 = await executeQuery(
      'SELECT e.id, e.title FROM events e WHERE e.is_public = true AND e.status = ? LIMIT 5',
      ['published']
    );
    console.log('✅ Query with is_public = true:', testQuery1.success, testQuery1.data?.length || 0);
    if (!testQuery1.success) console.error('❌ Error:', testQuery1.error);
    
    // Test with numeric 1 instead of boolean true
    const testQuery2 = await executeQuery(
      'SELECT e.id, e.title FROM events e WHERE e.is_public = 1 AND e.status = ? LIMIT 5',
      ['published']
    );
    console.log('✅ Query with is_public = 1:', testQuery2.success, testQuery2.data?.length || 0);
    if (!testQuery2.success) console.error('❌ Error:', testQuery2.error);
    
    // Show sample data
    if (testQuery2.success && testQuery2.data.length > 0) {
      console.log('📋 Sample events:');
      testQuery2.data.forEach(event => {
        console.log(`   ID ${event.id}: "${event.title}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Critical Error:', error.message);
  }
}

quickTest(); 