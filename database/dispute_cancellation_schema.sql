-- Dispute Resolution and Cancellation Policy Schema

-- Add new status values to bookings table
ALTER TABLE bookings MODIFY COLUMN status ENUM(
    'pending', 
    'confirmed', 
    'cancelled', 
    'completed', 
    'in_progress',
    'not_delivered',    -- New: When organizer reports non-delivery
    'disputed',         -- New: When artist disputes the claim
    'under_investigation', -- New: When admin is investigating
    'refunded',         -- New: When payment is refunded
    'payment_released'  -- New: When payment is released to artist
) DEFAULT 'pending';

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    dispute_type ENUM('non_delivery', 'cancellation', 'quality_issue', 'other') NOT NULL,
    reported_by ENUM('organizer', 'artist', 'admin') NOT NULL,
    reporter_id INT NOT NULL,
    dispute_reason TEXT NOT NULL,
    evidence_files JSON, -- Store file paths/URLs as JSON array
    artist_response TEXT,
    artist_response_date DATETIME,
    artist_evidence JSON, -- Artist's evidence files
    admin_decision ENUM('pending', 'favor_organizer', 'favor_artist', 'partial_refund') DEFAULT 'pending',
    admin_notes TEXT,
    admin_decision_date DATETIME,
    auto_resolve_date DATETIME, -- When system will auto-resolve if no response
    status ENUM('open', 'artist_responded', 'admin_investigating', 'resolved', 'auto_resolved') DEFAULT 'open',
    refund_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create cancellation requests table
CREATE TABLE IF NOT EXISTS cancellation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    requested_by ENUM('organizer', 'artist') NOT NULL,
    requester_id INT NOT NULL,
    cancellation_reason TEXT NOT NULL,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_date DATE NOT NULL, -- Copy from booking for calculation
    days_before_event INT NOT NULL, -- Calculated automatically
    refund_percentage DECIMAL(5,2) NOT NULL, -- Based on cancellation policy
    refund_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
    admin_notes TEXT,
    processed_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notifications table for automated notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT,
    dispute_id INT,
    cancellation_id INT,
    notification_type ENUM(
        'dispute_created',
        'dispute_response_required',
        'dispute_auto_resolved',
        'cancellation_requested',
        'cancellation_approved',
        'payment_refunded',
        'payment_released'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_for DATETIME, -- For delayed notifications
    sent_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE SET NULL,
    FOREIGN KEY (cancellation_id) REFERENCES cancellation_requests(id) ON DELETE SET NULL
);

-- Create automated tasks table for system processes
CREATE TABLE IF NOT EXISTS automated_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_type ENUM('auto_resolve_dispute', 'send_notification', 'process_refund') NOT NULL,
    booking_id INT,
    dispute_id INT,
    cancellation_id INT,
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    last_attempt DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (cancellation_id) REFERENCES cancellation_requests(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_cancellation_booking_id ON cancellation_requests(booking_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_automated_tasks_scheduled ON automated_tasks(scheduled_for);
CREATE INDEX idx_automated_tasks_status ON automated_tasks(status); 