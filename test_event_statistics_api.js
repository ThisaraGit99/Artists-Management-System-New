// Test event statistics API directly
const fetch = require('node-fetch');

async function testEventStatistics() {
  try {
    // Test the get event applications endpoint
    const response = await fetch('http://localhost:5000/api/event-applications/event/1/applications?status=all', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.applications) {
      const stats = {
        total: data.applications.length,
        pending: data.applications.filter(app => app.application_status === 'pending').length,
        approved: data.applications.filter(app => app.application_status === 'approved').length,
        rejected: data.applications.filter(app => app.application_status === 'rejected').length
      };
      console.log('Calculated Statistics:', stats);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEventStatistics();
