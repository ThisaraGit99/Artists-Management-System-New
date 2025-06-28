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

    const genreOptions = [
        'Rock', 'Pop', 'Jazz', 'Blues', 'Classical', 'Electronic', 'Hip Hop', 
        'R&B', 'Country', 'Folk', 'Reggae', 'Punk', 'Metal', 'Alternative',
        'Indie', 'Gospel', 'World Music', 'Latin', 'Funk', 'Soul'
    ];

    useEffect(() => {
        if (profile) {
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
            await onSubmit(formData);
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
                                        id={`genre-${genre}`}
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
                                        <i className={`fab fa-${platform} me-2`}></i>
                                        {platform}
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.social_links[platform]}
                                        onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                        placeholder={`Your ${platform} profile URL`}
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