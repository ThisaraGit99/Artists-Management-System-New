import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import disputeService from '../../services/disputeService';

const DisputeResponseModal = ({ show, onHide, dispute, onSuccess }) => {
  const [response, setResponse] = useState('');
  const [action, setAction] = useState(''); // 'approve' or 'dispute'
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if (!response.trim()) {
      toast.error('Please provide a response');
      return;
    }

    if (action === 'dispute' && !evidence.trim()) {
      toast.error('Please provide evidence for your dispute');
      return;
    }

    try {
      setLoading(true);
      
      const responseData = {
        response,
        action,
        evidence: action === 'dispute' ? evidence : null
      };

      const result = await disputeService.respondToDispute(dispute.id, responseData);
      
      if (result.success) {
        toast.success(
          action === 'approve' 
            ? 'You have acknowledged non-delivery. Refund will be processed.'
            : 'Your dispute has been submitted for admin review.'
        );
        onSuccess();
        onHide();
      } else {
        toast.error(result.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting dispute response:', error);
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResponse('');
    setAction('');
    setEvidence('');
    onHide();
  };

  if (!dispute) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-exclamation-triangle text-warning me-2"></i>
          Respond to Non-Delivery Report
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="warning">
          <strong>Non-Delivery Reported:</strong> The event organizer has reported that you did not perform at the event.
          <br />
          <strong>Event:</strong> {dispute.booking?.event_name}
          <br />
          <strong>Date:</strong> {dispute.booking?.event_date}
          <br />
          <strong>Reason:</strong> {dispute.dispute_reason}
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Your Response</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Explain your side of the situation..."
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Action</Form.Label>
            <div>
              <Form.Check
                type="radio"
                name="action"
                id="approve"
                label="I acknowledge that I did not perform as agreed"
                value="approve"
                checked={action === 'approve'}
                onChange={(e) => setAction(e.target.value)}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                name="action"
                id="dispute"
                label="I dispute this claim - I performed as agreed"
                value="dispute"
                checked={action === 'dispute'}
                onChange={(e) => setAction(e.target.value)}
              />
            </div>
          </Form.Group>

          {action === 'approve' && (
            <Alert variant="info">
              <strong>Note:</strong> By acknowledging non-delivery, the full payment will be refunded to the organizer.
            </Alert>
          )}

          {action === 'dispute' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Evidence/Proof of Performance</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Provide detailed evidence that you performed (photos, videos, witness contacts, receipts, etc.)"
                  required
                />
                <Form.Text className="text-muted">
                  Provide as much detail as possible. Admin will review all evidence before making a decision.
                </Form.Text>
              </Form.Group>
              
              <Alert variant="warning">
                <strong>Important:</strong> Your case will be reviewed by an admin. Payment will remain in escrow until a decision is made.
              </Alert>
            </>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant={action === 'approve' ? 'warning' : 'primary'}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                action === 'approve' ? 'Acknowledge Non-Delivery' : 'Submit Dispute'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default DisputeResponseModal; 