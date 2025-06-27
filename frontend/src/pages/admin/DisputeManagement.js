import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import disputeService from '../../services/disputeService';

const AdminDisputeManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await disputeService.getDisputes();
      
      if (response.success) {
        setDisputes(response.data);
      } else {
        toast.error('Failed to fetch disputes');
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (dispute) => {
    setSelectedDispute(dispute);
    setShowDetailsModal(true);
  };

  const handleStartResolution = (dispute) => {
    setSelectedDispute(dispute);
    setDecision('');
    setAdminNotes('');
    setRefundAmount(dispute.booking?.total_amount || '0');
    setShowResolveModal(true);
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      toast.error('Please select a decision');
      return;
    }

    if (!adminNotes.trim()) {
      toast.error('Please provide admin notes');
      return;
    }

    try {
      setResolving(true);
      
      const resolutionData = {
        decision,
        notes: adminNotes,
        refundAmount: decision === 'partial_refund' ? parseFloat(refundAmount) : null
      };

      const response = await disputeService.resolveDispute(selectedDispute.id, resolutionData);
      
      if (response.success) {
        toast.success('Dispute resolved successfully');
        setShowResolveModal(false);
        fetchDisputes(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: 'warning', text: 'Awaiting Artist Response' },
      artist_responded: { variant: 'info', text: 'Artist Responded' },
      admin_investigating: { variant: 'primary', text: 'Under Investigation' },
      resolved: { variant: 'success', text: 'Resolved' },
      auto_resolved: { variant: 'secondary', text: 'Auto-Resolved' }
    };

    const config = statusConfig[status] || statusConfig.open;
    
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getDecisionBadge = (decision) => {
    const decisionConfig = {
      pending: { variant: 'secondary', text: 'Pending' },
      favor_organizer: { variant: 'success', text: 'Favor Organizer' },
      favor_artist: { variant: 'info', text: 'Favor Artist' },
      partial_refund: { variant: 'warning', text: 'Partial Refund' }
    };

    const config = decisionConfig[decision] || decisionConfig.pending;
    
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDateTime = (dateTime) => {
    try {
      return dateTime ? format(new Date(dateTime), 'MMM dd, yyyy HH:mm') : 'N/A';
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading disputes...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-gavel me-3"></i>
            Dispute Management
          </h1>
          <p className="lead text-muted">
            Investigate and resolve booking disputes between organizers and artists
          </p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-warning">{disputes.filter(d => d.status === 'open').length}</h3>
              <p className="text-muted mb-0">Awaiting Response</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-primary">{disputes.filter(d => d.status === 'admin_investigating').length}</h3>
              <p className="text-muted mb-0">Under Investigation</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-success">{disputes.filter(d => d.status === 'resolved').length}</h3>
              <p className="text-muted mb-0">Resolved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-secondary">{disputes.filter(d => d.status === 'auto_resolved').length}</h3>
              <p className="text-muted mb-0">Auto-Resolved</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Disputes Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">All Disputes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {disputes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-handshake fa-3x text-muted mb-3"></i>
                  <h4>No disputes found</h4>
                  <p className="text-muted">All bookings are running smoothly!</p>
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Dispute ID</th>
                      <th>Event</th>
                      <th>Organizer</th>
                      <th>Artist</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Decision</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id}>
                        <td>
                          <span className="fw-bold">#{dispute.id}</span>
                        </td>
                        <td>
                          <div>
                            <div className="fw-bold">{dispute.event_name}</div>
                            <small className="text-muted">
                              {formatDateTime(dispute.event_date)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold">{dispute.organizer_name}</div>
                        </td>
                        <td>
                          <div className="fw-bold">{dispute.artist_name}</div>
                        </td>
                        <td>
                          <Badge bg="warning">
                            {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          {getStatusBadge(dispute.status)}
                        </td>
                        <td>
                          {getDecisionBadge(dispute.admin_decision)}
                        </td>
                        <td>
                          {formatDateTime(dispute.created_at)}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(dispute)}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            {dispute.status === 'admin_investigating' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleStartResolution(dispute)}
                              >
                                <i className="fas fa-gavel"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Dispute Details #{selectedDispute?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDispute && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Event:</strong> {selectedDispute.event_name}
                </Col>
                <Col md={6}>
                  <strong>Date:</strong> {formatDateTime(selectedDispute.event_date)}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Organizer:</strong> {selectedDispute.organizer_name}
                </Col>
                <Col md={6}>
                  <strong>Artist:</strong> {selectedDispute.artist_name}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <strong>Amount:</strong> ${parseFloat(selectedDispute.total_amount || 0).toFixed(2)}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedDispute.status)}
                </Col>
              </Row>

              <div className="mb-3">
                <strong>Organizer's Complaint:</strong>
                <div className="border rounded p-3 mt-2 bg-light">
                  {selectedDispute.dispute_reason}
                </div>
              </div>

              {selectedDispute.artist_response && (
                <div className="mb-3">
                  <strong>Artist's Response:</strong>
                  <div className="border rounded p-3 mt-2 bg-light">
                    {selectedDispute.artist_response}
                  </div>
                </div>
              )}

              {selectedDispute.artist_evidence && (
                <div className="mb-3">
                  <strong>Artist's Evidence:</strong>
                  <div className="border rounded p-3 mt-2 bg-light">
                    {JSON.parse(selectedDispute.artist_evidence).join(', ')}
                  </div>
                </div>
              )}

              {selectedDispute.admin_notes && (
                <div className="mb-3">
                  <strong>Admin Decision Notes:</strong>
                  <div className="border rounded p-3 mt-2 bg-info text-white">
                    {selectedDispute.admin_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedDispute?.status === 'admin_investigating' && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowDetailsModal(false);
                handleStartResolution(selectedDispute);
              }}
            >
              Resolve Dispute
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Resolve Modal */}
      <Modal show={showResolveModal} onHide={() => setShowResolveModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Resolve Dispute #{selectedDispute?.id}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResolveDispute}>
          <Modal.Body>
            <Alert variant="info">
              <strong>Event:</strong> {selectedDispute?.event_name}<br />
              <strong>Amount:</strong> ${parseFloat(selectedDispute?.total_amount || 0).toFixed(2)}
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Decision</Form.Label>
              <Form.Select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                required
              >
                <option value="">Select Decision</option>
                <option value="favor_organizer">Favor Organizer (Full Refund)</option>
                <option value="favor_artist">Favor Artist (Release Payment)</option>
                <option value="partial_refund">Partial Refund</option>
              </Form.Select>
            </Form.Group>

            {decision === 'partial_refund' && (
              <Form.Group className="mb-3">
                <Form.Label>Refund Amount</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain your decision and reasoning..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={resolving}>
              {resolving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Resolving...
                </>
              ) : (
                'Resolve Dispute'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDisputeManagement; 