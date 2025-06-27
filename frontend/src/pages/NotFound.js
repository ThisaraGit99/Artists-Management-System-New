import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center text-center">
        <Col md={6}>
          <i className="fas fa-exclamation-triangle fa-5x text-warning mb-4"></i>
          <h1 className="display-1 fw-bold text-muted">404</h1>
          <h2 className="mb-3">Page Not Found</h2>
          <p className="lead text-muted mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button as={Link} to="/" variant="primary" size="lg">
            <i className="fas fa-home me-2"></i>
            Go Home
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound; 