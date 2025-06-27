import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import artistService from '../services/artistService';
import organizerService from '../services/organizerService';
import api from '../services/api';

const VerifiedRoute = ({ children, feature = "this feature" }) => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'artist') {
        const response = await artistService.getDashboardStats();
        if (response.data.success) {
          setVerificationStatus(response.data.data.artist?.is_verified);
        }
      } else if (user?.role === 'organizer') {
        const response = await organizerService.getDashboardStats();
        if (response.data.success) {
          setVerificationStatus(response.data.data.organizer?.is_verified);
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setVerificationStatus(false);
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
        checkVerificationStatus(); // Refresh status
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

  // Show loading while checking verification
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '30vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Allow access for verified users (is_verified = 1 or true)
  if (verificationStatus === 1 || verificationStatus === true) {
    return children;
  }

  // Show verification required message for unverified users
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Alert variant="warning" className="text-center border-0 shadow-sm">
            <div className="mb-3">
              <i className="fas fa-shield-alt fa-3x text-warning mb-3"></i>
              <Alert.Heading className="h4">
                Account Verification Required
              </Alert.Heading>
            </div>
            
            <p className="mb-3">
              To access <strong>{feature}</strong>, your {user?.role} account must be verified by our admin team.
            </p>
            
            <div className="bg-light rounded p-3 mb-3">
              <h6 className="fw-bold mb-2">
                <i className="fas fa-info-circle me-2 text-info"></i>
                Why verification is required:
              </h6>
              <ul className="text-start mb-0 small">
                {user?.role === 'artist' && (
                  <>
                    <li>Ensures genuine artist profiles</li>
                    <li>Builds trust with event organizers</li>
                    <li>Prevents spam and fake bookings</li>
                    <li>Maintains platform quality</li>
                  </>
                )}
                {user?.role === 'organizer' && (
                  <>
                    <li>Confirms legitimate event organizers</li>
                    <li>Protects artists from fake bookings</li>
                    <li>Ensures payment security</li>
                    <li>Maintains platform integrity</li>
                  </>
                )}
              </ul>
            </div>

            <div className="d-grid gap-2">
              <Button
                variant="warning"
                size="lg"
                onClick={requestVerification}
                disabled={verificationLoading}
                className="fw-bold"
              >
                {verificationLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Request Account Verification
                  </>
                )}
              </Button>
              
              <Button
                variant="outline-secondary"
                onClick={() => window.history.back()}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </Button>
            </div>
            
            <hr />
            
            <small className="text-muted">
              <i className="fas fa-clock me-1"></i>
              Verification requests are typically processed within 24-48 hours.
              You'll receive an email notification once your account is verified.
            </small>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifiedRoute; 