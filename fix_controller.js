const fs = require('fs');

console.log('🔧 Fixing eventController mapping issue...');

// Read the file
let content = fs.readFileSync('backend/controllers/eventController.js', 'utf8');

// Replace the problematic lines
content = content.replace(
    'name: event.title,  // Map title to name for frontend',
    '// name already aliased in SQL as "name"'
);

content = content.replace(
    'date: event.event_date,  // Map event_date to date',
    '// date already aliased in SQL as "date"'
);

content = content.replace(
    'location: event.venue_name,  // Map venue_name to location',
    '// location already aliased in SQL as "location"'
);

// Write the file back
fs.writeFileSync('backend/controllers/eventController.js', content);

console.log('✅ Fixed eventController.js');
console.log('🎯 Removed conflicting field mappings');
console.log('📋 SQL aliases will now work correctly'); 