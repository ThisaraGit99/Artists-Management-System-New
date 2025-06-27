import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';
import ProfileForm from './ProfileForm';
import SkillsManagement from './SkillsManagement';
import AvailabilityManagement from './AvailabilityManagement';
import PortfolioManagement from './PortfolioManagement';
import RatingsDisplay from './RatingsDisplay';

const ArtistProfile = ({ artistId }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [error, setError] = useState('');
    const [ratings, setRatings] = useState(null);

    useEffect(() => {
        fetchProfileData();
    }, [artistId]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            
            // Fetch profile data and ratings in parallel
            const [profileResponse, ratingsResponse] = await Promise.all([
                artistService.getArtistDetails(artistId),
                artistService.getArtistRatings(artistId)
            ]);

            if (profileResponse.data.success) {
                setProfile(profileResponse.data.data);
            }

            if (ratingsResponse.data.success) {
                setRatings(ratingsResponse.data.data);
            }
        } catch (error) {
            console.error('Error fetching artist data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (data) => {
        try {
            if (profile) {
                await artistService.updateProfile(data);
                toast.success('Profile updated successfully!');
            } else {
                await artistService.completeProfile(data);
                toast.success('Profile created successfully!');
            }
            fetchProfileData();
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile. Please try again.');
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