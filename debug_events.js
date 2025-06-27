const { executeQuery } = require('./backend/config/database');

async function checkEvents() {
  try {
    console.log('Checking published events...');
    const result = await executeQuery('SELECT * FROM events WHERE status = "published" LIMIT 1');
    
    if (result.data.length > 0) {
      console.log('Event fields:', Object.keys(result.data[0]));
      console.log('Sample event:', JSON.stringify(result.data[0], null, 2));
    } else {
      console.log('No published events found');
      
      // Check what events exist with any status
      const allEvents = await executeQuery('SELECT id, title, status FROM events LIMIT 5');
      console.log('All events:', allEvents.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEvents(); 