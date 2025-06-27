-- Adding past events to test the "Upcoming Only" toggle functionality

INSERT INTO events (
    title, description, event_type, event_date, start_time, end_time,
    venue_name, venue_city, venue_state, budget_min, budget_max,
    organizer_id, status, is_public, created_at, updated_at
) VALUES 
(
    'New Year 2024 Celebration',
    'Big New Year party - past event for testing toggle',
    'Party',
    '2024-01-01',
    '20:00:00',
    '02:00:00',
    'Downtown Plaza',
    'New York',
    'NY',
    3000,
    5000,
    2,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'Halloween 2024 Spooky Night',
    'Halloween costume party - past event for testing',
    'Party',
    '2024-10-31',
    '19:00:00',
    '01:00:00',
    'Haunted Mansion',
    'Salem',
    'MA',
    2000,
    4000,
    2,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'Summer 2024 Music Festival',
    'Outdoor music festival from last summer',
    'Festival',
    '2024-07-15',
    '14:00:00',
    '23:00:00',
    'Central Park',
    'Chicago',
    'IL',
    8000,
    12000,
    2,
    'published',
    1,
    NOW(),
    NOW()
); 