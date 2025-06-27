const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const { authenticateToken, authorizeRoles, requireArtist } = require('../middlewares/auth');
const { requireArtistVerification } = require('../middlewares/verification');

// Dashboard stats
router.get('/dashboard/stats', authenticateToken, requireArtist, artistController.getDashboardStats);

// Artist profile routes
router.get('/profile', authenticateToken, requireArtist, artistController.getProfile);
router.put('/profile', authenticateToken, requireArtist, requireArtistVerification, artistController.updateProfile);
router.post('/profile/complete', authenticateToken, requireArtist, artistController.completeProfile);

// Skills management
router.get('/skills', authenticateToken, requireArtist, artistController.getSkills);
router.post('/skills', authenticateToken, requireArtist, requireArtistVerification, artistController.addSkill);
router.delete('/skills/:skillId', authenticateToken, requireArtist, requireArtistVerification, artistController.removeSkill);

// Availability management
router.get('/availability', authenticateToken, requireArtist, artistController.getAvailability);
router.post('/availability', authenticateToken, requireArtist, requireArtistVerification, artistController.setAvailability);
router.put('/availability/:availabilityId', authenticateToken, requireArtist, requireArtistVerification, artistController.updateAvailability);
router.delete('/availability/:availabilityId', authenticateToken, requireArtist, requireArtistVerification, artistController.removeAvailability);

// Portfolio management (without file upload for now)
router.get('/portfolio', authenticateToken, requireArtist, artistController.getPortfolio);
router.post('/portfolio', authenticateToken, requireArtist, requireArtistVerification, artistController.addPortfolioItem);
router.put('/portfolio/:itemId', authenticateToken, requireArtist, requireArtistVerification, artistController.updatePortfolioItem);
router.delete('/portfolio/:itemId', authenticateToken, requireArtist, requireArtistVerification, artistController.removePortfolioItem);

// Package management
router.get('/packages', authenticateToken, requireArtist, artistController.getPackages);
router.post('/packages', authenticateToken, requireArtist, requireArtistVerification, artistController.addPackage);
router.put('/packages/:packageId', authenticateToken, requireArtist, requireArtistVerification, artistController.updatePackage);
router.delete('/packages/:packageId', authenticateToken, requireArtist, requireArtistVerification, artistController.deletePackage);
router.patch('/packages/:packageId/toggle', authenticateToken, requireArtist, requireArtistVerification, artistController.togglePackageStatus);

// Booking management
router.get('/bookings', authenticateToken, requireArtist, requireArtistVerification, artistController.getBookings);
router.get('/bookings/:bookingId', authenticateToken, requireArtist, requireArtistVerification, artistController.getBookingDetails);
router.post('/bookings/:bookingId/respond', authenticateToken, requireArtist, requireArtistVerification, artistController.respondToBooking);
router.put('/bookings/:bookingId/status', authenticateToken, requireArtist, requireArtistVerification, artistController.updateBookingStatus);

// Public routes for organizers to browse artists
router.get('/browse', authenticateToken, authorizeRoles('organizer', 'admin'), artistController.browseArtists);
router.get('/browse/:artistId', authenticateToken, authorizeRoles('organizer', 'admin'), artistController.getArtistDetails);

// Rating routes
router.get('/ratings/:artistId?', authenticateToken, authorizeRoles('artist', 'organizer'), artistController.getArtistRatings);
router.get('/ratings/:artistId/brief', authenticateToken, authorizeRoles('artist', 'organizer'), artistController.getArtistRatingBrief);
router.post('/reviews/:reviewId/vote', authenticateToken, authorizeRoles('artist', 'organizer'), artistController.handleReviewVote);

module.exports = router; 