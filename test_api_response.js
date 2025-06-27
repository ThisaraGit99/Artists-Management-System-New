const axios = require('axios');

async function testAPIResponse() {
    console.log('🔍 Testing API Response Format...\n');
    
    try {
        // Test the browse events API
        const response = await axios.get('http://localhost:5000/api/events/browse', {
            params: {
                status: 'published',
                limit: 3
            },
            headers: {
                'Authorization': 'Bearer dummy-token' // This might not be needed for browse
            }
        });
        
        console.log('📊 API Response Status:', response.status);
        console.log('📋 API Response Data Structure:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success && response.data.data.length > 0) {
            console.log('\n🔍 First Event Analysis:');
            const firstEvent = response.data.data[0];
            
            console.log('Event object keys:', Object.keys(firstEvent));
            console.log('Has date field:', 'date' in firstEvent);
            console.log('Has event_date field:', 'event_date' in firstEvent);
            console.log('Date value:', firstEvent.date);
            console.log('Event_date value:', firstEvent.event_date);
            
            if (firstEvent.date) {
                const eventDate = new Date(firstEvent.date);
                const now = new Date();
                console.log('Date parsing test:');
                console.log('  Parsed date:', eventDate);
                console.log('  Is valid:', !isNaN(eventDate.getTime()));
                console.log('  Is upcoming:', eventDate >= now);
                console.log('  Days difference:', Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)));
            }
        }
        
    } catch (error) {
        console.error('❌ API Test Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPIResponse(); 