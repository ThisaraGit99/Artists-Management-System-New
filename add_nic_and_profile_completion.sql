-- ===================================================================
-- ADD NIC COLUMN AND UPDATE PROFILE COMPLETION LOGIC
-- ===================================================================

USE artist_management_system;

-- ===================================================================
-- 1. ADD NIC COLUMN TO ARTISTS TABLE
-- ===================================================================
ALTER TABLE artists ADD COLUMN nic VARCHAR(20) DEFAULT NULL AFTER bio;

-- Add index for NIC column for better performance
CREATE INDEX idx_artists_nic ON artists(nic);

-- ===================================================================
-- 2. UPDATE PROFILE_COMPLETE LOGIC
-- Update profile_complete to 1 where both bio AND nic are filled
-- Update profile_complete to 0 where either bio OR nic is empty/null
-- ===================================================================

-- Set profile_complete = 1 where both bio and nic are filled
UPDATE artists 
SET profile_complete = 1 
WHERE bio IS NOT NULL 
  AND bio != '' 
  AND nic IS NOT NULL 
  AND nic != '';

-- Set profile_complete = 0 where either bio or nic is empty/null
UPDATE artists 
SET profile_complete = 0 
WHERE bio IS NULL 
  OR bio = '' 
  OR nic IS NULL 
  OR nic = '';

-- ===================================================================
-- 3. CREATE TRIGGER TO AUTO-UPDATE PROFILE_COMPLETE
-- This will automatically update profile_complete whenever bio or nic changes
-- ===================================================================

DELIMITER $$

CREATE TRIGGER update_profile_complete_on_update
BEFORE UPDATE ON artists
FOR EACH ROW
BEGIN
    -- Check if both bio and nic are filled
    IF (NEW.bio IS NOT NULL AND NEW.bio != '' AND NEW.nic IS NOT NULL AND NEW.nic != '') THEN
        SET NEW.profile_complete = 1;
    ELSE
        SET NEW.profile_complete = 0;
    END IF;
END$$

CREATE TRIGGER update_profile_complete_on_insert
BEFORE INSERT ON artists
FOR EACH ROW
BEGIN
    -- Check if both bio and nic are filled
    IF (NEW.bio IS NOT NULL AND NEW.bio != '' AND NEW.nic IS NOT NULL AND NEW.nic != '') THEN
        SET NEW.profile_complete = 1;
    ELSE
        SET NEW.profile_complete = 0;
    END IF;
END$$

DELIMITER ;

-- ===================================================================
-- 4. VERIFY THE CHANGES
-- ===================================================================

-- Show the updated table structure
DESCRIBE artists;

-- Show current profile completion status
SELECT 
    id,
    user_id,
    CASE 
        WHEN bio IS NULL OR bio = '' THEN 'Empty'
        ELSE 'Filled'
    END as bio_status,
    CASE 
        WHEN nic IS NULL OR nic = '' THEN 'Empty'
        ELSE 'Filled'
    END as nic_status,
    profile_complete
FROM artists
ORDER BY id;

-- Summary of profile completion
SELECT 
    COUNT(*) as total_artists,
    SUM(CASE WHEN profile_complete = 1 THEN 1 ELSE 0 END) as complete_profiles,
    SUM(CASE WHEN profile_complete = 0 THEN 1 ELSE 0 END) as incomplete_profiles
FROM artists; 