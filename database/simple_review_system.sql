-- ===================================================================
-- SIMPLIFIED ARTIST REVIEW SYSTEM (MySQL Compatible)
-- ===================================================================

USE artist_management_system;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS review_votes;
DROP TABLE IF EXISTS review_categories;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS review_templates;

-- ===================================================================
-- 1. REVIEW TEMPLATES TABLE
-- ===================================================================
CREATE TABLE review_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    category ENUM('positive', 'negative', 'neutral') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 2. MAIN REVIEWS TABLE
-- ===================================================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Booking relationship
    booking_id INT NOT NULL,
    
    -- Review participants
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    reviewer_type ENUM('organizer', 'artist') NOT NULL,
    
    -- Core rating (1-5 stars)
    overall_rating DECIMAL(2,1) NOT NULL,
    
    -- Detailed ratings
    communication_rating DECIMAL(2,1) DEFAULT NULL,
    professionalism_rating DECIMAL(2,1) DEFAULT NULL,
    punctuality_rating DECIMAL(2,1) DEFAULT NULL,
    quality_rating DECIMAL(2,1) DEFAULT NULL,
    
    -- Review content
    review_title VARCHAR(200) NOT NULL,
    review_text TEXT NOT NULL,
    
    -- Recommendation and visibility
    would_recommend BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement metrics
    helpful_votes INT DEFAULT 0,
    unhelpful_votes INT DEFAULT 0,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    moderation_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_booking_reviewer (booking_id, reviewer_id),
    
    -- Foreign keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 3. REVIEW CATEGORIES TABLE
-- ===================================================================
CREATE TABLE review_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    category ENUM(
        'outstanding', 'professional', 'reliable', 'creative', 'responsive',
        'on_time', 'great_value', 'exceeded_expectations', 'would_rebook',
        'poor_communication', 'late', 'unprofessional', 'low_quality', 'overpriced'
    ) NOT NULL,
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review_category (review_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 4. REVIEW VOTES TABLE
-- ===================================================================
CREATE TABLE review_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    voter_id INT NOT NULL,
    vote_type ENUM('helpful', 'unhelpful') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (review_id, voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 5. ADD INDEXES
-- ===================================================================
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, reviewer_type);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_public ON reviews(is_public, is_approved);
CREATE INDEX idx_reviews_created ON reviews(created_at);
CREATE INDEX idx_reviews_featured ON reviews(is_featured, is_public);

CREATE INDEX idx_categories_review ON review_categories(review_id);
CREATE INDEX idx_categories_type ON review_categories(category);

CREATE INDEX idx_votes_review ON review_votes(review_id);
CREATE INDEX idx_votes_voter ON review_votes(voter_id);

-- ===================================================================
-- 6. INSERT SAMPLE REVIEW TEMPLATES
-- ===================================================================
INSERT INTO review_templates (template_name, template_text, category) VALUES
('Outstanding Performance', 'This artist delivered an absolutely outstanding performance that exceeded all our expectations. Professional, talented, and a pleasure to work with.', 'positive'),
('Great Professional', 'Very professional and reliable artist. Great communication throughout the booking process and delivered exactly what was promised.', 'positive'),
('Highly Recommended', 'Would definitely book this artist again! Everything went smoothly and the quality was excellent.', 'positive'),
('Good but Minor Issues', 'Overall good performance with minor issues that didn''t significantly impact the event. Would consider booking again.', 'neutral'),
('Average Experience', 'The performance met basic expectations. Nothing exceptional but got the job done.', 'neutral'),
('Communication Issues', 'There were some communication challenges that made coordination difficult, though the final performance was acceptable.', 'negative'),
('Not as Expected', 'The performance did not meet our expectations. There were several issues that impacted our event.', 'negative');

-- ===================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ===================================================================

-- View for public reviews with user details
CREATE VIEW public_reviews_detailed AS
SELECT 
    r.id,
    r.booking_id,
    r.overall_rating,
    r.communication_rating,
    r.professionalism_rating,
    r.punctuality_rating,
    r.quality_rating,
    r.review_title,
    r.review_text,
    r.would_recommend,
    r.helpful_votes,
    r.unhelpful_votes,
    r.created_at,
    reviewer.name AS reviewer_name,
    reviewer.role AS reviewer_role,
    reviewee.name AS reviewee_name,
    reviewee.role AS reviewee_role,
    b.event_name,
    b.event_date,
    b.venue_address
FROM reviews r
JOIN users reviewer ON r.reviewer_id = reviewer.id
JOIN users reviewee ON r.reviewee_id = reviewee.id
JOIN bookings b ON r.booking_id = b.id
WHERE r.is_public = TRUE AND r.is_approved = TRUE;

-- View for rating statistics by user
CREATE VIEW user_rating_stats AS
SELECT 
    u.id,
    u.name,
    u.role,
    u.average_rating,
    u.total_reviews,
    COALESCE(COUNT(r.id), 0) as total_reviews_calculated,
    COALESCE(AVG(r.overall_rating), 0) as avg_rating_calculated
FROM users u
LEFT JOIN reviews r ON u.id = r.reviewee_id AND r.is_approved = TRUE AND r.is_public = TRUE
GROUP BY u.id, u.name, u.role, u.average_rating, u.total_reviews;

SELECT 'Simple Review System Schema Created Successfully!' AS status; 