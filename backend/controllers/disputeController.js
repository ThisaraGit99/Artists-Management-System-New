const { pool } = require('../config/database');

const disputeController = {
  // Report Non-Delivery (by Organizer)
  reportNonDelivery: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { reason, evidence } = req.body;
      const organizerId = req.user.id;

      // Verify booking exists and organizer owns it
      const [bookings] = await pool.execute(`
        SELECT b.*, o.user_id as organizer_user_id, ar.user_id as artist_user_id
        FROM bookings b
        JOIN organizers o ON b.organizer_id = o.id
        JOIN artists ar ON b.artist_id = ar.id
        WHERE b.id = ? AND o.user_id = ?
      `, [bookingId, organizerId]);

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not authorized to report'
        });
      }

      const booking = bookings[0];

      // Create dispute record - Fixed to work with existing table structure
      const autoResolveDate = new Date();
      autoResolveDate.setDate(autoResolveDate.getDate() + 2); // 2 days from now

      const [disputeResult] = await pool.execute(`
        INSERT INTO disputes (
          booking_id, dispute_type, reporter_id, reported_by_id, reported_by,
          dispute_reason, issue_description, evidence_files, auto_resolve_date, status
        ) VALUES (?, 'non_delivery', ?, ?, 'organizer', ?, ?, ?, ?, 'open')
      `, [bookingId, organizerId, organizerId, reason, reason, JSON.stringify(evidence || []), autoResolveDate]);

      // Update booking status
      await pool.execute(
        'UPDATE bookings SET status = "not_delivered" WHERE id = ?',
        [bookingId]
      );

      // Create notification for artist
      await pool.execute(`
        INSERT INTO notifications (
          user_id, booking_id, dispute_id, notification_type, 
          title, message
        ) VALUES (?, ?, ?, 'dispute_response_required', ?, ?)
      `, [
        booking.artist_user_id,
        bookingId,
        disputeResult.insertId,
        'Non-Delivery Dispute Reported',
        `A non-delivery dispute has been reported for booking #${bookingId}. You have 2 days to respond.`
      ]);

      // Schedule auto-resolution task
      try {
        await pool.execute(`
          INSERT INTO automated_tasks (
            task_type, booking_id, dispute_id, scheduled_for
          ) VALUES ('auto_resolve_dispute', ?, ?, ?)
        `, [bookingId, disputeResult.insertId, autoResolveDate]);
      } catch (taskError) {
        // If automated_tasks table doesn't exist, just log it
        console.log('Auto-resolution task creation skipped:', taskError.message);
      }

      res.json({
        success: true,
        message: 'Non-delivery dispute reported successfully',
        data: { disputeId: disputeResult.insertId }
      });

    } catch (error) {
      console.error('Report non-delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report non-delivery',
        error: error.message
      });
    }
  },

  // Artist Response to Dispute
  respondToDispute: async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { response, evidence, action } = req.body; // action: 'approve' or 'dispute'
      const artistId = req.user.id;

      // Verify dispute exists and artist can respond
      const [disputes] = await pool.execute(`
        SELECT d.*, b.artist_id, ar.user_id as artist_user_id, o.user_id as organizer_user_id
        FROM disputes d
        JOIN bookings b ON d.booking_id = b.id
        JOIN artists ar ON b.artist_id = ar.id
        JOIN organizers o ON b.organizer_id = o.id
        WHERE d.id = ? AND ar.user_id = ? AND d.status = 'open'
      `, [disputeId, artistId]);

      if (disputes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found or not authorized to respond'
        });
      }

      const dispute = disputes[0];

      if (action === 'approve') {
        // Artist acknowledges non-delivery
        await pool.execute(`
          UPDATE disputes SET 
            artist_response = ?, 
            artist_response_date = NOW(),
            status = 'resolved',
            admin_decision = 'favor_organizer'
          WHERE id = ?
        `, [response, disputeId]);

        // Update booking and process refund
        await pool.execute(
          'UPDATE bookings SET status = "refunded", payment_status = "refunded" WHERE id = ?',
          [dispute.booking_id]
        );

        // Notify organizer
        await pool.execute(`
          INSERT INTO notifications (
            user_id, booking_id, dispute_id, notification_type, 
            title, message
          ) VALUES (?, ?, ?, 'dispute_resolved', ?, ?)
        `, [
          dispute.organizer_user_id,
          dispute.booking_id,
          disputeId,
          'Dispute Resolved - Refund Processed',
          'The artist has acknowledged non-delivery. Your refund is being processed.'
        ]);

      } else if (action === 'dispute') {
        // Artist disputes the claim
        await pool.execute(`
          UPDATE disputes SET 
            artist_response = ?, 
            artist_evidence = ?,
            artist_response_date = NOW(),
            status = 'admin_investigating'
          WHERE id = ?
        `, [response, JSON.stringify(evidence || []), disputeId]);

        // Update booking status
        await pool.execute(
          'UPDATE bookings SET status = "under_investigation" WHERE id = ?',
          [dispute.booking_id]
        );

        // Notify admin (get admin user IDs)
        const [admins] = await pool.execute(
          'SELECT id FROM users WHERE role = "admin"'
        );

        for (const admin of admins) {
          await pool.execute(`
            INSERT INTO notifications (
              user_id, booking_id, dispute_id, notification_type, 
              title, message
            ) VALUES (?, ?, ?, 'dispute_created', ?, ?)
          `, [
            admin.id,
            dispute.booking_id,
            disputeId,
            'Dispute Investigation Required',
            `Artist has disputed non-delivery claim for booking #${dispute.booking_id}. Investigation required.`
          ]);
        }
      }

      res.json({
        success: true,
        message: `Dispute response recorded successfully`
      });

    } catch (error) {
      console.error('Respond to dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to dispute',
        error: error.message
      });
    }
  },

  // Request Cancellation
  requestCancellation: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get booking details
      const [bookings] = await pool.execute(`
        SELECT b.*, 
               o.user_id as organizer_user_id, 
               ar.user_id as artist_user_id,
               DATEDIFF(b.event_date, CURDATE()) as days_before_event
        FROM bookings b
        JOIN organizers o ON b.organizer_id = o.id
        JOIN artists ar ON b.artist_id = ar.id
        WHERE b.id = ? AND (o.user_id = ? OR ar.user_id = ?)
      `, [bookingId, userId, userId]);

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not authorized'
        });
      }

      const booking = bookings[0];
      const daysBeforeEvent = booking.days_before_event;

      // Determine who is requesting cancellation
      const requestedBy = booking.organizer_user_id === userId ? 'organizer' : 'artist';

      // Apply cancellation policy
      let refundPercentage = 0;
      let canCancel = true;

      if (requestedBy === 'organizer') {
        // Organizer cancellation policy
        if (daysBeforeEvent > 14) {
          refundPercentage = 100;
        } else if (daysBeforeEvent >= 7) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
      } else {
        // Artist cancellation policy
        if (daysBeforeEvent < 7) {
          return res.status(400).json({
            success: false,
            message: 'Artists cannot cancel bookings less than 7 days before the event'
          });
        }
        refundPercentage = 100; // Full refund to organizer
      }

      const refundAmount = (booking.total_amount * refundPercentage) / 100;

      // Create cancellation request
      const [cancellationResult] = await pool.execute(`
        INSERT INTO cancellation_requests (
          booking_id, requested_by, requester_id, cancellation_reason,
          event_date, days_before_event, refund_percentage, refund_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId, requestedBy, userId, reason,
        booking.event_date, daysBeforeEvent, refundPercentage, refundAmount
      ]);

      // Update booking status
      await pool.execute(
        'UPDATE bookings SET status = "cancelled" WHERE id = ?',
        [bookingId]
      );

      // Auto-approve if policy allows, otherwise notify admin
      if (refundPercentage > 0) {
        // Auto-approve and process
        await pool.execute(`
          UPDATE cancellation_requests SET 
            status = 'approved', 
            processed_date = NOW()
          WHERE id = ?
        `, [cancellationResult.insertId]);

        // Process refund
        await pool.execute(
          'UPDATE bookings SET payment_status = "refunded" WHERE id = ?',
          [bookingId]
        );
      }

      // Notify relevant parties
      const otherPartyId = requestedBy === 'organizer' ? booking.artist_user_id : booking.organizer_user_id;
      
      await pool.execute(`
        INSERT INTO notifications (
          user_id, booking_id, cancellation_id, notification_type, 
          title, message
        ) VALUES (?, ?, ?, 'cancellation_requested', ?, ?)
      `, [
        otherPartyId,
        bookingId,
        cancellationResult.insertId,
        'Booking Cancelled',
        `Booking #${bookingId} has been cancelled. Refund: ${refundPercentage}% ($${refundAmount})`
      ]);

      res.json({
        success: true,
        message: 'Cancellation request processed successfully',
        data: {
          cancellationId: cancellationResult.insertId,
          refundPercentage,
          refundAmount,
          status: refundPercentage > 0 ? 'approved' : 'pending'
        }
      });

    } catch (error) {
      console.error('Request cancellation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process cancellation request',
        error: error.message
      });
    }
  },

  // Admin: Investigate and Resolve Dispute
  adminResolveDispute: async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { decision, notes, refundAmount } = req.body; // decision: 'favor_organizer', 'favor_artist', 'partial_refund'

      const [disputes] = await pool.execute(
        'SELECT * FROM disputes WHERE id = ? AND status = "admin_investigating"',
        [disputeId]
      );

      if (disputes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found or not available for resolution'
        });
      }

      const dispute = disputes[0];

      // Update dispute
      await pool.execute(`
        UPDATE disputes SET 
          admin_decision = ?, 
          admin_notes = ?,
          refund_amount = ?,
          admin_decision_date = NOW(),
          status = 'resolved'
        WHERE id = ?
      `, [decision, notes, refundAmount || 0, disputeId]);

      // Update booking based on decision
      if (decision === 'favor_organizer' || decision === 'partial_refund') {
        await pool.execute(
          'UPDATE bookings SET status = "refunded", payment_status = "refunded" WHERE id = ?',
          [dispute.booking_id]
        );
      } else {
        await pool.execute(
          'UPDATE bookings SET status = "completed", payment_status = "released" WHERE id = ?',
          [dispute.booking_id]
        );
      }

      res.json({
        success: true,
        message: 'Dispute resolved successfully'
      });

    } catch (error) {
      console.error('Admin resolve dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve dispute',
        error: error.message
      });
    }
  },

  // Get Disputes (for admin)
  getDisputes: async (req, res) => {
    try {
      const [disputes] = await pool.execute(`
        SELECT d.*, 
               b.event_name, b.event_date, b.total_amount,
               u1.name as reporter_name,
               u2.name as artist_name,
               u3.name as organizer_name
        FROM disputes d
        JOIN bookings b ON d.booking_id = b.id
        JOIN users u1 ON d.reporter_id = u1.id
        JOIN artists ar ON b.artist_id = ar.id
        JOIN organizers o ON b.organizer_id = o.id
        JOIN users u2 ON ar.user_id = u2.id
        JOIN users u3 ON o.user_id = u3.id
        ORDER BY d.created_at DESC
      `);

      res.json({
        success: true,
        data: disputes
      });

    } catch (error) {
      console.error('Get disputes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch disputes',
        error: error.message
      });
    }
  }
};

module.exports = disputeController; 