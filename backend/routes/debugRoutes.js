const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Debug endpoint - check events without any auth
router.get('/events-count', async (req, res) => {
  try {
    const result = await executeQuery('SELECT COUNT(*) as total FROM events');
    res.json({
      success: true,
      total_events: result.data[0].total,
      message: 'Direct database query - no auth required'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint - get events directly from database
router.get('/events-raw', async (req, res) => {
  try {
    const result = await executeQuery('SELECT id, title, status, is_public FROM events LIMIT 10');
    res.json({
      success: true,
      events: result.data,
      message: 'Raw events from database - no auth required'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint - simulate the exact browseEvents query
router.get('/events-browse-test', async (req, res) => {
  try {
    const query = `
      SELECT e.id, e.title as name, e.description, e.event_type, e.event_date as date, e.start_time,
             e.end_time, e.venue_name as location, e.venue_city, e.venue_state, e.venue_country,
             e.budget_min, e.budget_max, e.currency, e.requirements,
             u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.is_public = 1 AND e.status = 'published'
      ORDER BY e.event_date ASC
      LIMIT 10
    `;
    
    const result = await executeQuery(query);
    res.json({
      success: true,
      data: result.data,
      count: result.data.length,
      message: 'Simulated browseEvents query - no auth required'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 