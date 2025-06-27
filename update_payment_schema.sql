-- Add payment-related columns to existing bookings table
ALTER TABLE bookings ADD COLUMN payment_status ENUM('pending', 'paid', 'released', 'refunded') DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN payment_date DATETIME NULL;
ALTER TABLE bookings ADD COLUMN completion_date DATETIME NULL;
ALTER TABLE bookings ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN net_amount DECIMAL(10,2);

-- Create payments table for tracking payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'refunded') DEFAULT 'completed',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Create disputes table for handling payment disputes
CREATE TABLE IF NOT EXISTS disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    reported_by_id INT NOT NULL,
    issue_description TEXT,
    artist_response TEXT,
    artist_response_date DATETIME,
    status ENUM('pending', 'resolved_refund', 'resolved_release') DEFAULT 'pending',
    admin_notes TEXT,
    resolved_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (reported_by_id) REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_payments_booking_id ON payments(booking_id); 