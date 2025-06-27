import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user, getDashboardRoute } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Connect Artists with Event Organizers
              </h1>
              <p className="lead mb-4">
                The ultimate platform for artists to showcase their talent and for event organizers 
                to find the perfect entertainment for their events.
              </p>
              
              {isAuthenticated ? (
                <div className="d-flex gap-3">
                  <Button 
                    as={Link} 
                    to={getDashboardRoute()} 
                    variant="light" 
                    size="lg"
                    className="fw-bold"
                  >
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Go to Dashboard
                  </Button>
                  <span className="align-self-center text-light">
                    Welcome back, <strong>{user?.name}</strong>!
                  </span>
                </div>
              ) : (
                <div className="d-flex gap-3">
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="light" 
                    size="lg"
                    className="fw-bold"
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Get Started
                  </Button>
                  <Button 
                    as={Link} 
                    to="/login" 
                    variant="outline-light" 
                    size="lg"
                    className="fw-bold"
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </Button>
                </div>
              )}
            </Col>
            <Col lg={6} className="text-center">
              <i className="fas fa-music fa-10x opacity-75"></i>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-dark mb-3">
                Why Choose Our Platform?
              </h2>
              <p className="lead text-muted">
                Everything you need to manage artistic collaborations in one place
              </p>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-search fa-3x text-primary mb-3"></i>
                  <h5 className="fw-bold">Find Perfect Artists</h5>
                  <p className="text-muted">
                    Browse through a diverse range of talented artists and find the perfect match for your event.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-calendar-check fa-3x text-success mb-3"></i>
                  <h5 className="fw-bold">Easy Booking</h5>
                  <p className="text-muted">
                    Streamlined booking process with instant confirmations and secure payment handling.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <i className="fas fa-star fa-3x text-warning mb-3"></i>
                  <h5 className="fw-bold">Review System</h5>
                  <p className="text-muted">
                    Build trust with our comprehensive review and rating system for quality assurance.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* User Type Cards */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-dark mb-3">
                Join as...
              </h2>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-4">
              <Card className="h-100 border-primary shadow-sm">
                <Card.Body className="p-5 text-center">
                  <i className="fas fa-microphone fa-4x text-primary mb-4"></i>
                  <h3 className="fw-bold text-primary mb-3">Artist</h3>
                  <p className="lead text-muted mb-4">
                    Showcase your talent, manage your bookings, and connect with event organizers.
                  </p>
                  <ul className="list-unstyled text-start mb-4">
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Create detailed artist profiles
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Manage service packages
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Track bookings and earnings
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Build your reputation
                    </li>
                  </ul>
                  {!isAuthenticated && (
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="primary" 
                      size="lg"
                      className="fw-bold"
                    >
                      Join as Artist
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100 border-success shadow-sm">
                <Card.Body className="p-5 text-center">
                  <i className="fas fa-calendar-alt fa-4x text-success mb-4"></i>
                  <h3 className="fw-bold text-success mb-3">Event Organizer</h3>
                  <p className="lead text-muted mb-4">
                    Find talented artists for your events and manage all your bookings efficiently.
                  </p>
                  <ul className="list-unstyled text-start mb-4">
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Search and filter artists
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Compare packages and prices
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Secure booking process
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      Event management tools
                    </li>
                  </ul>
                  {!isAuthenticated && (
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="success" 
                      size="lg"
                      className="fw-bold"
                    >
                      Join as Organizer
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      {!isAuthenticated && (
        <section className="bg-dark text-white py-5">
          <Container>
            <Row className="text-center">
              <Col>
                <h2 className="display-5 fw-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="lead mb-4">
                  Join thousands of artists and organizers who trust our platform
                </p>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary" 
                  size="lg"
                  className="fw-bold me-3"
                >
                  <i className="fas fa-rocket me-2"></i>
                  Start Now
                </Button>
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-light" 
                  size="lg"
                  className="fw-bold"
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </Button>
              </Col>
            </Row>
          </Container>
        </section>
      )}
    </div>
  );
};

export default Home; 