-- Artist Management System Database Schema

CREATE DATABASE IF NOT EXISTS artist_management_system;
USE artist_management_system;

-- Users table for authentication and basic info
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'artist', 'organizer') NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Artists table for artist-specific information
CREATE TABLE artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    genre VARCHAR(100),
    bio TEXT,
    experience_years INT DEFAULT 0,
    availability JSON, -- Store availability as JSON object
    hourly_rate DECIMAL(10, 2),
    location VARCHAR(255),
    portfolio_links JSON, -- Store portfolio links as JSON array
    skills JSON, -- Store skills as JSON array
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organizers table for event organizer information
CREATE TABLE organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    organization_name VARCHAR(255),
    organization_type VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events table for event management
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_state VARCHAR(100),
    venue_country VARCHAR(100) DEFAULT 'USA',
    venue_details JSON, -- Store venue details like capacity, outdoor, sound_system, stage_size
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    requirements JSON, -- Store music requirements/genres as JSON array
    contact_info JSON, -- Store contact information as JSON object
    is_public BOOLEAN DEFAULT TRUE,
    status ENUM('planning', 'published', 'in_progress', 'completed', 'cancelled') DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Packages table for artist service packages
CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration VARCHAR(100), -- e.g., "2 hours", "Half day", "Full day"
    category VARCHAR(100), -- e.g., "Wedding", "Corporate", "Concert"
    includes JSON, -- What's included in the package
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Bookings table for booking management
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    organizer_id INT NOT NULL,
    package_id INT,
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    duration VARCHAR(100),
    venue_address TEXT,
    total_amount DECIMAL(10, 2),
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
);

-- Feedback table for ratings and reviews
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNIQUE NOT NULL,
    organizer_id INT NOT NULL,
    artist_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Messages table for communication between users
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    booking_id INT,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_artists_genre ON artists(genre);
CREATE INDEX idx_artists_location ON artists(location);
CREATE INDEX idx_bookings_date ON bookings(event_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('System Admin', 'admin@artistmgmt.com', '$2a$10$rOzJaHHRvNrfLHfP9KnZ2eGSDMwhONwgKK9LU5Rl3H9GYQ7MQGwUu', 'admin');

-- Insert sample data for testing
INSERT INTO users (name, email, password, role, phone) VALUES 
('John Doe', 'john.artist@email.com', '$2a$10$rOzJaHHRvNrfLHfP9KnZ2eGSDMwhONwgKK9LU5Rl3H9GYQ7MQGwUu', 'artist', '+1234567890'),
('Jane Smith', 'jane.organizer@email.com', '$2a$10$rOzJaHHRvNrfLHfP9KnZ2eGSDMwhONwgKK9LU5Rl3H9GYQ7MQGwUu', 'organizer', '+1234567891');

INSERT INTO artists (user_id, genre, bio, experience_years, hourly_rate, location) VALUES 
(2, 'Rock/Pop', 'Professional musician with 10+ years experience in live performances', 10, 150.00, 'New York, NY');

INSERT INTO organizers (user_id, organization_name, organization_type, location) VALUES 
(3, 'Event Masters Inc', 'Event Planning Company', 'Los Angeles, CA');

INSERT INTO packages (artist_id, title, description, price, duration, category) VALUES 
(1, 'Wedding Performance Package', 'Complete wedding entertainment including ceremony and reception music', 800.00, '6 hours', 'Wedding'),
(1, 'Corporate Event Package', 'Professional entertainment for corporate events and parties', 500.00, '3 hours', 'Corporate');

-- Add payment and status columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status ENUM(
    'pending_payment',
    'paid', 
    'funds_held',
    'payment_released',
    'refunded'
) DEFAULT 'pending_payment' AFTER status;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_status ENUM(
    'pending',
    'confirmed', 
    'in_progress',
    'event_completed',
    'completed',
    'disputed',
    'cancelled'
) DEFAULT 'pending' AFTER payment_status;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_release_date DATETIME NULL AFTER event_status;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0 AFTER auto_release_date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0 AFTER platform_fee;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_receipt TEXT NULL AFTER net_amount;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_date DATETIME NULL AFTER payment_receipt;

-- Payment transactions table for detailed tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    transaction_type ENUM('payment', 'release', 'refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('booking', 'payment', 'event', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    booking_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
); 