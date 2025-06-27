const { verifyToken } = require('../config/jwt');
const { executeQuery } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        
        // Get user details from database
        const userQuery = 'SELECT id, name, email, role FROM users WHERE id = ? AND created_at IS NOT NULL';
        const userResult = await executeQuery(userQuery, [decoded.userId]);

        if (!userResult.success || userResult.data.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        // Add user info to request object
        req.user = userResult.data[0];
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Token verification failed'
        });
    }
};

// Middleware to authorize specific roles
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Middleware to check if user is artist
const requireArtist = (req, res, next) => {
    if (!req.user || req.user.role !== 'artist') {
        return res.status(403).json({
            success: false,
            message: 'Artist access required'
        });
    }
    next();
};

// Middleware to check if user is organizer
const requireOrganizer = (req, res, next) => {
    if (!req.user || req.user.role !== 'organizer') {
        return res.status(403).json({
            success: false,
            message: 'Organizer access required'
        });
    }
    next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'admin') {
                return next();
            }

            // For routes with ID in params, check ownership
            if (req.params.id) {
                const resourceId = req.params.id;
                
                // This would need to be customized based on the specific resource
                // For now, we'll check if the user ID matches
                if (req.user.id == resourceId) {
                    return next();
                }
            }

            // Check if user owns the resource through user_id field
            if (req.body && req.body[resourceUserIdField] && req.body[resourceUserIdField] == req.user.id) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.'
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Authorization check failed',
                error: error.message
            });
        }
    };
};

// Optional authentication (token not required but user info added if present)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const userQuery = 'SELECT id, name, email, role FROM users WHERE id = ?';
            const userResult = await executeQuery(userQuery, [decoded.userId]);

            if (userResult.success && userResult.data.length > 0) {
                req.user = userResult.data[0];
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireArtist,
    requireOrganizer,
    requireOwnershipOrAdmin,
    optionalAuth
}; 