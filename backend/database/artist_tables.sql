-- Additional tables for artist management features

-- Artist Skills Table
CREATE TABLE IF NOT EXISTS artist_skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    INDEX idx_artist_skills (artist_id)
);

-- Artist Availability Table
CREATE TABLE IF NOT EXISTS artist_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    time_from TIME,
    time_to TIME,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    INDEX idx_artist_availability (artist_id, date_from)
);

-- Artist Portfolio Table
CREATE TABLE IF NOT EXISTS artist_portfolio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    media_type ENUM('image', 'video', 'audio', 'document', 'link') NOT NULL,
    media_url VARCHAR(500),
    project_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    INDEX idx_artist_portfolio (artist_id, created_at)
);

-- Artist Performance History Table
CREATE TABLE IF NOT EXISTS artist_performances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    venue VARCHAR(200),
    location VARCHAR(200),
    performance_date DATETIME NOT NULL,
    description TEXT,
    audience_size INT,
    fee_earned DECIMAL(10,2),
    rating DECIMAL(3,2),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    INDEX idx_artist_performances (artist_id, performance_date)
);

-- Insert sample data for artist skills
INSERT INTO artist_skills (artist_id, skill_name, proficiency_level, description) VALUES
(1, 'Guitar', 'Expert', 'Professional guitar playing with 10+ years experience'),
(1, 'Vocals', 'Advanced', 'Lead and backing vocals, multiple genres'),
(1, 'Songwriting', 'Advanced', 'Original song composition and lyrics'),
(1, 'Live Performance', 'Expert', 'Extensive live performance experience');

-- Insert sample data for artist availability
INSERT INTO artist_availability (artist_id, date_from, date_to, time_from, time_to, is_available, notes) VALUES
(1, '2024-01-15', '2024-01-15', '19:00:00', '23:00:00', TRUE, 'Available for evening gigs'),
(1, '2024-01-20', '2024-01-21', '18:00:00', '22:00:00', TRUE, 'Weekend availability'),
(1, '2024-01-25', '2024-01-25', '14:00:00', '18:00:00', FALSE, 'Booked for private event');

-- Insert sample data for artist portfolio
INSERT INTO artist_portfolio (artist_id, title, description, media_type, media_url, project_date, is_featured) VALUES
(1, 'Live Concert at City Hall', 'Acoustic performance for 500+ audience', 'video', 'https://youtube.com/watch?v=sample1', '2023-12-01', TRUE),
(1, 'Studio Recording Session', 'Latest single "Moonlight Dreams"', 'audio', 'https://soundcloud.com/sample-track', '2023-11-15', TRUE),
(1, 'Wedding Performance', 'Romantic acoustic set for wedding ceremony', 'image', 'https://example.com/wedding-photo.jpg', '2023-10-20', FALSE);

-- Insert sample data for artist performances
INSERT INTO artist_performances (artist_id, title, venue, location, performance_date, description, audience_size, fee_earned, rating) VALUES
(1, 'Summer Music Festival', 'Central Park Amphitheater', 'New York, NY', '2023-07-15 20:00:00', 'Main stage performance at summer festival', 2000, 1500.00, 4.8),
(1, 'Coffee House Session', 'The Bean Café', 'Brooklyn, NY', '2023-08-22 19:30:00', 'Intimate acoustic performance', 50, 300.00, 4.9),
(1, 'Corporate Event', 'Tech Company HQ', 'Manhattan, NY', '2023-09-10 18:00:00', 'Background music for corporate networking event', 100, 800.00, 4.5); 