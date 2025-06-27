const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/admin/BookingManagement.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the data extraction in openDetailsModal
const oldLine = 'setBookingDetails(response.data);';
const newLine = 'setBookingDetails(response.data.booking);';

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed booking details data extraction!');
  console.log('Changed: setBookingDetails(response.data) → setBookingDetails(response.data.booking)');
} else {
  console.log('❌ Could not find the line to fix. It may already be fixed.');
}

console.log('\n🔧 The issue was:');
console.log('   Backend returns: { success: true, data: { booking: {...}, messages: [...] } }');
console.log('   Frontend was setting: bookingDetails = response.data (wrong)');
console.log('   Should be: bookingDetails = response.data.booking (correct)');
console.log('\n🚀 Now restart the frontend and try again!'); 