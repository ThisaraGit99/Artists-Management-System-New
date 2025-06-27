const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Event routes working! Auth removed for testing.', 
    timestamp: new Date().toISOString() 
  });
});

// BROWSE EVENTS - NO AUTHENTICATION REQUIRED
router.get('/browse/all', (req, res) => {
  console.log('📍 Browse events endpoint called');
  eventController.browseEvents(req, res);
});

router.get('/browse/:eventId', (req, res) => {
  console.log('📍 Browse event details endpoint called');
  eventController.getPublicEventDetails(req, res);
});

// Keep other routes with auth for now (but add the authenticated routes if needed)

module.exports = router; 