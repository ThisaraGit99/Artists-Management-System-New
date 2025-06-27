const { pool } = require('../config/database');

class TaskProcessor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start the task processor (runs every minute)
  start() {
    if (this.isRunning) return;
    
    console.log('Task processor started');
    this.isRunning = true;
    
    // Run immediately
    this.processTasks();
    
    // Then run every minute
    this.intervalId = setInterval(() => {
      this.processTasks();
    }, 60000); // 1 minute
  }

  // Stop the task processor
  stop() {
    if (!this.isRunning) return;
    
    console.log('Task processor stopped');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Process all pending tasks
  async processTasks() {
    try {
      // Get all pending tasks that are due
      const [tasks] = await pool.execute(`
        SELECT * FROM automated_tasks 
        WHERE status = 'pending' 
        AND scheduled_for <= NOW()
        AND attempts < 3
        ORDER BY scheduled_for ASC
      `);

      for (const task of tasks) {
        await this.processTask(task);
      }

    } catch (error) {
      console.error('Task processor error:', error);
    }
  }

  // Process individual task
  async processTask(task) {
    try {
      console.log(`Processing task ${task.id}: ${task.task_type}`);

      // Update attempt count
      await pool.execute(`
        UPDATE automated_tasks 
        SET attempts = attempts + 1, last_attempt = NOW() 
        WHERE id = ?
      `, [task.id]);

      let success = false;

      switch (task.task_type) {
        case 'auto_resolve_dispute':
          success = await this.autoResolveDispute(task);
          break;
        case 'send_notification':
          success = await this.sendNotification(task);
          break;
        case 'process_refund':
          success = await this.processRefund(task);
          break;
        default:
          console.error(`Unknown task type: ${task.task_type}`);
          success = false;
      }

      // Update task status
      if (success) {
        await pool.execute(
          'UPDATE automated_tasks SET status = "completed" WHERE id = ?',
          [task.id]
        );
        console.log(`Task ${task.id} completed successfully`);
      } else {
        // If max attempts reached, mark as failed
        if (task.attempts >= 2) { // Will be 3 after the increment above
          await pool.execute(
            'UPDATE automated_tasks SET status = "failed" WHERE id = ?',
            [task.id]
          );
          console.error(`Task ${task.id} failed after maximum attempts`);
        }
      }

    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error);
      
      // Update error message
      await pool.execute(`
        UPDATE automated_tasks 
        SET error_message = ? 
        WHERE id = ?
      `, [error.message, task.id]);
    }
  }

  // Auto-resolve dispute when artist doesn't respond within 2 days
  async autoResolveDispute(task) {
    try {
      const [disputes] = await pool.execute(
        'SELECT * FROM disputes WHERE id = ? AND status = "open"',
        [task.dispute_id]
      );

      if (disputes.length === 0) {
        console.log(`Dispute ${task.dispute_id} already resolved or not found`);
        return true; // Task is no longer needed
      }

      const dispute = disputes[0];

      // Auto-resolve in favor of organizer (refund)
      await pool.execute(`
        UPDATE disputes SET 
          status = 'auto_resolved',
          admin_decision = 'favor_organizer',
          admin_notes = 'Auto-resolved due to no response from artist within 2 days',
          admin_decision_date = NOW()
        WHERE id = ?
      `, [task.dispute_id]);

      // Update booking status
      await pool.execute(`
        UPDATE bookings 
        SET status = 'refunded', payment_status = 'refunded' 
        WHERE id = ?
      `, [dispute.booking_id]);

      // Get organizer info for notification
      const [bookingInfo] = await pool.execute(`
        SELECT o.user_id as organizer_user_id
        FROM bookings b
        JOIN organizers o ON b.organizer_id = o.id
        WHERE b.id = ?
      `, [dispute.booking_id]);

      if (bookingInfo.length > 0) {
        // Notify organizer about auto-resolution
        await pool.execute(`
          INSERT INTO notifications (
            user_id, booking_id, dispute_id, notification_type, 
            title, message
          ) VALUES (?, ?, ?, 'dispute_auto_resolved', ?, ?)
        `, [
          bookingInfo[0].organizer_user_id,
          dispute.booking_id,
          task.dispute_id,
          'Dispute Auto-Resolved',
          `Your non-delivery dispute for booking #${dispute.booking_id} has been auto-resolved in your favor. Refund is being processed.`
        ]);
      }

      console.log(`Dispute ${task.dispute_id} auto-resolved`);
      return true;

    } catch (error) {
      console.error('Auto-resolve dispute error:', error);
      return false;
    }
  }

  // Send scheduled notification
  async sendNotification(task) {
    try {
      // This would integrate with your notification system
      // For now, just mark notifications as sent
      await pool.execute(
        'UPDATE notifications SET sent_at = NOW() WHERE id = ?',
        [task.notification_id]
      );

      return true;
    } catch (error) {
      console.error('Send notification error:', error);
      return false;
    }
  }

  // Process refund
  async processRefund(task) {
    try {
      // This would integrate with your payment processor
      // For now, just update the booking status
      if (task.booking_id) {
        await pool.execute(
          'UPDATE bookings SET payment_status = "refunded" WHERE id = ?',
          [task.booking_id]
        );
      }

      return true;
    } catch (error) {
      console.error('Process refund error:', error);
      return false;
    }
  }
}

// Create singleton instance
const taskProcessor = new TaskProcessor();

module.exports = taskProcessor; 