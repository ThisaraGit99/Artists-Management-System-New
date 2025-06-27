const { executeQuery } = require('./backend/config/database');

async function debugSimpleQuery() {
  try {
    console.log('🔍 Testing simple database queries...\n');
    
    // Test 1: Simple query without parameters
    console.log('1. Testing simple SELECT...');
    const simpleResult = await executeQuery('SELECT COUNT(*) as total FROM events');
    console.log('   Result:', simpleResult.success ? `${simpleResult.data[0].total} events total` : simpleResult.error);
    
    // Test 2: Query with one parameter
    console.log('\n2. Testing with status parameter...');
    const statusResult = await executeQuery('SELECT COUNT(*) as total FROM events WHERE status = ?', ['published']);
    console.log('   Result:', statusResult.success ? `${statusResult.data[0].total} published events` : statusResult.error);
    
    // Test 3: Query with is_public parameter  
    console.log('\n3. Testing with is_public parameter...');
    const publicResult = await executeQuery('SELECT COUNT(*) as total FROM events WHERE is_public = ?', [1]);
    console.log('   Result:', publicResult.success ? `${publicResult.data[0].total} public events` : publicResult.error);
    
    // Test 4: Query with both conditions
    console.log('\n4. Testing with both conditions...');
    const bothResult = await executeQuery('SELECT COUNT(*) as total FROM events WHERE status = ? AND is_public = ?', ['published', 1]);
    console.log('   Result:', bothResult.success ? `${bothResult.data[0].total} published public events` : bothResult.error);
    
    // Test 5: Test the problematic query with fewer parameters
    console.log('\n5. Testing SELECT with basic conditions...');
    const selectResult = await executeQuery(`
      SELECT e.id, e.title, e.status, e.is_public 
      FROM events e 
      WHERE e.status = ? AND e.is_public = ?
      LIMIT 5
    `, ['published', 1]);
    
    if (selectResult.success) {
      console.log(`   ✅ Found ${selectResult.data.length} events:`);
      selectResult.data.forEach(event => {
        console.log(`      - ${event.id}: "${event.title}" (status: ${event.status}, public: ${event.is_public})`);
      });
    } else {
      console.log(`   ❌ Error:`, selectResult.error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugSimpleQuery(); 