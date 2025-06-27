const { executeQuery } = require('../config/database');

// Middleware to check if user is verified
const requireVerification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let isVerified = false;

        // Check verification status based on user role
        if (userRole === 'artist') {
            const result = await executeQuery(
                'SELECT is_verified FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (result.success && result.data.length > 0) {
                isVerified = result.data[0].is_verified === 1 || result.data[0].is_verified === true;
            }
        } else if (userRole === 'organizer') {
            const result = await executeQuery(
                'SELECT is_verified FROM organizers WHERE user_id = ?',
                [userId]
            );
            
            if (result.success && result.data.length > 0) {
                isVerified = result.data[0].is_verified === 1 || result.data[0].is_verified === true;
            }
        } else if (userRole === 'admin') {
            // Admins don't require verification
            isVerified = true;
        }

        if (!isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Account verification required. Please request verification from admin.',
                error_code: 'VERIFICATION_REQUIRED',
                verification_status: false
            });
        }

        // User is verified, continue
        next();

    } catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check verification status',
            error: error.message
        });
    }
};

// Middleware to check artist verification specifically
const requireArtistVerification = async (req, res, next) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'artist') {
            return res.status(403).json({
                success: false,
                message: 'Artist access required'
            });
        }

        const result = await executeQuery(
            'SELECT is_verified FROM artists WHERE user_id = ?',
            [userId]
        );

        if (!result.success || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Artist profile not found'
            });
        }

        const isVerified = result.data[0].is_verified === 1 || result.data[0].is_verified === true;

        if (!isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Artist account verification required. Please request verification from admin.',
                error_code: 'ARTIST_VERIFICATION_REQUIRED',
                verification_status: false
            });
        }

        next();

    } catch (error) {
        console.error('Artist verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check artist verification status',
            error: error.message
        });
    }
};

// Middleware to check organizer verification specifically
const requireOrganizerVerification = async (req, res, next) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'organizer') {
            return res.status(403).json({
                success: false,
                message: 'Organizer access required'
            });
        }

        const result = await executeQuery(
            'SELECT is_verified FROM organizers WHERE user_id = ?',
            [userId]
        );

        if (!result.success || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Organizer profile not found'
            });
        }

        const isVerified = result.data[0].is_verified === 1 || result.data[0].is_verified === true;

        if (!isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Organizer account verification required. Please request verification from admin.',
                error_code: 'ORGANIZER_VERIFICATION_REQUIRED',
                verification_status: false
            });
        }

        next();

    } catch (error) {
        console.error('Organizer verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check organizer verification status',
            error: error.message
        });
    }
};

module.exports = {
    requireVerification,
    requireArtistVerification,
    requireOrganizerVerification
}; 