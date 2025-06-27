import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ListGroup, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';
import api from '../../services/api';
import EventBrowser from '../../components/artist/EventBrowser';

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await artistService.getDashboardStats();
      setDashboardData(response.data.data);
      setError('');
    } catch (error) {
      console.error('Load dashboard data error:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
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
        loadDashboardData();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading dashboard...</span>
        </Spinner>
        <p className="mt-3">Loading your dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-3"
            onClick={loadDashboardData}
          >
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-microphone me-3"></i>
            Artist Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome back, {user?.name}! Manage your bookings, packages, and profile.
          </p>
        </Col>
      </Row>

      {/* Verification Banner */}
      {(dashboardData?.artist?.is_verified === false || dashboardData?.artist?.is_verified === 0) && (
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
                    Your account is not verified yet. Verified artists get more bookings and higher visibility. 
                    Click below to request verification from our admin team.
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

      {/* Verified Badge */}
      {(dashboardData?.artist?.is_verified === true || dashboardData?.artist?.is_verified === 1) && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" className="border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <i className="fas fa-check-circle me-2 text-success"></i>
                <span className="fw-bold">✅ Verified Artist</span>
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
              <i className="fas fa-calendar-check fa-3x text-success mb-3"></i>
              <h3 className="fw-bold text-success">{dashboardData?.bookingStats?.activeBookings || 0}</h3>
              <p className="text-muted mb-0">Active Bookings</p>
              {dashboardData?.bookingStats?.pendingBookings > 0 && (
                <small className="text-warning">
                  +{dashboardData.bookingStats.pendingBookings} pending
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-box fa-3x text-primary mb-3"></i>
              <h3 className="fw-bold text-primary">{dashboardData?.packageStats?.activePackages || 0}</h3>
              <p className="text-muted mb-0">Service Packages</p>
              <small className="text-muted">
                {dashboardData?.packageStats?.totalPackages || 0} total
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-star fa-3x text-warning mb-3"></i>
              <h3 className="fw-bold text-warning">
                {dashboardData?.ratingStats?.averageRating 
                  ? dashboardData.ratingStats.averageRating.toFixed(1) 
                  : '0.0'}
              </h3>
              <p className="text-muted mb-0">Average Rating</p>
              <small className="text-muted">
                {dashboardData?.ratingStats?.totalReviews || 0} reviews
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-dollar-sign fa-3x text-info mb-3"></i>
              <h3 className="fw-bold text-info">
                {formatCurrency(dashboardData?.earningsStats?.monthlyEarnings)}
              </h3>
              <p className="text-muted mb-0">This Month</p>
              <small className="text-muted">
                Total: {formatCurrency(dashboardData?.earningsStats?.totalEarnings)}
              </small>
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
                    as={Link} 
                    to="/artist/profile" 
                    variant="outline-primary" 
                    className="w-100"
                  >
                    <i className="fas fa-user-edit me-2"></i>
                    Update Profile
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link}
                    to="/artist/packages" 
                    variant="outline-success" 
                    className="w-100"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Manage Packages
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link}
                    to="/artist/bookings"
                    variant="outline-warning" 
                    className="w-100"
                  >
                    <i className="fas fa-calendar-check me-2"></i>
                    My Bookings
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => setActiveTab('events')}
                  >
                    <i className="fas fa-search me-2"></i>
                    Find Events
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
                Recent Activity
              </h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={loadDashboardData}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                  <div className="text-center text-muted">
                    <i className="fas fa-inbox fa-3x mb-3"></i>
                    <p>No recent activity</p>
                    <small>Your recent bookings and updates will appear here</small>
                  </div>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{activity.event_name}</div>
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {activity.organizer_name} • 
                          <i className="fas fa-calendar ms-2 me-1"></i>
                          {new Date(activity.event_date).toLocaleDateString()}
                        </small>
                        <br />
                        <small className="text-muted">
                          {formatRelativeTime(activity.created_at)}
                        </small>
                      </div>
                      <div className="text-end">
                        {activity.payment_status === 'paid' ? (
                          <div>
                            <Badge bg="primary" className="small mb-1">
                              💳 Payment Made
                            </Badge>
                            <br />
                            <small className="text-muted">Status: {activity.status}</small>
                          </div>
                        ) : activity.payment_status === 'released' ? (
                          <div>
                            <Badge bg="success" className="small mb-1">
                              ✅ Payment Released
                            </Badge>
                            <br />
                            <small className="text-muted">Completed</small>
                          </div>
                        ) : activity.status === 'disputed' ? (
                          <div>
                            <Badge bg="warning" className="small mb-1">
                              ⚠️ Disputed
                            </Badge>
                            <br />
                            <small className="text-muted">Under Review</small>
                          </div>
                        ) : (
                          <Badge bg={getStatusBadgeVariant(activity.status)}>
                            {activity.status}
                          </Badge>
                        )}
                        <br />
                        <small className="text-success fw-bold">
                          {formatCurrency(activity.total_amount)}
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-bell me-2"></i>
                Notifications
              </h5>
            </Card.Header>
            <Card.Body>
              {!dashboardData?.notifications || dashboardData.notifications.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                  <div className="text-center text-muted">
                    <i className="fas fa-bell-slash fa-3x mb-3"></i>
                    <p>No notifications</p>
                    <small>You're all caught up!</small>
                  </div>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {dashboardData.notifications.map((notification, index) => (
                    <ListGroup.Item key={index} className="px-0">
                      <div className="d-flex justify-content-between">
                        <div className="flex-fill">
                          <div className="fw-bold small">
                            {notification.notification_type === 'new_booking' ? (
                              <><i className="fas fa-calendar-plus text-success me-1"></i>New Booking</>
                            ) : (
                              <><i className="fas fa-edit text-info me-1"></i>Status Update</>
                            )}
                          </div>
                          <div className="small text-muted">
                            {notification.event_name}
                          </div>
                          <div className="small text-muted">
                            by {notification.organizer_name}
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge bg={getStatusBadgeVariant(notification.status)} className="small">
                            {notification.status}
                          </Badge>
                          <div className="small text-muted">
                            {formatRelativeTime(notification.updated_at)}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ArtistDashboard; 