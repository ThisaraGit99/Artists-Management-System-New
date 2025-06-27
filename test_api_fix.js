const axios = require('axios');

async function testAPIFix() {
    console.log('🧪 Testing API Fix for Upcoming Events Filter...\n');
    
    try {
        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📡 Testing public browse events API...');
        const response = await axios.get('http://localhost:5000/api/events/browse/all', {
            params: {
                status: 'published',
                limit: 5
            }
        });
        
        console.log('✅ API Response Status:', response.status);
        
        if (response.data.success && response.data.data.length > 0) {
            console.log(`📊 Found ${response.data.data.length} events\n`);
            
            const now = new Date();
            console.log(`🕐 Current time: ${now.toISOString()}\n`);
            
            console.log('🔍 Testing each event:');
            response.data.data.forEach((event, index) => {
                console.log(`${index + 1}. ${event.name}:`);
                console.log(`   📅 Date field: ${event.date}`);
                console.log(`   📅 Event_date field: ${event.event_date || 'undefined'}`);
                
                if (event.date) {
                    const eventDate = new Date(event.date);
                    const isUpcoming = eventDate >= now;
                    const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
                    
                    console.log(`   🎯 Event Date: ${eventDate.toISOString()}`);
                    console.log(`   🔮 Is Upcoming: ${isUpcoming}`);
                    console.log(`   📈 Days Away: ${daysDiff}`);
                    console.log(`   ✨ Filter Result: ${isUpcoming ? 'SHOW' : 'HIDE'}`);
                } else {
                    console.log(`   ❌ No date field found!`);
                }
                console.log('');
            });
            
            // Test the filter logic
            const upcomingEvents = response.data.data.filter(event => {
                if (!event.date) return false;
                const eventDate = new Date(event.date);
                return eventDate >= now;
            });
            
            console.log('📈 Filter Test Results:');
            console.log(`   📋 Total events: ${response.data.data.length}`);
            console.log(`   🔜 Upcoming events: ${upcomingEvents.length}`);
            console.log(`   📅 Past events: ${response.data.data.length - upcomingEvents.length}`);
            
            if (upcomingEvents.length > 0) {
                console.log('\n✅ SUCCESS! Upcoming events filter should now work');
                console.log('🎉 The frontend "Upcoming Only" toggle will show these events:');
                upcomingEvents.forEach(event => {
                    console.log(`   - ${event.name} (${event.date})`);
                });
            } else {
                console.log('\n⚠️ No upcoming events found - all events are in the past');
            }
            
        } else {
            console.log('❌ No events found in API response');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPIFix(); 