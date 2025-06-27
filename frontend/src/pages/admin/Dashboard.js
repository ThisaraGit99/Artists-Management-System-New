import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      setError(error.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading dashboard statistics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchDashboardStats}>
            <i className="fas fa-sync-alt me-2"></i>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-danger">
            <i className="fas fa-cog me-3"></i>
            Admin Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome, {user?.name}! System administration and management panel.
          </p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-users fa-3x text-primary mb-3"></i>
              <h3 className="fw-bold text-primary">{stats?.totalUsers || 0}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-microphone fa-3x text-success mb-3"></i>
              <h3 className="fw-bold text-success">{stats?.activeArtists || 0}</h3>
              <p className="text-muted mb-0">Active Artists</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check fa-3x text-warning mb-3"></i>
              <h3 className="fw-bold text-warning">{stats?.activeBookings || 0}</h3>
              <p className="text-muted mb-0">Active Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-dollar-sign fa-3x text-info mb-3"></i>
              <h3 className="fw-bold text-info">
                ${stats?.monthlyRevenue ? stats.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
              </h3>
              <p className="text-muted mb-0">Monthly Revenue</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Management Options */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-tools me-2"></i>
                System Management
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigate('/admin/users')}
                  >
                    <i className="fas fa-users me-2"></i>
                    Manage Users
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-danger" 
                    className="w-100"
                    onClick={() => navigate('/admin/verifications')}
                  >
                    <i className="fas fa-check-circle me-2"></i>
                    Verifications
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => navigate('/admin/bookings')}
                  >
                    <i className="fas fa-calendar-alt me-2"></i>
                    All Bookings
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => navigate('/admin/analytics')}
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Analytics
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <i className="fas fa-cog me-2"></i>
                    Settings
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => navigate('/admin/events')}
                  >
                    <i className="fas fa-calendar-alt me-2"></i>
                    Manage Events
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Status */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-server me-2"></i>
                System Status
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Database</span>
                <span className="badge bg-success">Online</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>API Server</span>
                <span className="badge bg-success">Online</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Payment Gateway</span>
                <span className="badge bg-success">Online</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="fw-bold mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Recent Alerts
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '150px' }}>
                <div className="text-center text-muted">
                  <i className="fas fa-shield-alt fa-3x mb-3"></i>
                  <p>No alerts</p>
                  <small>System running smoothly</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 