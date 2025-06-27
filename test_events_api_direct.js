const http = require('http');

// Test the exact API call that's failing
function testEventsAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/events/browse/all?status=published',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',  // You'll need a real token
      'Content-Type': 'application/json'
    }
  };

  console.log('🔍 Testing API call: GET http://localhost:5000/api/events/browse/all?status=published');

  const req = http.request(options, (res) => {
    console.log('📊 Response status:', res.statusCode);
    console.log('📊 Response headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Response body:', data);
      
      try {
        const parsedData = JSON.parse(data);
        console.log('✅ Parsed response:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log('❌ Failed to parse response as JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.end();
}

// Test if server is running
function testServerHealth() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  };

  console.log('🔍 Testing server health...');

  const req = http.request(options, (res) => {
    console.log('✅ Server is running on port 5000, status:', res.statusCode);
    
    // If server is healthy, test the events API
    if (res.statusCode === 200) {
      setTimeout(() => {
        testEventsAPI();
      }, 1000);
    }
  });

  req.on('error', (error) => {
    console.error('❌ Server not running or health check failed:', error.message);
  });

  req.end();
}

testServerHealth(); 