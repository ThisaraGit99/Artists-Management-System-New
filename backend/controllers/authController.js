const User = require('../models/User');
const { generateToken } = require('../config/jwt');

// Register new user
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, organizationName, organizationType } = req.body;

        // Create user
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            phone,
            organizationName,
            organizationType
        });

        // Generate JWT token
        const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role
        });

        // Set cookie (optional)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please wait for admin verification.',
            data: {
                user: newUser.toJSON(),
                token
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const userData = await User.findByEmailWithPassword(email);
        if (!userData) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: userData.id,
            email: userData.email,
            role: userData.role
        });

        // Set cookie (optional)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Get user without password
        const user = await User.findById(userData.id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        // Clear cookie
        res.clearCookie('token');

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed: ' + error.message
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.getWithRoleDetails(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get profile: ' + error.message
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const updatedUser = await User.updateProfile(req.user.id, {
            name,
            phone
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser.toJSON()
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const result = await User.changePassword(req.user.id, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        // Get current user
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Set cookie (optional)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token,
                user: user.toJSON()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Token refresh failed: ' + error.message
        });
    }
};

// Verify email (for future implementation)
const verifyEmail = async (req, res) => {
    try {
        // This would be implemented with email verification tokens
        res.status(200).json({
            success: true,
            message: 'Email verification not implemented yet'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Forgot password (for future implementation)
const forgotPassword = async (req, res) => {
    try {
        // This would be implemented with password reset tokens
        res.status(200).json({
            success: true,
            message: 'Password reset not implemented yet'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Request account verification
const requestVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pool } = require('../config/database');
        
        // For now, we'll create a simple notification in the system_settings table
        // In production, you'd want a dedicated verification_requests table
        const timestamp = new Date().toISOString();
        const verificationKey = `verification_request_${userId}_${Date.now()}`;
        
        await pool.execute(
            `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
             VALUES (?, ?, 'json', 'User verification request') 
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
            [verificationKey, JSON.stringify({
                userId: userId,
                requestDate: timestamp,
                status: 'pending'
            })]
        );
        
        res.status(200).json({
            success: true,
            message: 'Verification request submitted successfully. Admin will review your account.'
        });
        
    } catch (error) {
        console.error('Request verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit verification request'
        });
    }
};

// Get user verification status
const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.getWithRoleDetails(userId);
        
        let isVerified = false;
        if (user.role === 'artist' && user.role_details) {
            isVerified = user.role_details.is_verified === 1;
        } else if (user.role === 'organizer' && user.role_details) {
            isVerified = user.role_details.is_verified === 1;
        }
        
        res.status(200).json({
            success: true,
            data: {
                isVerified,
                role: user.role,
                canRequestVerification: !isVerified
            }
        });
        
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get verification status'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    verifyEmail,
    forgotPassword,
    requestVerification,
    getVerificationStatus
}; 