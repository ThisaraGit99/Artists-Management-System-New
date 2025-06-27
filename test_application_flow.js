const { executeQuery } = require('./backend/config/database');
const axios = require('axios');

async function checkApplicationFlow() {
  console.log('🔍 COMPREHENSIVE APPLICATION FLOW CHECK\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Check Database Tables
    console.log('\n1️⃣ DATABASE STRUCTURE CHECK');
    console.log('-'.repeat(30));
    
    // Check event_applications table
    const tables = await executeQuery("SHOW TABLES LIKE 'event_applications'");
    console.log('✅ event_applications table exists:', tables.data.length > 0 ? 'YES' : 'NO ❌');
    
    if (tables.data.length > 0) {
      const schema = await executeQuery('DESCRIBE event_applications');
      console.log('   Table structure:');
      schema.data.forEach(col => {
        console.log(`     - ${col.Field} (${col.Type})`);
      });
    } else {
      console.log('❌ MISSING: event_applications table not found!');
    }
    
    // Check if events table has application columns
    const eventsSchema = await executeQuery('DESCRIBE events');
    const hasAppCols = eventsSchema.data.some(col => col.Field === 'total_applications');
    console.log('✅ events.total_applications column:', hasAppCols ? 'EXISTS' : 'MISSING ❌');
    
    // Check artists table
    const artistsTable = await executeQuery("SHOW TABLES LIKE 'artists'");
    console.log('✅ artists table exists:', artistsTable.data.length > 0 ? 'YES' : 'NO ❌');
    
    // 2. Check Backend Controllers
    console.log('\n2️⃣ BACKEND CONTROLLERS CHECK');
    console.log('-'.repeat(30));
    
    try {
      const eventAppController = require('./backend/controllers/eventApplicationController');
      console.log('✅ eventApplicationController exists');
      console.log('   Methods available:');
      console.log('     - applyToEvent:', typeof eventAppController.applyToEvent === 'function' ? '✅' : '❌');
      console.log('     - getMyApplications:', typeof eventAppController.getMyApplications === 'function' ? '✅' : '❌');
      console.log('     - getEventApplications:', typeof eventAppController.getEventApplications === 'function' ? '✅' : '❌');
      console.log('     - approveApplication:', typeof eventAppController.approveApplication === 'function' ? '✅' : '❌');
      console.log('     - rejectApplication:', typeof eventAppController.rejectApplication === 'function' ? '✅' : '❌');
    } catch (error) {
      console.log('❌ eventApplicationController not found or has errors');
    }
    
    // 3. Check Routes
    console.log('\n3️⃣ BACKEND ROUTES CHECK');
    console.log('-'.repeat(30));
    
    try {
      const eventAppRoutes = require('./backend/routes/eventApplicationRoutes');
      console.log('✅ eventApplicationRoutes exists');
    } catch (error) {
      console.log('❌ eventApplicationRoutes not found');
    }
    
    // 4. Check Frontend Services
    console.log('\n4️⃣ FRONTEND SERVICES CHECK');
    console.log('-'.repeat(30));
    
    try {
      const fs = require('fs');
      const eventAppServiceExists = fs.existsSync('./frontend/src/services/eventApplicationService.js');
      console.log('✅ eventApplicationService.js exists:', eventAppServiceExists ? 'YES' : 'NO ❌');
      
      if (eventAppServiceExists) {
        const serviceContent = fs.readFileSync('./frontend/src/services/eventApplicationService.js', 'utf8');
        console.log('   Methods found in service:');
        console.log('     - applyToEvent:', serviceContent.includes('applyToEvent') ? '✅' : '❌');
        console.log('     - getMyApplications:', serviceContent.includes('getMyApplications') ? '✅' : '❌');
      }
    } catch (error) {
      console.log('❌ Error checking frontend services');
    }
    
    // 5. Check if Server is Running and Routes Work
    console.log('\n5️⃣ API ENDPOINTS CHECK');
    console.log('-'.repeat(30));
    
    try {
      const healthCheck = await axios.get('http://localhost:5000/health');
      console.log('✅ Backend server running:', healthCheck.status === 200 ? 'YES' : 'NO');
      
      // Test event applications route (should return 401 without auth)
      try {
        await axios.get('http://localhost:5000/api/event-applications/my-applications');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ /api/event-applications/my-applications route exists (401 expected without auth)');
        } else {
          console.log('❌ /api/event-applications/my-applications route issue:', error.response?.status);
        }
      }
      
    } catch (error) {
      console.log('❌ Backend server not running or not accessible');
    }
    
    // 6. Check Sample Data
    console.log('\n6️⃣ SAMPLE DATA CHECK');
    console.log('-'.repeat(30));
    
    if (tables.data.length > 0) {
      const appCount = await executeQuery('SELECT COUNT(*) as count FROM event_applications');
      console.log('✅ Sample applications in DB:', appCount.data[0].count);
    }
    
    const eventsCount = await executeQuery('SELECT COUNT(*) as count FROM events WHERE status = "published"');
    console.log('✅ Published events available:', eventsCount.data[0].count);
    
    if (artistsTable.data.length > 0) {
      const artistCount = await executeQuery('SELECT COUNT(*) as count FROM artists');
      console.log('✅ Artists in system:', artistCount.data[0].count);
    }
    
    // 7. Check User Authentication Setup
    console.log('\n7️⃣ AUTHENTICATION CHECK');
    console.log('-'.repeat(30));
    
    const userCount = await executeQuery('SELECT COUNT(*) as count FROM users WHERE role = "artist"');
    console.log('✅ Artist users in system:', userCount.data[0].count);
    
    const orgCount = await executeQuery('SELECT COUNT(*) as count FROM users WHERE role = "organizer"');
    console.log('✅ Organizer users in system:', orgCount.data[0].count);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ APPLICATION FLOW CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR during flow check:', error.message);
  }
}

checkApplicationFlow(); 