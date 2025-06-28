import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';
import ProfileForm from './ProfileForm';
import SkillsManagement from './SkillsManagement';
import AvailabilityManagement from './AvailabilityManagement';
import PortfolioManagement from './PortfolioManagement';
import RatingsDisplay from './RatingsDisplay';

const ArtistProfile = () => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [error, setError] = useState('');
    const [ratings, setRatings] = useState(null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Fetch profile data first
            const profileResponse = await artistService.getProfile();
            console.log('🔍 Raw API Response:', profileResponse.data); // Debug log
            let profileData = null;

            if (profileResponse.data.success) {
                profileData = profileResponse.data.data;
                console.log('✅ Extracted profile data:', profileData);
                console.log('   - profile_image in data:', profileData?.profile_image);
                console.log('   - profile data keys:', profileData ? Object.keys(profileData) : 'No data');
                setProfile(profileData);
            } else {
                console.log('❌ API response indicates failure:', profileResponse.data);
                setError('Failed to load profile data');
            }

            // Try to fetch ratings, but don't fail if it doesn't work
            try {
                const ratingsResponse = await artistService.getArtistRatings();
                if (ratingsResponse.data.success) {
                    setRatings(ratingsResponse.data.data);
                }
            } catch (ratingError) {
                console.warn('Failed to load ratings:', ratingError.message);
            }
            
        } catch (error) {
            console.error('Error fetching artist data:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load profile data. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (data) => {
        try {
            console.log('Submitting profile data:', data); // Debug log
            
            // Always try to update first, since we loaded profile data
            try {
                const response = await artistService.updateProfile(data);
                console.log('Update response:', response.data); // Debug log
                
                if (response.data.success) {
                    toast.success('Profile updated successfully!');
                    await fetchProfileData(); // Refresh the data
                    console.log('Profile refreshed after update'); // Debug log
                } else {
                    toast.error(response.data.message || 'Failed to update profile');
                }
            } catch (updateError) {
                console.error('Update error:', updateError); // Debug log
                
                // If update fails with 404 (profile doesn't exist), try to create
                if (updateError.response?.status === 404) {
                    const response = await artistService.completeProfile(data);
                    console.log('Create response:', response.data); // Debug log
                    
                    if (response.data.success) {
                        toast.success('Profile created successfully!');
                        await fetchProfileData(); // Refresh the data
                    } else {
                        toast.error(response.data.message || 'Failed to create profile');
                    }
                } else {
                    // For other errors, show the error message
                    const errorMessage = updateError.response?.data?.message || 'Failed to update profile. Please try again.';
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            console.error('Profile update error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save profile. Please try again.';
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading your profile...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col lg={12}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="mb-0">
                            <i className="fas fa-user-circle me-2"></i>
                            Artist Profile
                        </h2>
                        {profile && (
                            <span className="badge bg-success">
                                <i className="fas fa-check me-1"></i>
                                Profile Complete
                            </span>
                        )}
                    </div>

                    {error && (
                        <Alert variant="warning" className="mb-4">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </Alert>
                    )}

                    <Card className="shadow-sm">
                        <Card.Body className="p-0">
                            <Tab.Container 
                                activeKey={activeTab} 
                                onSelect={(tab) => setActiveTab(tab)}
                            >
                                <Card.Header className="bg-light">
                                    <Nav variant="tabs" className="border-0">
                                        <Nav.Item>
                                            <Nav.Link eventKey="profile" className="px-3">
                                                <i className="fas fa-user me-2"></i>
                                                Basic Info
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="skills" className="px-3">
                                                <i className="fas fa-star me-2"></i>
                                                Skills
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="availability" className="px-3">
                                                <i className="fas fa-calendar me-2"></i>
                                                Availability
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="portfolio" className="px-3">
                                                <i className="fas fa-briefcase me-2"></i>
                                                Portfolio
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>
                                </Card.Header>

                                <Card.Body className="p-4">
                                    <Tab.Content>
                                        <Tab.Pane eventKey="profile">
                                            <ProfileForm 
                                                profile={profile}
                                                onSubmit={handleProfileUpdate}
                                            />
                                        </Tab.Pane>
                                        
                                        <Tab.Pane eventKey="skills">
                                            <SkillsManagement />
                                        </Tab.Pane>
                                        
                                        <Tab.Pane eventKey="availability">
                                            <AvailabilityManagement />
                                        </Tab.Pane>
                                        
                                        <Tab.Pane eventKey="portfolio">
                                            <PortfolioManagement />
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Card.Body>
                            </Tab.Container>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Ratings Section */}
            <Row className="mt-4">
                <Col>
                    {ratings && (
                        <RatingsDisplay 
                            ratingStats={ratings.stats} 
                            recentReviews={ratings.recentReviews}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ArtistProfile; 