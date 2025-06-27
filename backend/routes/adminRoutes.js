const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// Dashboard Statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, adminController.getDashboardStats);

// User Management Routes
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.get('/users/:userId', authenticateToken, requireAdmin, adminController.getUserDetails);
router.put('/users/:userId', authenticateToken, requireAdmin, adminController.updateUser);
router.delete('/users/:userId', authenticateToken, requireAdmin, adminController.deleteUser);
router.put('/users/:userId/role', authenticateToken, requireAdmin, adminController.updateUserRole);
router.put('/users/:userId/status', authenticateToken, requireAdmin, adminController.updateUserStatus);

// Verification Management Routes
router.get('/verification-requests', authenticateToken, requireAdmin, adminController.getVerificationRequests);
router.put('/users/:userId/verify', authenticateToken, requireAdmin, adminController.verifyUser);

// Booking Management Routes
router.get('/bookings', authenticateToken, requireAdmin, adminController.getAllBookings);
router.get('/bookings/:bookingId', authenticateToken, requireAdmin, adminController.getBookingDetails);
router.put('/bookings/:bookingId/status', authenticateToken, requireAdmin, adminController.updateBookingStatus);
router.delete('/bookings/:bookingId', authenticateToken, requireAdmin, adminController.deleteBooking);

// Payment Management Routes
router.post('/bookings/:bookingId/release-payment', authenticateToken, requireAdmin, adminController.releasePayment);
router.post('/bookings/:bookingId/refund', authenticateToken, requireAdmin, adminController.processRefund);

// Dispute Resolution Routes
router.post('/bookings/:bookingId/resolve-dispute', authenticateToken, requireAdmin, adminController.resolveDispute);

// Messaging Routes
router.post('/bookings/:bookingId/send-message', authenticateToken, requireAdmin, adminController.sendBookingMessage);

// Event Management Routes (Admin)
router.get('/events', authenticateToken, requireAdmin, adminController.getAllEvents);
router.get('/events/:eventId', authenticateToken, requireAdmin, adminController.getEventDetails);
router.put('/events/:eventId/status', authenticateToken, requireAdmin, adminController.updateEventStatus);
router.delete('/events/:eventId', authenticateToken, requireAdmin, adminController.deleteEvent);

// Analytics Routes
router.get('/analytics/overview', authenticateToken, requireAdmin, adminController.getAnalyticsOverview);
router.get('/analytics/revenue', authenticateToken, requireAdmin, adminController.getRevenueAnalytics);
router.get('/analytics/users', authenticateToken, requireAdmin, adminController.getUserAnalytics);

// System Settings Routes
router.get('/settings', authenticateToken, requireAdmin, adminController.getSystemSettings);
router.put('/settings', authenticateToken, requireAdmin, adminController.updateSystemSettings);

module.exports = router; 