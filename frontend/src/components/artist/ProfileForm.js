import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';

const ProfileForm = ({ profile, onSubmit }) => {
    const [formData, setFormData] = useState({
        bio: '',
        nic: '',
        genres: [],
        experience_years: '',
        hourly_rate: '',
        location: '',
        website: '',
        social_links: {
            instagram: '',
            facebook: '',
            twitter: '',
            youtube: '',
            spotify: ''
        }
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const genreOptions = [
        'Rock', 'Pop', 'Jazz', 'Blues', 'Classical', 'Electronic', 'Hip Hop', 
        'R&B', 'Country', 'Folk', 'Reggae', 'Punk', 'Metal', 'Alternative',
        'Indie', 'Gospel', 'World Music', 'Latin', 'Funk', 'Soul'
    ];

    useEffect(() => {
        console.log('🔄 ProfileForm useEffect triggered with profile:', profile);
        
        if (profile) {
            console.log('✅ Profile data received:');
            console.log('   - profile.profile_image:', profile.profile_image);
            console.log('   - profile.bio length:', profile.bio ? profile.bio.length : 'null');
            console.log('   - profile.name:', profile.name);
            console.log('   - profile object keys:', Object.keys(profile));

            // Helper function to safely parse JSON
            const safeJsonParse = (jsonString, fallback) => {
                if (!jsonString) return fallback;
                try {
                    return JSON.parse(jsonString);
                } catch (error) {
                    console.warn('Failed to parse JSON:', jsonString, error);
                    // If it's a comma-separated string, convert to array
                    if (typeof jsonString === 'string' && jsonString.includes(',')) {
                        return jsonString.split(',').map(item => item.trim());
                    }
                    return fallback;
                }
            };

            setFormData({
                bio: profile.bio || '',
                nic: profile.nic || '',
                genres: Array.isArray(profile.genres) ? profile.genres : [],
                experience_years: profile.experience_years || '',
                hourly_rate: profile.hourly_rate || '',
                location: profile.location || '',
                website: profile.website || '',
                social_links: safeJsonParse(profile.social_links, {
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    youtube: '',
                    spotify: ''
                })
            });

            // Set existing profile image preview
            console.log('🖼️ Processing profile image...');
            console.log('   - Raw profile_image value:', profile.profile_image);
            console.log('   - Type:', typeof profile.profile_image);
            console.log('   - Is truthy:', !!profile.profile_image);
            console.log('   - After trim:', profile.profile_image ? profile.profile_image.trim() : 'N/A');
            
            if (profile.profile_image) {
                // Clean the profile image path by removing any extra quotes
                let cleanPath = profile.profile_image.replace(/['"]/g, '');
                
                // Get base URL without /api
                const baseUrl = 'http://localhost:5000';
                
                // Ensure path starts with /uploads
                if (!cleanPath.startsWith('/uploads')) {
                    cleanPath = '/uploads' + cleanPath;
                }
                
                const imageUrl = baseUrl + cleanPath;
                console.log('🔍 Image processing:');
                console.log('   Original path:', profile.profile_image);
                console.log('   Cleaned path:', cleanPath);
                console.log('   Base URL:', baseUrl);
                console.log('   Final URL:', imageUrl);

                // Validate the image URL
                const img = new Image();
                img.onload = () => {
                    console.log('✅ Image loaded successfully:', imageUrl);
                    setImagePreview(imageUrl);
                };
                img.onerror = () => {
                    console.log('❌ Failed to load image:', imageUrl);
                    setImagePreview(null);
                };
                img.src = imageUrl;
            } else {
                console.log('❌ No profile image path found');
                setImagePreview(null);
            }
        } else {
            console.log('❌ No profile data provided, setting preview to null');
            setImagePreview(null);
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSocialLinkChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [platform]: value
            }
        }));
    };

    const handleGenreChange = (genre) => {
        setFormData(prev => {
            const genres = [...prev.genres];
            const index = genres.indexOf(genre);
            
            if (index > -1) {
                genres.splice(index, 1);
            } else {
                genres.push(genre);
            }
            
            return {
                ...prev,
                genres
            };
        });
        
        // Clear genre error when user selects genres
        if (errors.genres) {
            setErrors(prev => ({
                ...prev,
                genres: ''
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, profileImage: 'Please select an image file' }));
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, profileImage: 'Image size should be less than 5MB' }));
                return;
            }
            
            setProfileImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Clear error
            if (errors.profileImage) {
                setErrors(prev => ({ ...prev, profileImage: '' }));
            }
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setImagePreview(null);
        
        // Clear the file input
        const fileInput = document.getElementById('profileImageInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Clear any related errors
        if (errors.profileImage) {
            setErrors(prev => ({ ...prev, profileImage: '' }));
        }
        
        console.log('🗑️ Profile image removed');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.bio.trim()) {
            newErrors.bio = 'Bio is required';
        } else if (formData.bio.length < 50) {
            newErrors.bio = 'Bio should be at least 50 characters';
        }

        if (!formData.nic.trim()) {
            newErrors.nic = 'NIC is required';
        } else if (formData.nic.length < 10 || formData.nic.length > 20) {
            newErrors.nic = 'NIC should be between 10 and 20 characters';
        }

        if (formData.genres.length === 0) {
            newErrors.genres = 'Please select at least one genre';
        }

        if (!formData.experience_years) {
            newErrors.experience_years = 'Experience years is required';
        } else if (formData.experience_years < 0 || formData.experience_years > 50) {
            newErrors.experience_years = 'Experience should be between 0 and 50 years';
        }

        if (!formData.hourly_rate) {
            newErrors.hourly_rate = 'Hourly rate is required';
        } else if (formData.hourly_rate < 10) {
            newErrors.hourly_rate = 'Hourly rate should be at least $10';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (formData.website && !isValidUrl(formData.website)) {
            newErrors.website = 'Please enter a valid website URL';
        }

        return newErrors;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            // Create FormData to handle file upload
            const submitData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'social_links' || key === 'genres') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else {
                    submitData.append(key, formData[key]);
                }
            });
            
            // Add profile image if selected
            if (profileImage) {
                submitData.append('profileImage', profileImage);
            }
            
            await onSubmit(submitData);
            setErrors({});
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h4 className="mb-2">Basic Profile Information</h4>
                <p className="text-muted">
                    Complete your artist profile to start getting booked for events
                </p>
            </div>

            <Form onSubmit={handleSubmit}>
                {/* Profile Image Upload Section */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label>Profile Image</Form.Label>
                            <div className="d-flex align-items-center gap-3">
                                <div className="profile-image-preview">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile Preview"
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '3px solid #dee2e6'
                                            }}
                                            onError={(e) => {
                                                console.log('❌ Profile image failed to load:', imagePreview);
                                                console.log('Error details:', e.target.error);
                                                e.target.onerror = null; // Prevent infinite loop
                                                e.target.src = ''; // Clear the source
                                                setImagePreview(null);
                                            }}
                                            onLoad={(e) => {
                                                console.log('✅ Profile image loaded successfully:', e.target.src);
                                                e.target.style.display = 'block'; // Ensure image is visible
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '50%',
                                                border: '3px dashed #dee2e6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6c757d'
                                            }}
                                        >
                                            <i className="fas fa-user fa-2x"></i>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Form.Control
                                        type="file"
                                        id="profileImageInput"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        isInvalid={!!errors.profileImage}
                                        className="mb-2"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.profileImage}
                                    </Form.Control.Feedback>
                                    {imagePreview || profileImage ? (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={handleRemoveImage}
                                        >
                                            <i className="fas fa-trash me-1"></i>
                                            Remove
                                        </Button>
                                    ) : null}
                                    <Form.Text className="text-muted d-block">
                                        Upload a profile image (max 5MB, JPG/PNG/GIF)
                                    </Form.Text>
                                </div>
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={12}>
                        <Form.Group className="mb-3">
                            <Form.Label>Bio <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself, your musical journey, and what makes you unique..."
                                isInvalid={!!errors.bio}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.bio}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                {formData.bio.length}/500 characters (minimum 50)
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={12}>
                        <Form.Group className="mb-3">
                            <Form.Label>NIC (National Identity Card) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="nic"
                                value={formData.nic}
                                onChange={handleInputChange}
                                placeholder="Enter your NIC number (e.g., 123456789V or 199012345678)"
                                isInvalid={!!errors.nic}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.nic}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Your National Identity Card number for verification purposes
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Experience (Years) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="number"
                                name="experience_years"
                                value={formData.experience_years}
                                onChange={handleInputChange}
                                placeholder="e.g., 5"
                                min="0"
                                max="50"
                                isInvalid={!!errors.experience_years}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.experience_years}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Hourly Rate (USD) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="number"
                                name="hourly_rate"
                                value={formData.hourly_rate}
                                onChange={handleInputChange}
                                placeholder="e.g., 100"
                                min="10"
                                step="5"
                                isInvalid={!!errors.hourly_rate}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.hourly_rate}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g., New York, NY"
                                isInvalid={!!errors.location}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.location}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Website</Form.Label>
                            <Form.Control
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://yourwebsite.com"
                                isInvalid={!!errors.website}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.website}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-4">
                    <Form.Label>Musical Genres <span className="text-danger">*</span></Form.Label>
                    <Card className="p-3">
                        <Row>
                            {genreOptions.map((genre) => (
                                <Col key={genre} xs={6} sm={4} md={3} className="mb-2">
                                    <Form.Check
                                        type="checkbox"
                                        id={'genre-' + genre}
                                        label={genre}
                                        checked={formData.genres.includes(genre)}
                                        onChange={() => handleGenreChange(genre)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Card>
                    {errors.genres && (
                        <Alert variant="danger" className="mt-2 py-2">
                            {errors.genres}
                        </Alert>
                    )}
                </Form.Group>

                <div className="mb-4">
                    <h5 className="mb-3">Social Media Links</h5>
                    <Row>
                        {Object.keys(formData.social_links).map((platform) => (
                            <Col key={platform} md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label className="text-capitalize">
                                        <i className={'fab fa-' + platform + ' me-2'}></i>
                                        {platform}
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.social_links[platform]}
                                        onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                        placeholder={'Your ' + platform + ' profile URL'}
                                    />
                                </Form.Group>
                            </Col>
                        ))}
                    </Row>
                </div>

                <div className="d-flex justify-content-end">
                    <Button 
                        type="submit" 
                        variant="primary" 
                        size="lg"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                {profile ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-2"></i>
                                {profile ? 'Update Profile' : 'Create Profile'}
                            </>
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default ProfileForm; 