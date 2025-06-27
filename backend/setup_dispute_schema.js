const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function setupDisputeSchema() {
  try {
    console.log('🔧 Setting up dispute and cancellation schema...');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'dispute_cancellation_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 80).replace(/\n/g, ' ') + '...');
        } catch (error) {
          // Skip if table/column already exists
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Already exists:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Dispute and cancellation schema setup complete!');
    
    // Test the tables
    const [disputes] = await pool.execute('SELECT COUNT(*) as count FROM disputes');
    const [cancellations] = await pool.execute('SELECT COUNT(*) as count FROM cancellation_requests');
    const [notifications] = await pool.execute('SELECT COUNT(*) as count FROM notifications');
    const [tasks] = await pool.execute('SELECT COUNT(*) as count FROM automated_tasks');
    
    console.log('📊 Table Status:');
    console.log(`   - Disputes: ${disputes[0].count} records`);
    console.log(`   - Cancellation Requests: ${cancellations[0].count} records`);
    console.log(`   - Notifications: ${notifications[0].count} records`);
    console.log(`   - Automated Tasks: ${tasks[0].count} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    process.exit(1);
  }
}

setupDisputeSchema(); 