const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Organizer routes
router.post('/bookings/:bookingId/report-non-delivery', 
  authenticateToken, 
  authorizeRoles('organizer'), 
  disputeController.reportNonDelivery
);

// Artist routes
router.post('/disputes/:disputeId/respond', 
  authenticateToken, 
  authorizeRoles('artist'), 
  disputeController.respondToDispute
);

// Cancellation routes (both organizer and artist)
router.post('/bookings/:bookingId/cancel', 
  authenticateToken, 
  authorizeRoles('organizer', 'artist'), 
  disputeController.requestCancellation
);

// Admin routes
router.get('/admin/disputes', 
  authenticateToken, 
  authorizeRoles('admin'), 
  disputeController.getDisputes
);

router.post('/admin/disputes/:disputeId/resolve', 
  authenticateToken, 
  authorizeRoles('admin'), 
  disputeController.adminResolveDispute
);

module.exports = router; 