import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import organizerService from '../../services/organizerService';
import api from '../../services/api';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    organizer: { is_verified: false },
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await organizerService.getDashboardStats();
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Don't show error toast for stats - just use default values
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    try {
      setVerificationLoading(true);
      const response = await api.post('/auth/request-verification');
      
      if (response.data.success) {
        toast.success('Verification request submitted successfully! Admin will review your account.');
        // Refresh dashboard data to update verification status
        fetchDashboardStats();
      } else {
        toast.error(response.data.message || 'Failed to submit verification request');
      }
    } catch (error) {
      console.error('Verification request error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit verification request');
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-success">
            <i className="fas fa-calendar-alt me-3"></i>
            Organizer Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome back, {user?.name}! Manage your events and artist bookings.
          </p>
        </Col>
      </Row>

      {/* Verification Banner - for non-verified organizers */}
      {(dashboardData?.organizer?.is_verified === false || dashboardData?.organizer?.is_verified === 0) && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="border-0 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Alert.Heading className="h6 mb-1">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Account Verification Required
                  </Alert.Heading>
                  <p className="mb-0">
                    Your organizer account is not verified yet. Get verified to access premium features and gain artist trust.
                  </p>
                </div>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={requestVerification}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-shield-alt me-1"></i>
                      Request Verification
                    </>
                  )}
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Verified Badge - for verified organizers */}
      {(dashboardData?.organizer?.is_verified === true || dashboardData?.organizer?.is_verified === 1) && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" className="border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <i className="fas fa-check-circle me-2 text-success"></i>
                <span className="fw-bold">✅ Verified Organizer</span>
                <Badge bg="success" className="ms-2">Verified</Badge>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-plus fa-3x text-primary mb-3"></i>
              {loading ? (
                <Spinner animation="border" size="sm" className="mb-2" />
              ) : (
                <h3 className="fw-bold text-primary">{dashboardData.upcomingEvents}</h3>
              )}
              <p className="text-muted mb-0">Upcoming Events</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check fa-3x text-success mb-3"></i>
              {loading ? (
                <Spinner animation="border" size="sm" className="mb-2" />
              ) : (
                <h3 className="fw-bold text-success">{dashboardData.confirmedBookings}</h3>
              )}
              <p className="text-muted mb-0">Confirmed Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-handshake fa-3x text-warning mb-3"></i>
              {loading ? (
                <Spinner animation="border" size="sm" className="mb-2" />
              ) : (
                <h3 className="fw-bold text-warning">{dashboardData.pendingBookings}</h3>
              )}
              <p className="text-muted mb-0">Pending Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-dollar-sign fa-3x text-info mb-3"></i>
              {loading ? (
                <Spinner animation="border" size="sm" className="mb-2" />
              ) : (
                <h3 className="fw-bold text-info">
                  ${dashboardData.totalSpent ? dashboardData.totalSpent.toLocaleString() : '0'}
                </h3>
              )}
              <p className="text-muted mb-0">Total Spent</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigate('/artists')}
                  >
                    <i className="fas fa-search me-2"></i>
                    Find Artists
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => navigate('/organizer/events')}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Manage Events
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => navigate('/organizer/bookings')}
                  >
                    <i className="fas fa-calendar-check me-2"></i>
                    My Bookings
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100"
                    onClick={() => navigate('/organizer/profile')}
                  >
                    <i className="fas fa-user-edit me-2"></i>
                    Update Profile
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-clock me-2"></i>
                Recent Booking Activity
              </h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => navigate('/organizer/bookings')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading recent activity...</p>
                </div>
              ) : dashboardData.totalBookings === 0 ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                  <div className="text-center text-muted">
                    <i className="fas fa-calendar-plus fa-3x mb-3"></i>
                    <p>No booking requests yet</p>
                    <small>Start by finding artists for your events</small>
                  </div>
                </div>
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                  <div className="text-center">
                    <i className="fas fa-calendar-check fa-3x text-primary mb-3"></i>
                    <h5>You have {dashboardData.totalBookings} booking request{dashboardData.totalBookings !== 1 ? 's' : ''}</h5>
                    <p className="text-muted mb-3">
                      {dashboardData.pendingBookings > 0 && `${dashboardData.pendingBookings} pending, `}
                      {dashboardData.confirmedBookings > 0 && `${dashboardData.confirmedBookings} confirmed, `}
                      {dashboardData.completedBookings > 0 && `${dashboardData.completedBookings} completed`}
                    </p>
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/organizer/bookings')}
                    >
                      Manage Bookings
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-star me-2"></i>
                Quick Tips
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <div className="text-center text-muted">
                  <i className="fas fa-lightbulb fa-3x text-warning mb-3"></i>
                  <h6>Getting Started</h6>
                  <ul className="text-start small">
                    <li>Browse and filter artists by genre, location, and price</li>
                    <li>View artist portfolios and performance history</li>
                    <li>Send detailed booking requests with event information</li>
                    <li>Track booking status and communicate with artists</li>
                  </ul>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrganizerDashboard; 