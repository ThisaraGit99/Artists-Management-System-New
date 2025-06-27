const bcrypt = require('bcryptjs');
const { executeQuery, getConnection } = require('../config/database');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.role = userData.role;
        this.status = userData.status;
        this.phone = userData.phone;
        this.profile_image = userData.profile_image;
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Create a new user
    static async create(userData) {
        try {
            const { name, email, password, role, phone } = userData;

            // Check if user already exists
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert user
            const query = `
                INSERT INTO users (name, email, password, role, phone) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const result = await executeQuery(query, [name, email, hashedPassword, role, phone]);

            if (!result.success) {
                throw new Error(result.error);
            }

            const userId = result.data.insertId;

            // Create role-specific profile
            if (role === 'artist') {
                await this.createArtistProfile(userId);
            } else if (role === 'organizer') {
                await this.createOrganizerProfile(userId);
            }

            // Return created user (without password)
            return await this.findById(userId);

        } catch (error) {
            throw new Error('User creation failed: ' + error.message);
        }
    }

    // Create artist profile
    static async createArtistProfile(userId) {
        const query = 'INSERT INTO artists (user_id) VALUES (?)';
        const result = await executeQuery(query, [userId]);
        
        if (!result.success) {
            throw new Error('Failed to create artist profile: ' + result.error);
        }
        
        return result.data.insertId;
    }

    // Create organizer profile
    static async createOrganizerProfile(userId, organizationData = {}) {
        const { organizationName, organizationType } = organizationData;
        const query = `
            INSERT INTO organizers (user_id, organization_name, organization_type) 
            VALUES (?, ?, ?)
        `;
        const result = await executeQuery(query, [userId, organizationName || null, organizationType || null]);
        
        if (!result.success) {
            throw new Error('Failed to create organizer profile: ' + result.error);
        }
        
        return result.data.insertId;
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = `
                SELECT id, name, email, role, status, phone, profile_image, created_at, updated_at 
                FROM users 
                WHERE id = ?
            `;
            const result = await executeQuery(query, [id]);

            if (!result.success || result.data.length === 0) {
                return null;
            }

            return new User(result.data[0]);
        } catch (error) {
            throw new Error('Failed to find user: ' + error.message);
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const query = `
                SELECT id, name, email, role, status, phone, profile_image, created_at, updated_at 
                FROM users 
                WHERE email = ?
            `;
            const result = await executeQuery(query, [email]);

            if (!result.success || result.data.length === 0) {
                return null;
            }

            return new User(result.data[0]);
        } catch (error) {
            throw new Error('Failed to find user: ' + error.message);
        }
    }

    // Find user by email with password (for authentication)
    static async findByEmailWithPassword(email) {
        try {
            const query = `
                SELECT id, name, email, password, role, status, phone, profile_image, created_at, updated_at 
                FROM users 
                WHERE email = ?
            `;
            const result = await executeQuery(query, [email]);

            if (!result.success || result.data.length === 0) {
                return null;
            }

            return result.data[0];
        } catch (error) {
            throw new Error('Failed to find user: ' + error.message);
        }
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            throw new Error('Password verification failed: ' + error.message);
        }
    }

    // Update user profile
    static async updateProfile(userId, updateData) {
        try {
            const allowedFields = ['name', 'phone', 'profile_image'];
            const fieldsToUpdate = [];
            const values = [];

            // Build dynamic update query
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    fieldsToUpdate.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fieldsToUpdate.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(userId);

            const query = `
                UPDATE users 
                SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

            const result = await executeQuery(query, values);

            if (!result.success) {
                throw new Error(result.error);
            }

            return await this.findById(userId);
        } catch (error) {
            throw new Error('Profile update failed: ' + error.message);
        }
    }

    // Update user (admin only - more permissive than updateProfile)
    static async update(userId, updateData) {
        try {
            const allowedFields = ['name', 'email', 'phone', 'profile_image', 'role', 'status'];
            const fieldsToUpdate = [];
            const values = [];

            // Build dynamic update query
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    fieldsToUpdate.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fieldsToUpdate.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(userId);

            const query = `
                UPDATE users 
                SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

            const result = await executeQuery(query, values);

            if (!result.success) {
                throw new Error(result.error);
            }

            return await this.findById(userId);
        } catch (error) {
            throw new Error('User update failed: ' + error.message);
        }
    }

    // Change password
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get current user with password
            const userQuery = 'SELECT password FROM users WHERE id = ?';
            const userResult = await executeQuery(userQuery, [userId]);

            if (!userResult.success || userResult.data.length === 0) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, userResult.data[0].password);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            const updateQuery = `
                UPDATE users 
                SET password = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            const updateResult = await executeQuery(updateQuery, [hashedNewPassword, userId]);

            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }

            return { success: true, message: 'Password updated successfully' };
        } catch (error) {
            throw new Error('Password change failed: ' + error.message);
        }
    }

    // Get all users (admin only)
    static async getAll(page = 1, limit = 10, filters = {}) {
        try {
            const { pool } = require('../config/database');
            const offset = (page - 1) * limit;
            
            let whereClause = '';
            let queryParams = [];

            // Build filters
            if (filters.role) {
                whereClause += ' WHERE u.role = ?';
                queryParams.push(filters.role);
            }

            if (filters.search) {
                const searchCondition = whereClause ? ' AND' : ' WHERE';
                whereClause += `${searchCondition} (u.name LIKE ? OR u.email LIKE ?)`;
                queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            // Validate and set sort parameters - these will be concatenated as strings (safe since validated)
            const validSortFields = ['created_at', 'name', 'email', 'role', 'status', 'updated_at'];
            const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
            const sortOrder = (filters.sortOrder === 'ASC' || filters.sortOrder === 'DESC') ? filters.sortOrder : 'DESC';

            // Get total count first
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM users u
                ${whereClause}
            `;
            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            // Get users with their status from the users table
            const query = `
                SELECT 
                    u.id, u.name, u.email, u.role, u.status, u.phone, u.profile_image, 
                    u.created_at, u.updated_at,
                    CASE 
                        WHEN u.role = 'artist' THEN COALESCE(a.is_verified, 0)
                        WHEN u.role = 'organizer' THEN COALESCE(o.is_verified, 0)
                        ELSE 1
                    END as is_verified
                FROM users u
                LEFT JOIN artists a ON u.id = a.user_id AND u.role = 'artist'
                LEFT JOIN organizers o ON u.id = o.user_id AND u.role = 'organizer'
                ${whereClause}
                ORDER BY u.${sortBy} ${sortOrder}
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            console.log('Query:', query);
            console.log('Params:', queryParams);
            
            const [results] = await pool.execute(query, queryParams);

            return {
                users: results.map(user => ({
                    ...user,
                    // Convert tinyint to boolean for is_verified
                    is_verified: Boolean(user.is_verified)
                })),
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total: total,
                    total_pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('User.getAll error details:', error);
            throw new Error('Failed to get users: ' + error.message);
        }
    }

    // Delete user (admin only)
    static async delete(userId) {
        try {
            const query = 'DELETE FROM users WHERE id = ?';
            const result = await executeQuery(query, [userId]);

            if (!result.success) {
                throw new Error(result.error);
            }

            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            throw new Error('User deletion failed: ' + error.message);
        }
    }

    // Get user with role-specific details
    static async getWithRoleDetails(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                return null;
            }

            let roleDetails = null;

            if (user.role === 'artist') {
                const artistQuery = `
                    SELECT * FROM artists WHERE user_id = ?
                `;
                const artistResult = await executeQuery(artistQuery, [userId]);
                if (artistResult.success && artistResult.data.length > 0) {
                    roleDetails = artistResult.data[0];
                }
            } else if (user.role === 'organizer') {
                const organizerQuery = `
                    SELECT * FROM organizers WHERE user_id = ?
                `;
                const organizerResult = await executeQuery(organizerQuery, [userId]);
                if (organizerResult.success && organizerResult.data.length > 0) {
                    roleDetails = organizerResult.data[0];
                }
            }

            return {
                ...user,
                role_details: roleDetails
            };
        } catch (error) {
            throw new Error('Failed to get user with role details: ' + error.message);
        }
    }

    // Convert to JSON (exclude sensitive data)
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User; 