/**
 * Future-proof data formatting utilities
 * Handles various data formats gracefully without manual database fixes
 */

// Safely parse JSON with fallback handling
const safeJsonParse = (jsonString, fallback = null) => {
    if (!jsonString) return fallback;
    
    // If it's already an object/array, return it
    if (typeof jsonString === 'object') return jsonString;
    
    // If it's not a string, return fallback
    if (typeof jsonString !== 'string') return fallback;
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON parse failed, attempting fallback conversion:', jsonString);
        
        // Handle comma-separated strings (e.g., "Rock,Pop" -> ["Rock", "Pop"])
        if (jsonString.includes(',')) {
            return jsonString.split(',').map(item => item.trim()).filter(item => item);
        }
        
        // Handle single value (e.g., "Rock" -> ["Rock"])
        if (jsonString.trim()) {
            return [jsonString.trim()];
        }
        
        return fallback;
    }
};

// Format genres data (ensures it's always an array)
const formatGenres = (genresData) => {
    const parsed = safeJsonParse(genresData, []);
    
    // Ensure it's always an array
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return [parsed];
    
    return [];
};

// Format social links (ensures it's always an object with all platforms)
const formatSocialLinks = (socialLinksData) => {
    const defaultSocialLinks = {
        instagram: '',
        facebook: '',
        twitter: '',
        youtube: '',
        spotify: ''
    };
    
    const parsed = safeJsonParse(socialLinksData, {});
    
    // Merge with defaults to ensure all platforms exist
    return {
        ...defaultSocialLinks,
        ...parsed
    };
};

// Format artist profile data for frontend consumption
const formatArtistProfile = (artistData) => {
    if (!artistData) return null;
    
    return {
        ...artistData,
        genres: formatGenres(artistData.genres),
        social_links: formatSocialLinks(artistData.social_links),
        // Ensure other JSON fields are properly formatted
        availability: safeJsonParse(artistData.availability, null),
        portfolio_links: safeJsonParse(artistData.portfolio_links, []),
        skills: safeJsonParse(artistData.skills, [])
    };
};

// Format data for database storage (ensures proper JSON strings)
const formatForDatabase = (data) => {
    const formatted = { ...data };
    
    // Convert arrays/objects to JSON strings for database storage
    if (formatted.genres && Array.isArray(formatted.genres)) {
        formatted.genres = JSON.stringify(formatted.genres);
    }
    
    if (formatted.social_links && typeof formatted.social_links === 'object') {
        formatted.social_links = JSON.stringify(formatted.social_links);
    }
    
    return formatted;
};

// Validate JSON data before database operations
const validateJsonData = (data) => {
    const errors = [];
    
    // Validate genres
    if (data.genres) {
        const genres = formatGenres(data.genres);
        if (genres.length === 0) {
            errors.push('At least one genre is required');
        }
    }
    
    // Validate social links structure
    if (data.social_links) {
        const socialLinks = formatSocialLinks(data.social_links);
        const validPlatforms = ['instagram', 'facebook', 'twitter', 'youtube', 'spotify'];
        
        for (const [platform, url] of Object.entries(socialLinks)) {
            if (!validPlatforms.includes(platform)) {
                errors.push(`Invalid social media platform: ${platform}`);
            }
            
            if (url && !isValidUrl(url)) {
                errors.push(`Invalid URL for ${platform}: ${url}`);
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// URL validation helper
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Migration helper - converts old data formats to new ones automatically
const migrateArtistData = async (executeQuery, artistId) => {
    try {
        // Get current artist data
        const result = await executeQuery(
            'SELECT * FROM artists WHERE id = ?',
            [artistId]
        );
        
        if (!result.success || result.data.length === 0) {
            return { success: false, message: 'Artist not found' };
        }
        
        const artist = result.data[0];
        let needsUpdate = false;
        const updates = {};
        
        // Convert old genre field to genres JSON array
        if (artist.genre && (!artist.genres || !isValidJson(artist.genres))) {
            updates.genres = JSON.stringify([artist.genre]);
            needsUpdate = true;
        }
        
        // Ensure social_links has proper structure
        if (!artist.social_links || !isValidJson(artist.social_links)) {
            updates.social_links = JSON.stringify(formatSocialLinks(null));
            needsUpdate = true;
        }
        
        // Apply updates if needed
        if (needsUpdate) {
            const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const updateValues = Object.values(updates);
            
            await executeQuery(
                `UPDATE artists SET ${updateFields} WHERE id = ?`,
                [...updateValues, artistId]
            );
            
            console.log(`✅ Migrated data for artist ID ${artistId}`);
        }
        
        return { success: true, updated: needsUpdate };
    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error: error.message };
    }
};

// Check if string is valid JSON
const isValidJson = (str) => {
    if (!str || typeof str !== 'string') return false;
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

// Additional utility functions for event controller
const validateAndFormatData = (data, type = 'object') => {
    if (!data) {
        return type === 'array' ? [] : {};
    }
    
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return parsed;
        } catch {
            return type === 'array' ? [] : {};
        }
    }
    
    return data;
};

const formatJsonFields = (data, fields = []) => {
    const formatted = { ...data };
    
    fields.forEach(field => {
        if (formatted[field]) {
            formatted[field] = safeJsonParse(formatted[field], field.includes('requirements') ? [] : {});
        }
    });
    
    return formatted;
};

module.exports = {
    safeJsonParse,
    formatGenres,
    formatSocialLinks,
    formatArtistProfile,
    formatForDatabase,
    validateJsonData,
    migrateArtistData,
    isValidUrl,
    validateAndFormatData,
    formatJsonFields
}; 