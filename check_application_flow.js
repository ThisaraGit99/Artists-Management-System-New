// Check Application Flow Components
console.log('🔍 CHECKING APPLICATION FLOW STEP BY STEP\n');

// 1. Check if required files exist
const fs = require('fs');

console.log('1️⃣ FILE STRUCTURE CHECK');
console.log('=' .repeat(30));

const requiredFiles = [
  'database/event_applications_schema.sql',
  'backend/controllers/eventApplicationController.js',
  'backend/routes/eventApplicationRoutes.js',
  'frontend/src/services/eventApplicationService.js'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Check if routes are properly imported in server.js
console.log('\n2️⃣ ROUTES CONFIGURATION');
console.log('=' .repeat(30));

try {
  const serverContent = fs.readFileSync('backend/server.js', 'utf8');
  const hasEventAppRoutes = serverContent.includes('eventApplicationRoutes');
  const hasRouteMount = serverContent.includes('/api/event-applications');
  
  console.log(`${hasEventAppRoutes ? '✅' : '❌'} eventApplicationRoutes imported`);
  console.log(`${hasRouteMount ? '✅' : '❌'} /api/event-applications route mounted`);
} catch (error) {
  console.log('❌ Could not read server.js');
}

// 3. Check database schema
console.log('\n3️⃣ DATABASE SCHEMA CHECK');
console.log('=' .repeat(30));

const { executeQuery } = require('./backend/config/database');

executeQuery('SHOW TABLES LIKE "event_applications"')
  .then(result => {
    if (result.data.length > 0) {
      console.log('✅ event_applications table exists');
      
      // Check table structure
      return executeQuery('DESCRIBE event_applications');
    } else {
      console.log('❌ event_applications table MISSING');
      console.log('💡 Need to run: node setup_event_applications.js');
      return null;
    }
  })
  .then(schema => {
    if (schema) {
      console.log('📋 Table structure:');
      schema.data.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
    }
    
    // Check if events table has application columns
    return executeQuery('DESCRIBE events');
  })
  .then(eventsSchema => {
    const hasAppCol = eventsSchema.data.some(col => col.Field === 'total_applications');
    console.log(`${hasAppCol ? '✅' : '❌'} events.total_applications column`);
    
    // Test API endpoints
    console.log('\n4️⃣ API ENDPOINTS TEST');
    console.log('=' .repeat(30));
    
    const axios = require('axios');
    return axios.get('http://localhost:5000/health');
  })
  .then(healthResponse => {
    console.log(`✅ Backend server running (${healthResponse.status})`);
    
    // Test event applications endpoint (should return 401 without auth)
    const axios = require('axios');
    return axios.get('http://localhost:5000/api/event-applications/my-applications')
      .catch(error => error.response);
  })
  .then(response => {
    if (response && response.status === 401) {
      console.log('✅ /api/event-applications/my-applications endpoint exists (401 expected)');
    } else {
      console.log('❌ /api/event-applications/my-applications endpoint issue');
    }
    
    console.log('\n5️⃣ SUMMARY');
    console.log('=' .repeat(30));
    console.log('✅ Events browsing works');
    console.log('❓ Application flow needs verification');
    console.log('💡 Try clicking Apply button in frontend to test full flow');
  })
  .catch(error => {
    console.log('❌ Error during check:', error.message);
  }); 