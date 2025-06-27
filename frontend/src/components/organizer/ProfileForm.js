import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import organizerService from '../../services/organizerService';

const OrganizerProfileForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    organization_name: '',
    organization_type: '',
    website: '',
    description: '',
    location: ''
  });

  const organizationTypes = [
    'Event Planning Company',
    'Wedding Planner',
    'Corporate Events',
    'Entertainment Agency',
    'Music Venue',
    'Festival Organizer',
    'Non-Profit Organization',
    'Government Agency',
    'Private Individual',
    'Other'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await organizerService.getProfile();
      
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          organization_name: profileData.organization_name || '',
          organization_type: profileData.organization_type || '',
          website: profileData.website || '',
          description: profileData.description || '',
          location: profileData.location || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Basic validation
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return;
      }
      
      if (!formData.organization_name.trim()) {
        toast.error('Organization name is required');
        return;
      }

      const response = await organizerService.updateProfile(formData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        fetchProfile(); // Refresh profile data
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h4 className="fw-bold mb-0">
                <i className="fas fa-user-edit me-2 text-primary"></i>
                Update Organizer Profile
              </h4>
              <p className="text-muted mb-0 mt-1">
                Keep your profile information up to date to build trust with artists
              </p>
            </Card.Header>
            
            <Card.Body className="p-4">
              {profile?.is_verified ? (
                <Alert variant="success" className="mb-4">
                  <i className="fas fa-check-circle me-2"></i>
                  <strong>Verified Organizer</strong> - Your account has been verified
                </Alert>
              ) : (
                <Alert variant="warning" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Verification Pending</strong> - Complete your profile and request verification to gain artist trust
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  {/* Personal Information */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-user me-2"></i>
                        Full Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-phone me-2"></i>
                        Phone Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  {/* Organization Information */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-building me-2"></i>
                        Organization Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={handleInputChange}
                        placeholder="Enter organization name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-tags me-2"></i>
                        Organization Type
                      </Form.Label>
                      <Form.Select
                        name="organization_type"
                        value={formData.organization_type}
                        onChange={handleInputChange}
                      >
                        <option value="">Select organization type</option>
                        {organizationTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-globe me-2"></i>
                        Website
                      </Form.Label>
                      <Form.Control
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://your-website.com"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Location
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State/Country"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-info-circle me-2"></i>
                        Organization Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your organization, services, and experience..."
                        maxLength={1000}
                      />
                      <Form.Text className="text-muted">
                        {formData.description.length}/1000 characters
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={saving}
                    className="px-4"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Updating Profile...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrganizerProfileForm; 