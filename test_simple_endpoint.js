const http = require('http');

// Test the health endpoint and a simple events call
function testEndpoints() {
  console.log('🔍 Testing multiple endpoints...\n');

  // Test 1: Health check
  testEndpoint('/health', 'Health Check');
  
  // Test 2: Test endpoint (if it exists)
  setTimeout(() => testEndpoint('/api/events/test', 'Test Endpoint'), 1000);
  
  // Test 3: Events browse without auth header
  setTimeout(() => testEndpoint('/api/events/browse/all?status=published', 'Events Browse (no auth header)'), 2000);
}

function testEndpoint(path, name) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
    // No Authorization header
  };

  console.log(`🔍 Testing ${name}: GET http://localhost:5000${path}`);

  const req = http.request(options, (res) => {
    console.log(`📊 ${name} - Status:`, res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log(`✅ ${name} - Response:`, parsedData);
      } catch (e) {
        console.log(`📄 ${name} - Raw response:`, data.substring(0, 200));
      }
      console.log('');
    });
  });

  req.on('error', (error) => {
    console.error(`❌ ${name} - Error:`, error.message);
  });

  req.end();
}

testEndpoints(); 