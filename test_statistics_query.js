const mysql = require('mysql2/promise');

// Test query with application statistics
const testQuery = async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'artist_management'
    });

    const query = `
      SELECT e.*,
             COALESCE(COUNT(ea.id), 0) as total_applications,
             COALESCE(COUNT(CASE WHEN ea.application_status = 'pending' THEN 1 END), 0) as pending_applications,
             COALESCE(COUNT(CASE WHEN ea.application_status = 'approved' THEN 1 END), 0) as approved_applications,
             COALESCE(COUNT(CASE WHEN ea.application_status = 'rejected' THEN 1 END), 0) as rejected_applications
      FROM events e
      LEFT JOIN event_applications ea ON e.id = ea.event_id
      WHERE e.organizer_id = 2
      GROUP BY e.id
      ORDER BY e.event_date DESC
      LIMIT 5
    `;

    const [rows] = await connection.execute(query);
    console.log('Query results with statistics:');
    rows.forEach(row => {
      console.log(`Event: ${row.title}`);
      console.log(`  Total: ${row.total_applications}`);
      console.log(`  Pending: ${row.pending_applications}`);
      console.log(`  Approved: ${row.approved_applications}`);
      console.log(`  Rejected: ${row.rejected_applications}`);
      console.log('---');
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testQuery();
