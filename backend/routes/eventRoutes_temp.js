const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, requireOrganizer, authorizeRoles } = require('../middlewares/auth');

// Event CRUD routes for organizers
router.get('/', authenticateToken, requireOrganizer, eventController.getOrganizerEvents);
router.post('/', authenticateToken, requireOrganizer, eventController.createEvent);
router.get('/:eventId', authenticateToken, authorizeRoles('organizer', 'admin'), eventController.getEventDetails);
router.put('/:eventId', authenticateToken, requireOrganizer, eventController.updateEvent);
router.delete('/:eventId', authenticateToken, requireOrganizer, eventController.deleteEvent);

// TEMPORARY: Public routes for artists to browse events (NO AUTH for testing)
router.get('/browse/all', eventController.browseEvents);  // <-- REMOVED AUTH
router.get('/browse/:eventId', eventController.getPublicEventDetails);  // <-- REMOVED AUTH

// Event statistics
router.get('/:eventId/stats', authenticateToken, requireOrganizer, eventController.getEventStats);

module.exports = router; 