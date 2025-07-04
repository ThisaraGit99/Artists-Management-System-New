-- Event Applications System Schema
-- This creates the structure for artists to apply to events with budget proposals

-- Create event applications table
CREATE TABLE IF NOT EXISTS event_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    artist_id INT NOT NULL,
    proposed_budget DECIMAL(10, 2) NOT NULL,
    message TEXT,
    application_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    organizer_response TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_artist (event_id, artist_id)
);

-- Modify events table to add application tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_applications INT DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_applications INT DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS application_deadline DATE NULL;

-- Add event_id to bookings table to link with events
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id INT NULL AFTER organizer_id;
ALTER TABLE bookings ADD FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Add application_id to bookings to track which application led to booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS application_id INT NULL AFTER event_id;
ALTER TABLE bookings ADD FOREIGN KEY (application_id) REFERENCES event_applications(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_event_applications_event_id ON event_applications(event_id);
CREATE INDEX idx_event_applications_artist_id ON event_applications(artist_id);
CREATE INDEX idx_event_applications_status ON event_applications(application_status);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
