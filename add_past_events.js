const mysql = require('mysql2/promise');

async function addPastEvents() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'artists_management'
        });

        console.log('📅 Adding past events for testing the "Upcoming Only" toggle...\n');

        const pastEvents = [
            {
                title: 'New Year Celebration 2024',
                description: 'Epic New Year party with fireworks and live music',
                event_type: 'Concert',
                event_date: '2024-01-01',
                start_time: '20:00:00',
                end_time: '02:00:00',
                venue_name: 'Downtown Plaza',
                venue_city: 'New York',
                venue_state: 'NY',
                budget_min: 3000,
                budget_max: 5000,
                organizer_id: 2
            },
            {
                title: 'Valentine\'s Day Romantic Evening',
                description: 'Intimate acoustic performance for couples',
                event_type: 'Wedding',
                event_date: '2024-02-14',
                start_time: '18:00:00',
                end_time: '22:00:00',
                venue_name: 'Rose Garden Restaurant',
                venue_city: 'Los Angeles',
                venue_state: 'CA',
                budget_min: 1500,
                budget_max: 2500,
                organizer_id: 2
            },
            {
                title: 'Spring Music Festival',
                description: 'Outdoor music festival celebrating spring',
                event_type: 'Festival',
                event_date: '2024-03-20',
                start_time: '12:00:00',
                end_time: '23:00:00',
                venue_name: 'Central Park',
                venue_city: 'Chicago',
                venue_state: 'IL',
                budget_min: 8000,
                budget_max: 12000,
                organizer_id: 2
            },
            {
                title: 'Summer Solstice Concert',
                description: 'Longest day celebration with live bands',
                event_type: 'Concert',
                event_date: '2024-06-21',
                start_time: '16:00:00',
                end_time: '24:00:00',
                venue_name: 'Beachfront Amphitheater',
                venue_city: 'Miami',
                venue_state: 'FL',
                budget_min: 5000,
                budget_max: 8000,
                organizer_id: 2
            },
            {
                title: 'Halloween Spooky Party',
                description: 'Costume party with themed entertainment',
                event_type: 'Party',
                event_date: '2024-10-31',
                start_time: '19:00:00',
                end_time: '01:00:00',
                venue_name: 'Haunted Mansion Venue',
                venue_city: 'Salem',
                venue_state: 'MA',
                budget_min: 2000,
                budget_max: 4000,
                organizer_id: 2
            },
            {
                title: 'Thanksgiving Gratitude Gala',
                description: 'Elegant dinner with live acoustic music',
                event_type: 'Corporate',
                event_date: '2024-11-28',
                start_time: '17:00:00',
                end_time: '22:00:00',
                venue_name: 'Grand Ballroom',
                venue_city: 'Boston',
                venue_state: 'MA',
                budget_min: 3500,
                budget_max: 6000,
                organizer_id: 2
            }
        ];

        for (const event of pastEvents) {
            const query = `
                INSERT INTO events (
                    title, description, event_type, event_date, start_time, end_time,
                    venue_name, venue_city, venue_state, budget_min, budget_max,
                    organizer_id, status, is_public, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, NOW(), NOW())
            `;

            const values = [
                event.title, event.description, event.event_type, event.event_date,
                event.start_time, event.end_time, event.venue_name, event.venue_city,
                event.venue_state, event.budget_min, event.budget_max, event.organizer_id
            ];

            await db.execute(query, values);
            console.log(`✅ Added: ${event.title} (${event.event_date})`);
        }

        console.log(`\n🎉 Successfully added ${pastEvents.length} past events!`);
        console.log('🔍 Now the "Upcoming Only" toggle should work properly:');
        console.log('   - ON: Show only upcoming events (2025 dates)');
        console.log('   - OFF: Show all events (both past 2024 and upcoming 2025)');

        await db.end();

    } catch (error) {
        console.error('❌ Error adding past events:', error.message);
    }
}

addPastEvents(); 