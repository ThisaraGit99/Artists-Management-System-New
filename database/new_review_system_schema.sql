-- ===================================================================
-- IMPROVED ARTIST REVIEW SYSTEM SCHEMA
-- ===================================================================
-- This creates a comprehensive review system with better features:
-- - Separate tables for reviews and ratings
-- - Support for both organizer-to-artist and artist-to-organizer reviews
-- - Helpful/unhelpful voting system
-- - Review categories and tags
-- - Enhanced security and validation
-- ===================================================================

USE artist_management_system;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS review_votes;
DROP TABLE IF EXISTS review_categories;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS review_templates;

-- ===================================================================
-- 1. REVIEW TEMPLATES TABLE
-- Pre-defined review templates to help users write better reviews
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
-- Core review data with enhanced features
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
    overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    
    -- Detailed ratings
    communication_rating DECIMAL(2,1) CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    professionalism_rating DECIMAL(2,1) CHECK (professionalism_rating >= 1.0 AND professionalism_rating <= 5.0),
    punctuality_rating DECIMAL(2,1) CHECK (punctuality_rating >= 1.0 AND punctuality_rating <= 5.0),
    quality_rating DECIMAL(2,1) CHECK (quality_rating >= 1.0 AND quality_rating <= 5.0),
    
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
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_reviews_booking (booking_id),
    INDEX idx_reviews_reviewer (reviewer_id, reviewer_type),
    INDEX idx_reviews_reviewee (reviewee_id),
    INDEX idx_reviews_rating (overall_rating),
    INDEX idx_reviews_public (is_public, is_approved),
    INDEX idx_reviews_created (created_at),
    INDEX idx_reviews_featured (is_featured, is_public)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 3. REVIEW CATEGORIES TABLE
-- Categorize reviews for better organization
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
    UNIQUE KEY unique_review_category (review_id, category),
    INDEX idx_categories_review (review_id),
    INDEX idx_categories_type (category)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 4. REVIEW VOTES TABLE
-- Allow users to vote on review helpfulness
-- ===================================================================
CREATE TABLE review_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    voter_id INT NOT NULL,
    vote_type ENUM('helpful', 'unhelpful') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (review_id, voter_id),
    INDEX idx_votes_review (review_id),
    INDEX idx_votes_voter (voter_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 5. ADD RATING SUMMARY COLUMNS TO USERS TABLE
-- Store calculated rating statistics for quick access
-- ===================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_distribution JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_rating_update TIMESTAMP NULL;

-- Add indexes for rating columns
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_rating (average_rating);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_reviews (total_reviews);

-- ===================================================================
-- 6. TRIGGERS FOR AUTOMATIC RATING CALCULATIONS
-- ===================================================================

DELIMITER //

-- Trigger for new review insertion
CREATE TRIGGER after_review_insert_new
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL update_user_rating_stats(NEW.reviewee_id);
END//

-- Trigger for review updates
CREATE TRIGGER after_review_update_new
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    IF OLD.reviewee_id = NEW.reviewee_id THEN
        CALL update_user_rating_stats(NEW.reviewee_id);
    ELSE
        CALL update_user_rating_stats(OLD.reviewee_id);
        CALL update_user_rating_stats(NEW.reviewee_id);
    END IF;
END//

-- Trigger for review deletion
CREATE TRIGGER after_review_delete_new
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    CALL update_user_rating_stats(OLD.reviewee_id);
END//

-- Trigger for vote updates
CREATE TRIGGER after_vote_insert
AFTER INSERT ON review_votes
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET 
        helpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = NEW.review_id AND vote_type = 'helpful'),
        unhelpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = NEW.review_id AND vote_type = 'unhelpful')
    WHERE id = NEW.review_id;
END//

CREATE TRIGGER after_vote_update
AFTER UPDATE ON review_votes
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET 
        helpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = NEW.review_id AND vote_type = 'helpful'),
        unhelpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = NEW.review_id AND vote_type = 'unhelpful')
    WHERE id = NEW.review_id;
END//

CREATE TRIGGER after_vote_delete
AFTER DELETE ON review_votes
FOR EACH ROW
BEGIN
    UPDATE reviews 
    SET 
        helpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = OLD.review_id AND vote_type = 'helpful'),
        unhelpful_votes = (SELECT COUNT(*) FROM review_votes WHERE review_id = OLD.review_id AND vote_type = 'unhelpful')
    WHERE id = OLD.review_id;
END//

DELIMITER ;

-- ===================================================================
-- 7. STORED PROCEDURES
-- ===================================================================

DELIMITER //

-- Procedure to update user rating statistics
CREATE PROCEDURE update_user_rating_stats(IN user_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_count INT;
    DECLARE rating_dist JSON;
    
    -- Calculate average rating and total count
    SELECT 
        COALESCE(AVG(overall_rating), 0.00),
        COUNT(*)
    INTO avg_rating, total_count
    FROM reviews 
    WHERE reviewee_id = user_id 
    AND is_approved = TRUE 
    AND is_public = TRUE;
    
    -- Calculate rating distribution
    SELECT JSON_OBJECT(
        '5_star', COUNT(CASE WHEN overall_rating >= 4.5 THEN 1 END),
        '4_star', COUNT(CASE WHEN overall_rating >= 3.5 AND overall_rating < 4.5 THEN 1 END),
        '3_star', COUNT(CASE WHEN overall_rating >= 2.5 AND overall_rating < 3.5 THEN 1 END),
        '2_star', COUNT(CASE WHEN overall_rating >= 1.5 AND overall_rating < 2.5 THEN 1 END),
        '1_star', COUNT(CASE WHEN overall_rating < 1.5 THEN 1 END)
    ) INTO rating_dist
    FROM reviews 
    WHERE reviewee_id = user_id 
    AND is_approved = TRUE 
    AND is_public = TRUE;
    
    -- Update user statistics
    UPDATE users 
    SET 
        average_rating = avg_rating,
        total_reviews = total_count,
        rating_distribution = rating_dist,
        last_rating_update = CURRENT_TIMESTAMP
    WHERE id = user_id;
END//

-- Procedure to get featured reviews
CREATE PROCEDURE get_featured_reviews(IN limit_count INT)
BEGIN
    SELECT 
        r.*,
        reviewer.name AS reviewer_name,
        reviewee.name AS reviewee_name,
        b.event_name,
        b.event_date
    FROM reviews r
    JOIN users reviewer ON r.reviewer_id = reviewer.id
    JOIN users reviewee ON r.reviewee_id = reviewee.id
    JOIN bookings b ON r.booking_id = b.id
    WHERE r.is_featured = TRUE 
    AND r.is_public = TRUE 
    AND r.is_approved = TRUE
    ORDER BY r.overall_rating DESC, r.helpful_votes DESC, r.created_at DESC
    LIMIT limit_count;
END//

-- Procedure to recalculate all user ratings
CREATE PROCEDURE recalculate_all_ratings()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_user_id INT;
    DECLARE user_cursor CURSOR FOR 
        SELECT DISTINCT reviewee_id FROM reviews WHERE is_approved = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    rating_loop: LOOP
        FETCH user_cursor INTO current_user_id;
        IF done THEN
            LEAVE rating_loop;
        END IF;
        
        CALL update_user_rating_stats(current_user_id);
    END LOOP;
    
    CLOSE user_cursor;
END//

DELIMITER ;

-- ===================================================================
-- 8. INSERT SAMPLE REVIEW TEMPLATES
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
-- 9. CREATE VIEWS FOR COMMON QUERIES
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
    u.rating_distribution,
    COALESCE(COUNT(r.id), 0) as total_reviews_calculated,
    COALESCE(AVG(r.overall_rating), 0) as avg_rating_calculated
FROM users u
LEFT JOIN reviews r ON u.id = r.reviewee_id AND r.is_approved = TRUE AND r.is_public = TRUE
GROUP BY u.id, u.name, u.role, u.average_rating, u.total_reviews, u.rating_distribution;

-- ===================================================================
-- 10. INITIAL DATA MIGRATION (if needed)
-- ===================================================================
-- This section can be uncommented if you want to migrate existing data

/*
-- Example migration from old booking_reviews table (if it exists)
INSERT INTO reviews (
    booking_id, reviewer_id, reviewee_id, reviewer_type,
    overall_rating, communication_rating, professionalism_rating, quality_rating,
    review_title, review_text, would_recommend, is_public, created_at
)
SELECT 
    booking_id, reviewer_id, reviewee_id, reviewer_type,
    rating, communication_rating, professionalism_rating, quality_rating,
    COALESCE(review_title, 'Review'), COALESCE(review_text, 'No review text'), 
    would_recommend, is_public, created_at
FROM booking_reviews
WHERE NOT EXISTS (
    SELECT 1 FROM reviews WHERE booking_id = booking_reviews.booking_id
);
*/

-- ===================================================================
-- SCHEMA COMPLETE
-- ===================================================================

SELECT 'New Review System Schema Created Successfully!' AS status; 