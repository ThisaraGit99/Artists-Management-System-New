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
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadDashboardData}>
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

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check fa-3x text-success mb-3"></i>
              <h3 className="fw-bold text-success">{dashboardData?.bookingStats?.activeBookings || 0}</h3>
              <p className="text-muted mb-0">Active Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-box fa-3x text-primary mb-3"></i>
              <h3 className="fw-bold text-primary">{dashboardData?.packageStats?.activePackages || 0}</h3>
              <p className="text-muted mb-0">Service Packages</p>
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

      {/* Tabbed Content */}
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-4"
      >
        <Tab eventKey="dashboard" title={
          <span>
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </span>
        }>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-center py-5">
                <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Dashboard Content</h5>
                <p className="text-muted">Your recent activity and notifications will appear here.</p>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="events" title={
          <span>
            <i className="fas fa-search me-2"></i>
            Find Events
          </span>
        }>
          <EventBrowser />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ArtistDashboard;