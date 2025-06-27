const express = require('express');
const router = express.Router();
const eventApplicationController = require('../controllers/eventApplicationController');
const { authenticateToken, requireArtist, requireOrganizer, authorizeRoles } = require('../middlewares/auth');

// Artist routes
// Apply to an event (POST /event-applications/apply/:eventId)
router.post('/apply/:eventId', authenticateToken, requireArtist, eventApplicationController.applyToEvent);

// Get artist's applications (GET /event-applications/my-applications)
router.get('/my-applications', authenticateToken, requireArtist, eventApplicationController.getMyApplications);

// Get application details (GET /event-applications/:applicationId)
router.get('/:applicationId', authenticateToken, eventApplicationController.getApplicationDetails);

// Cancel application (DELETE /event-applications/:applicationId)
router.delete('/:applicationId', authenticateToken, requireArtist, eventApplicationController.cancelApplication);

// Organizer routes
// Organizer views applications for their event
router.get('/:eventId/applications', authenticateToken, requireOrganizer, eventApplicationController.getEventApplications);

// Organizer approves an application
router.post('/:eventId/applications/:applicationId/approve', authenticateToken, requireOrganizer, eventApplicationController.approveApplication);

// Organizer rejects an application
router.post('/:eventId/applications/:applicationId/reject', authenticateToken, requireOrganizer, eventApplicationController.rejectApplication);

// Admin routes (commented out for now)
// router.get('/admin/all', authenticateToken, authorizeRoles('admin'), eventApplicationController.getAllApplications);

module.exports = router;
