import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Row>
          <Col className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Checking authentication...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Alert variant="danger" className="text-center">
              <Alert.Heading>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Access Denied
              </Alert.Heading>
              <p>
                You don't have permission to access this page. 
                Your role: <strong className="text-capitalize">{user?.role}</strong>
              </p>
              <p>
                Required roles: <strong>{allowedRoles.join(', ')}</strong>
              </p>
              <hr />
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => window.history.back()}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Go Back
                </button>
                <Navigate to="/" className="btn btn-primary">
                  <i className="fas fa-home me-1"></i>
                  Go Home
                </Navigate>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute; 