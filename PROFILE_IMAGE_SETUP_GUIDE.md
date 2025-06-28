# Profile Image Feature Setup Guide

## Overview
I have successfully implemented profile image upload functionality for the Artist Dashboard. Here's what was added:

## Backend Changes

### 1. Database Schema Update
- Added `profile_image` column to the `artists` table
- **IMPORTANT**: You need to run this SQL command manually in your database:

```sql
USE artist_management_system;
ALTER TABLE artists ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER bio;
```

### 2. File Upload System
- ✅ Added multer middleware for handling file uploads (`backend/middlewares/upload.js`)
- ✅ Created upload directories (`backend/uploads/profile-images/`)
- ✅ Configured file validation (images only, 5MB max size)
- ✅ Static file serving already configured in server.js

### 3. API Updates
- ✅ Updated `artistController.js` to handle image uploads in both `updateProfile` and `completeProfile` methods
- ✅ Modified artist routes to include upload middleware
- ✅ Updated `getProfile` to return profile image URL

## Frontend Changes

### 1. Profile Form Component
- ✅ Added image upload input with preview
- ✅ Image validation (type and size)
- ✅ Remove image functionality
- ✅ FormData handling for file uploads

### 2. Service Layer
- ✅ Updated `artistService.js` to handle multipart/form-data requests

## How to Test

### 1. Database Setup
Run this SQL command in your MySQL database:
```sql
USE artist_management_system;
ALTER TABLE artists ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER bio;
```

### 2. Start the Application
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

### 3. Test the Feature
1. Login as an artist
2. Go to Artist Dashboard → Artist Profile → Basic Info tab
3. You should see a profile image upload section at the top
4. Upload an image (JPG, PNG, GIF - max 5MB)
5. Fill out the rest of the form and submit
6. The image should be saved and displayed in the preview

## File Structure Created
```
backend/
├── middlewares/
│   └── upload.js (NEW)
├── uploads/
│   └── profile-images/ (NEW)
└── controllers/
    └── artistController.js (UPDATED)

frontend/src/
├── components/artist/
│   └── ProfileForm.js (UPDATED)
└── services/
    └── artistService.js (UPDATED)
```

## Image Storage
- Images are stored in `backend/uploads/profile-images/`
- File naming format: `{userId}_{timestamp}-{random}.{extension}`
- Images are served via `/uploads/profile-images/{filename}` URL
- Database stores the relative URL path

## Validation Features
- ✅ File type validation (images only)
- ✅ File size validation (5MB max)
- ✅ Image preview before upload
- ✅ Remove image functionality
- ✅ Error handling and user feedback

## Next Steps
1. Run the database migration SQL command
2. Test the feature
3. Optionally add image compression/resizing for optimization
4. Consider adding default avatar images
5. Add profile image display in other parts of the application (artist cards, etc.)

## Important Notes
- Profile images are optional - the form will work without them
- Existing artists can add profile images by updating their profile
- The feature is fully backward compatible
- Images are served as static files through Express 