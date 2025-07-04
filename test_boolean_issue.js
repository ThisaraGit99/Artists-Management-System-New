const { executeQuery } = require('./backend/config/database');

async function testBooleanIssue() {
  try {
    console.log(' Testing boolean vs numeric in MySQL');
    
    const test1 = await executeQuery(
      'SELECT COUNT(*) as count FROM events WHERE is_public = true',
      []
    );
    console.log('Boolean true result:', test1.success ? test1.data[0].count : 'ERROR - ' + test1.error);
    
    const test2 = await executeQuery(
      'SELECT COUNT(*) as count FROM events WHERE is_public = 1',
      []
    );
    console.log('Numeric 1 result:', test2.success ? test2.data[0].count : 'ERROR - ' + test2.error);
    
    const test3 = await executeQuery(
      'SELECT id, title, is_public FROM events LIMIT 3',
      []
    );
    if (test3.success) {
      test3.data.forEach(event => {
        console.log(\Event \: is_public = \ (type: \)\);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBooleanIssue();
