const mysql = require('mysql2/promise');

async function addPastEvents() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'artists_management'
    });

    const pastEvents = [
        ['New Year 2024 Party', 'Past party for testing', 'Party', '2024-01-01', '20:00:00', '02:00:00', 'Plaza', 'NYC', 'NY', 3000, 5000, 2],
        ['Halloween 2024', 'Past spooky event', 'Party', '2024-10-31', '19:00:00', '01:00:00', 'Mansion', 'Salem', 'MA', 2000, 4000, 2],
        ['Summer 2024 Festival', 'Past music festival', 'Festival', '2024-07-15', '14:00:00', '23:00:00', 'Park', 'Chicago', 'IL', 8000, 12000, 2]
    ];

    for (const event of pastEvents) {
        await db.execute(`
            INSERT INTO events (title, description, event_type, event_date, start_time, end_time, venue_name, venue_city, venue_state, budget_min, budget_max, organizer_id, status, is_public, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, NOW(), NOW())
        `, event);
        console.log(`Added: ${event[0]}`);
    }
    
    console.log('✅ Past events added successfully!');
    await db.end();
}

addPastEvents().catch(console.error); 