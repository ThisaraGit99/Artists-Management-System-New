const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const { authenticateToken, requireOrganizer, authorizeRoles } = require('../middlewares/auth');
const { requireOrganizerVerification } = require('../middlewares/verification');

// Booking management routes for organizers (REQUIRE VERIFICATION)
router.post('/bookings', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.createBooking);
router.get('/bookings', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.getOrganizerBookings);
router.get('/bookings/:bookingId', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.getBookingDetails);
router.put('/bookings/:bookingId/cancel', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.cancelBooking);

// Payment management
router.post('/bookings/:bookingId/payment', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.makePayment);
router.get('/bookings/:bookingId/payment', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.getPaymentDetails);
router.post('/bookings/:bookingId/complete', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.markEventCompleted);
router.post('/bookings/:bookingId/dispute', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.disputePayment);

// Organizer profile routes (Profile editing requires verification)
router.get('/profile', authenticateToken, requireOrganizer, organizerController.getProfile);
router.put('/profile', authenticateToken, requireOrganizer, requireOrganizerVerification, organizerController.updateProfile);

// Organizer dashboard stats (No verification required - users need to see verification status)
router.get('/dashboard/stats', authenticateToken, requireOrganizer, organizerController.getDashboardStats);

// Debug endpoint
router.get('/debug', authenticateToken, requireOrganizer, organizerController.debugBookings);

// Rating routes
router.post('/ratings', authenticateToken, requireOrganizer, organizerController.submitArtistRating);
router.get('/ratings', authenticateToken, requireOrganizer, organizerController.getSubmittedRatings);
router.put('/ratings/:rating_id', authenticateToken, requireOrganizer, organizerController.updateArtistRating);
router.get('/ratings/:bookingId', authenticateToken, requireOrganizer, organizerController.getBookingRating);
router.get('/artists/:artist_id/ratings', organizerController.getArtistRatings); // Public endpoint

module.exports = router; 