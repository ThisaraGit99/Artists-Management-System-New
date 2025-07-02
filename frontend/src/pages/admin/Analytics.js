import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Spinner, Alert, Form, Button
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data in parallel
      const [overviewResponse, revenueResponse, userResponse] = await Promise.all([
        adminService.getAnalyticsOverview(),
        adminService.getRevenueAnalytics(dateRange.startDate, dateRange.endDate),
        adminService.getUserAnalytics()
      ]);

      if (overviewResponse.success) {
        setAnalyticsData(overviewResponse.data);
      }
      
      if (revenueResponse.success) {
        setRevenueData(revenueResponse.data);
      }
      
      if (userResponse.success) {
        setUserAnalytics(userResponse.data);
      }

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
  };

  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Date filter preset functions
  const setDatePreset = (preset) => {
    const now = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date(now);
        break;
      case 'quarter':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        endDate = new Date(now);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading analytics...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-chart-line me-3"></i>
            Analytics Dashboard
          </h1>
          <p className="lead text-muted">View system statistics and performance metrics</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <h6 className="mb-0">
            <i className="fas fa-calendar-alt me-2"></i>
            Date Range Filter
          </h6>
        </Card.Header>
        <Card.Body>
          {/* Preset Filter Buttons */}
          <Row className="mb-3">
            <Col>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setDatePreset('today')}
                >
                  <i className="fas fa-clock me-1"></i>
                  Today
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => setDatePreset('week')}
                >
                  <i className="fas fa-calendar-week me-1"></i>
                  Last 7 Days
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => setDatePreset('month')}
                >
                  <i className="fas fa-calendar-day me-1"></i>
                  Last 30 Days
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => setDatePreset('quarter')}
                >
                  <i className="fas fa-calendar me-1"></i>
                  Last 90 Days
                </Button>
              </div>
            </Col>
          </Row>

          {/* Custom Date Range */}
          <Row className="align-items-end">
            <Col md={3}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </Col>
            <Col md={3}>
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </Col>
            <Col md={3}>
              <Button variant="primary" onClick={fetchAnalytics} disabled={loading}>
                <i className="fas fa-sync-alt me-2"></i>
                Update Report
              </Button>
            </Col>
            <Col md={3}>
              <small className="text-muted">
                Or use preset filters above for quick selection
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Platform Overview */}
      {analyticsData && (
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <i className="fas fa-users fa-3x text-primary mb-3"></i>
                <h3 className="fw-bold text-primary">{analyticsData.platformMetrics.total_artists || 0}</h3>
                <p className="text-muted mb-0">Total Artists</p>
                <small className="text-success">
                  +{analyticsData.platformMetrics.weekly_signups || 0} last 7 days
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <i className="fas fa-building fa-3x text-info mb-3"></i>
                <h3 className="fw-bold text-info">{analyticsData.platformMetrics.total_organizers || 0}</h3>
                <p className="text-muted mb-0">Total Organizers</p>
                <small className="text-success">
                  +{analyticsData.platformMetrics.monthly_signups || 0} last 30 days
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <i className="fas fa-calendar-check fa-3x text-success mb-3"></i>
                <h3 className="fw-bold text-success">{analyticsData.bookingAnalytics.total_bookings || 0}</h3>
                <p className="text-muted mb-0">Total Bookings</p>
                <small className="text-info">
                  {analyticsData.bookingAnalytics.confirmed_bookings || 0} confirmed
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <i className="fas fa-dollar-sign fa-3x text-warning mb-3"></i>
                <h3 className="fw-bold text-warning">
                  {formatCurrency(analyticsData.revenueAnalytics.total_revenue)}
                </h3>
                <p className="text-muted mb-0">Platform Revenue</p>
                <small className="text-muted">
                  (10% Commission)
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Booking Analytics */}
      {analyticsData && (
        <Row className="mb-4">
          <Col lg={12}>
            <Card className="h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Booking Status Distribution
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-6">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Confirmed</span>
                      <span className="fw-bold text-success">
                        {analyticsData.bookingAnalytics.confirmed_bookings || 0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Completed</span>
                      <span className="fw-bold text-primary">
                        {analyticsData.bookingAnalytics.completed_bookings || 0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Cancelled</span>
                      <span className="fw-bold text-danger">
                        {analyticsData.bookingAnalytics.cancelled_bookings || 0}
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="display-6 fw-bold text-muted">
                        {analyticsData.bookingAnalytics.total_bookings || 0}
                      </div>
                      <small className="text-muted">Total Bookings</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Revenue Analytics */}
      {revenueData && (
        <Row className="mb-4">
          <Col lg={12}>
            <Card>
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-chart-line me-2"></i>
                  Revenue Analytics
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col lg={6}>
                    <h6 className="fw-bold">Top Earning Artists</h6>
                    {revenueData.topArtists.length === 0 ? (
                      <p className="text-muted">No artist earnings data available</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Artist</th>
                              <th>Bookings</th>
                              <th>Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueData.topArtists.slice(0, 5).map((artist, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="fw-bold">{artist.artist_name}</div>
                                  <small className="text-muted">{artist.artist_email}</small>
                                </td>
                                <td>{artist.total_bookings}</td>
                                <td className="fw-bold text-success">
                                  {formatCurrency(artist.total_earnings)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Col>
                  <Col lg={6}>
                    <h6 className="fw-bold">Top Spending Organizers</h6>
                    {revenueData.topOrganizers.length === 0 ? (
                      <p className="text-muted">No organizer spending data available</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Organizer</th>
                              <th>Bookings</th>
                              <th>Total Spent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueData.topOrganizers.slice(0, 5).map((organizer, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="fw-bold">{organizer.organizer_name}</div>
                                  <small className="text-muted">{organizer.organizer_email}</small>
                                </td>
                                <td>{organizer.total_bookings}</td>
                                <td className="fw-bold text-primary">
                                  {formatCurrency(organizer.total_spent)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* User Analytics */}
      {userAnalytics && (
        <Row className="mb-4">
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-user-plus me-2"></i>
                  User Registration Trends
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="display-6 fw-bold text-primary">
                      {userAnalytics.activityMetrics.active_artists_week || 0}
                    </div>
                    <small className="text-muted">Active Artists (Last 7 Days)</small>
                  </div>
                  <div className="col-4">
                    <div className="display-6 fw-bold text-info">
                      {userAnalytics.activityMetrics.active_organizers_week || 0}
                    </div>
                    <small className="text-muted">Active Organizers (Last 7 Days)</small>
                  </div>
                  <div className="col-4">
                    <div className="display-6 fw-bold text-success">
                      {(userAnalytics.activityMetrics.active_artists_month || 0) + 
                       (userAnalytics.activityMetrics.active_organizers_month || 0)}
                    </div>
                    <small className="text-muted">Total Active (Last 30 Days)</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-users-cog me-2"></i>
                  User Engagement Stats
                </h5>
              </Card.Header>
              <Card.Body>
                {userAnalytics.engagementStats.map((stat, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="fw-bold text-capitalize">{stat.role}s</span>
                      <br />
                      <small className="text-muted">Total: {stat.total_users}</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">+{stat.new_users_week}</div>
                      <small className="text-muted">Last 7 days</small>
                      <br />
                      <div className="fw-bold text-info">+{stat.new_users_month}</div>
                      <small className="text-muted">Last 30 days</small>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Registration Trend Chart Placeholder */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-area me-2"></i>
                Daily Registration Trends (Last 30 Days)
              </h5>
            </Card.Header>
            <Card.Body>
              {userAnalytics && userAnalytics.registrationTrend.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total Registrations</th>
                        <th>Artists</th>
                        <th>Organizers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAnalytics.registrationTrend.slice(-7).map((day, index) => (
                        <tr key={index}>
                          <td>{new Date(day.date).toLocaleDateString()}</td>
                          <td className="fw-bold">{day.total_registrations}</td>
                          <td className="text-success">{day.artist_registrations}</td>
                          <td className="text-info">{day.organizer_registrations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-chart-area fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No registration data available for the selected period</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics; 