import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Modal, 
  Spinner, Alert, Badge, Form 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const VerificationManagement = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' or 'reject'

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getVerificationRequests();
      
      if (response.success) {
        setVerificationRequests(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch verification requests');
      }
    } catch (error) {
      console.error('Fetch verification requests error:', error);
      setError(error.message || 'Failed to load verification requests');
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      
      const verified = approvalAction === 'approve';
      await adminService.verifyUser(selectedRequest.user.id, verified);
      
      toast.success(
        verified 
          ? `${selectedRequest.user.name} has been verified successfully!`
          : `${selectedRequest.user.name}'s verification has been rejected.`
      );
      
      setShowApprovalModal(false);
      fetchVerificationRequests(); // Refresh the list
      
    } catch (error) {
      console.error('Verification action error:', error);
      toast.error(error.message || 'Failed to process verification request');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'artist': return 'success';
      case 'organizer': return 'primary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading verification requests...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6 fw-bold text-primary">
            <i className="fas fa-check-circle me-3"></i>
            Verification Management
          </h1>
          <p className="lead text-muted">Review and approve user verification requests</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={fetchVerificationRequests}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Verification Requests */}
      <Card>
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <i className="fas fa-clock me-2 text-warning"></i>
            Pending Verification Requests
            <Badge bg="warning" className="ms-2">{verificationRequests.length}</Badge>
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {verificationRequests.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-check-double text-success mb-3" style={{ fontSize: '3rem' }}></i>
              <h4 className="text-muted">No Pending Requests</h4>
              <p className="text-muted">All verification requests have been processed.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verificationRequests.map((request, index) => (
                  <tr key={request.id || index}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                          {request.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="mb-0">{request.user.name}</h6>
                          <small className="text-muted">ID: {request.user.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getRoleColor(request.user.role)} className="text-capitalize">
                        {request.user.role}
                      </Badge>
                    </td>
                    <td>
                      <div>
                        <div className="small">
                          <i className="fas fa-envelope me-1"></i>
                          {request.user.email}
                        </div>
                        {request.user.phone && (
                          <div className="small text-muted">
                            <i className="fas fa-phone me-1"></i>
                            {request.user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <small>{formatDate(request.requestDate)}</small>
                    </td>
                    <td>
                      <Badge bg="warning" className="text-capitalize">
                        {request.status}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <div className="btn-group" role="group">
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => openApprovalModal(request, 'approve')}
                          disabled={actionLoading}
                          title="Approve Verification"
                        >
                          <i className="fas fa-check"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => openApprovalModal(request, 'reject')}
                          disabled={actionLoading}
                          title="Reject Verification"
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Approval Confirmation Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas ${approvalAction === 'approve' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
            {approvalAction === 'approve' ? 'Approve' : 'Reject'} Verification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <p className="mb-3">
                Are you sure you want to <strong>{approvalAction}</strong> the verification request for:
              </p>
              
              <Card className="border-light bg-light">
                <Card.Body className="py-2">
                  <Row>
                    <Col>
                      <strong>{selectedRequest.user.name}</strong>
                      <br />
                      <small className="text-muted">{selectedRequest.user.email}</small>
                    </Col>
                    <Col xs="auto">
                      <Badge bg={getRoleColor(selectedRequest.user.role)} className="text-capitalize">
                        {selectedRequest.user.role}
                      </Badge>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="mt-3">
                {approvalAction === 'approve' ? (
                  <Alert variant="success" className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    The user will be marked as verified and can access all platform features.
                  </Alert>
                ) : (
                  <Alert variant="warning" className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    The verification request will be rejected. The user can submit a new request later.
                  </Alert>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowApprovalModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant={approvalAction === 'approve' ? 'success' : 'danger'}
            onClick={handleApproval}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className={`fas ${approvalAction === 'approve' ? 'fa-check' : 'fa-times'} me-2`}></i>
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VerificationManagement; 