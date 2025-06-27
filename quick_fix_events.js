const mysql = require('mysql2/promise');

async function quickFix() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'artists_management'
    });

    console.log('🔄 Setting all events to published...');
    const updateResult = await connection.execute(
      'UPDATE events SET status = ?, is_public = ?',
      ['published', 1]
    );
    console.log('✅ Updated:', updateResult[0].changedRows, 'events');

    console.log('📋 Current events:');
    const [events] = await connection.execute(
      'SELECT id, title, status, is_public FROM events LIMIT 5'
    );
    console.table(events);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickFix(); 