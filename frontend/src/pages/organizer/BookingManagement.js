import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import organizerService from '../../services/organizerService';
import disputeService from '../../services/disputeService';
import RatingModal from '../../components/organizer/RatingModal';

const OrganizerBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await organizerService.getBookings(filters);
      
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        toast.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (booking) => {
    try {
      const response = await organizerService.getBookingDetails(booking.id);
      
      if (response.data.success) {
        setSelectedBooking(response.data.data);
        setShowDetailsModal(true);
      } else {
        toast.error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to fetch booking details');
    }
  };

  const handleMakePayment = async (bookingId) => {
    try {
      setPaymentLoading(true);
      const response = await organizerService.makePayment(bookingId);
      
      if (response.data.success) {
        toast.success('Payment processed successfully! Funds are held in escrow.');
        setShowDetailsModal(false);
        fetchBookings(); // Refresh the list
      } else {
        toast.error(response.data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error making payment:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleConfirmPerformance = async (bookingId) => {
    try {
      setPaymentLoading(true);
      const response = await organizerService.markEventCompleted(bookingId);
      
      if (response.data.success) {
        toast.success('Performance confirmed! Payment released to artist.');
        setShowDetailsModal(false);
        fetchBookings(); // Refresh the list
      } else {
        toast.error(response.data.message || 'Failed to confirm performance');
      }
    } catch (error) {
      console.error('Error confirming performance:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm performance');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReportNonDelivery = (booking) => {
    setSelectedBooking(booking);
    setDisputeDescription('');
    setShowDisputeModal(true);
  };

  const handleReportIssue = (booking) => {
    setSelectedBooking(booking);
    setDisputeDescription('');
    setShowDisputeModal(true);
  };

  const confirmReportIssue = async () => {
    if (!selectedBooking || !disputeDescription.trim()) {
      toast.error('Please provide a description of the issue');
      return;
    }

    try {
      setPaymentLoading(true);
      
      const response = await disputeService.reportNonDelivery(selectedBooking.id, {
        reason: disputeDescription,
        evidence: []
      });

      if (response.success) {
        toast.success('Non-delivery dispute reported successfully. Artist has 2 days to respond.');
        setShowDisputeModal(false);
        setShowDetailsModal(false);
        fetchBookings();
      } else {
        toast.error(response.message || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error(error.message || 'Failed to report issue');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelBooking = (booking) => {
    try {
      const policy = disputeService.calculateCancellationPolicy(booking.event_date, 'organizer');
      setSelectedBooking({...booking, cancellationPolicy: policy});
    } catch (error) {
      console.error('Error calculating cancellation policy:', error);
      setSelectedBooking(booking);
    }
    
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      
      const response = await disputeService.requestCancellation(selectedBooking.id, {
        reason: cancelReason
      });

      if (response.success) {
        const refundInfo = response.data.refundPercentage > 0 
          ? ` You will receive a ${response.data.refundPercentage}% refund ($${response.data.refundAmount}).`
          : ' No refund will be issued due to cancellation policy.';
        
        toast.success(`Booking cancelled successfully.${refundInfo}`);
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason('');
        fetchBookings();
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleRateArtist = async (booking) => {
    try {
      const response = await organizerService.checkBookingRating(booking.id);
      
      if (response.data.hasRated) {
        toast.info('You have already rated this booking');
        return;
      }

      setSelectedBooking(booking);
      setShowRatingModal(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // No rating found, allow to rate
        setSelectedBooking(booking);
        setShowRatingModal(true);
      } else {
        console.error('Error checking rating:', error);
        toast.error('Failed to check rating status');
      }
    }
  };

  const handleSubmitRating = async (rating, review) => {
    try {
      setRatingLoading(true);
      const response = await organizerService.submitArtistRating(selectedBooking.id, rating, review);
      
      if (response.data.success) {
        toast.success('Rating submitted successfully');
        setShowRatingModal(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        toast.error(response.data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', icon: 'clock', text: 'Pending' },
      confirmed: { variant: 'success', icon: 'check-circle', text: 'Confirmed' },
      cancelled: { variant: 'danger', icon: 'times-circle', text: 'Cancelled' },
      completed: { variant: 'info', icon: 'flag-checkered', text: 'Completed' },
      disputed: { variant: 'warning', icon: 'exclamation-triangle', text: 'Disputed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge bg={config.variant} className="d-flex align-items-center">
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { variant: 'secondary', text: 'Payment Pending' },
      paid: { variant: 'primary', text: 'Payment Made' },
      released: { variant: 'success', text: 'Payment Released' },
      refunded: { variant: 'danger', text: 'Refunded' }
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    
    return (
      <Badge bg={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const renderPaymentActions = (booking) => {
    if (!booking) return null;

    if (booking.status === 'confirmed' && booking.payment_status === 'pending') {
      return (
        <Button 
          variant="success" 
          onClick={() => handleMakePayment(booking.id)}
          disabled={paymentLoading}
          className="mb-2"
        >
          {paymentLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              💳 Make Payment (${parseFloat(booking.total_amount).toFixed(2)})
            </>
          )}
        </Button>
      );
    }

    if (booking.payment_status === 'paid' && !['completed', 'not_delivered', 'disputed', 'under_investigation'].includes(booking.status)) {
      return (
        <div className="d-flex gap-2 mb-2">
          <Button 
            variant="success" 
            onClick={() => handleConfirmPerformance(booking.id)}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                ✅ Confirm Performance
              </>
            )}
          </Button>
          {booking.payment_status === 'paid' && 
           booking.payment_status !== 'released' &&
           !['not_delivered', 'disputed', 'under_investigation', 'refunded'].includes(booking.status) && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => handleReportNonDelivery(booking)}
              title="Report Non-Delivery"
            >
              <i className="fas fa-exclamation-triangle"></i>
            </Button>
          )}
        </div>
      );
    }

    if (booking.payment_status === 'released' || booking.status === 'payment_released') {
      return (
        <Alert variant="success" className="mb-2">
          ✅ Payment Released - Event Completed Successfully
        </Alert>
      );
    }

    if (booking.payment_status === 'refunded' || booking.status === 'refunded') {
      return (
        <Alert variant="info" className="mb-2">
          💰 Payment Refunded
        </Alert>
      );
    }

    if (booking.status === 'not_delivered') {
      return (
        <Alert variant="warning" className="mb-2">
          ⏳ Non-delivery reported. Artist has 2 days to respond.
        </Alert>
      );
    }

    if (booking.status === 'disputed') {
      return (
        <Alert variant="warning" className="mb-2">
          ⚠️ Artist disputed the claim. Awaiting admin review.
        </Alert>
      );
    }

    if (booking.status === 'under_investigation') {
      return (
        <Alert variant="info" className="mb-2">
          🔍 Under Admin Investigation
        </Alert>
      );
    }

    return null;
  };

  const formatDateTime = (date, time) => {
    try {
      if (!date) return 'N/A';
      const dateStr = time ? `${date} ${time}` : date;
      return format(new Date(dateStr), 'MMM dd, yyyy' + (time ? ' HH:mm' : ''));
    } catch {
      return 'Invalid Date';
    }
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading bookings...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-calendar-check me-3"></i>
            My Booking Requests
          </h1>
          <p className="lead text-muted">
            Manage your artist booking requests and track their status
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </Form.Select>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {bookings.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                  <h4>No booking requests found</h4>
                  <p className="text-muted">
                    Start by browsing artists and sending your first booking request!
                  </p>
                  <Button variant="primary" href="/artists">
                    <i className="fas fa-search me-2"></i>
                    Find Artists
                  </Button>
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Event</th>
                      <th>Artist</th>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div>
                            <h6 className="mb-1">{booking.event_name}</h6>
                            {booking.venue_address && (
                              <small className="text-muted">
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {booking.venue_address.substring(0, 50)}
                                {booking.venue_address.length > 50 ? '...' : ''}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-bold">{booking.artist_name}</div>
                            <small className="text-muted">{booking.artist_email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{formatDateTime(booking.event_date)}</div>
                            <small className="text-muted">
                              {booking.event_time && format(new Date(`2000-01-01 ${booking.event_time}`), 'HH:mm')}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold">
                            {booking.total_amount ? `$${parseFloat(booking.total_amount).toFixed(2)}` : 'N/A'}
                          </span>
                        </td>
                        <td>
                          {booking.payment_status === 'paid' ? (
                            <div>
                              <Badge bg="primary" className="mb-1">
                                💳 Payment Made
                              </Badge>
                              <br />
                              <small className="text-muted">Status: {booking.status}</small>
                            </div>
                          ) : booking.payment_status === 'released' ? (
                            <div>
                              <Badge bg="success" className="mb-1">
                                ✅ Payment Released
                              </Badge>
                              <br />
                              <small className="text-muted">Event Completed</small>
                            </div>
                          ) : booking.status === 'disputed' ? (
                            <div>
                              <Badge bg="warning" className="mb-1">
                                ⚠️ Disputed
                              </Badge>
                              <br />
                              <small className="text-muted">Under Review</small>
                            </div>
                          ) : (
                            getStatusBadge(booking.status)
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            
                            {booking.status === 'confirmed' && booking.payment_status === 'pending' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleMakePayment(booking.id)}
                                title="Make Payment"
                              >
                                <i className="fas fa-credit-card"></i>
                              </Button>
                            )}
                            
                            {booking.payment_status === 'paid' && 
                             booking.payment_status !== 'released' && 
                             !['not_delivered', 'disputed', 'under_investigation'].includes(booking.status) && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleConfirmPerformance(booking.id)}
                                title="Confirm Performance"
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                            )}
                            
                            {booking.payment_status === 'paid' && 
                             booking.payment_status !== 'released' &&
                             !['not_delivered', 'disputed', 'under_investigation', 'refunded'].includes(booking.status) && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleReportNonDelivery(booking)}
                                title="Report Non-Delivery"
                              >
                                <i className="fas fa-exclamation-triangle"></i>
                              </Button>
                            )}
                            
                            {canCancelBooking(booking) && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                title="Cancel Booking"
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            )}
                            
                            {booking.status === 'completed' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleRateArtist(booking)}
                              >
                                Rate Artist
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

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <Row>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Event Information</h6>
                <p><strong>Event Name:</strong> {selectedBooking.event_name}</p>
                <p><strong>Date:</strong> {formatDateTime(selectedBooking.event_date)}</p>
                <p><strong>Time:</strong> {selectedBooking.event_time}</p>
                {selectedBooking.duration && (
                  <p><strong>Duration:</strong> {selectedBooking.duration}</p>
                )}
                {selectedBooking.venue_address && (
                  <p><strong>Venue:</strong> {selectedBooking.venue_address}</p>
                )}
                {selectedBooking.event_description && (
                  <p><strong>Description:</strong> {selectedBooking.event_description}</p>
                )}
              </Col>
              
              <Col md={6}>
                <h6 className="fw-bold mb-3">Artist Information</h6>
                <p><strong>Name:</strong> {selectedBooking.artist_name}</p>
                <p><strong>Email:</strong> {selectedBooking.artist_email}</p>
                {selectedBooking.artist_phone && (
                  <p><strong>Phone:</strong> {selectedBooking.artist_phone}</p>
                )}
                {selectedBooking.artist_location && (
                  <p><strong>Location:</strong> {selectedBooking.artist_location}</p>
                )}
                
                <h6 className="fw-bold mb-3 mt-4">Booking Information</h6>
                <p><strong>Status:</strong> 
                  {selectedBooking.payment_status === 'paid' ? (
                    <span>
                      <Badge bg="primary" className="ms-2">💳 Payment Made</Badge>
                      <br />
                      <small className="text-muted">Booking Status: {selectedBooking.status}</small>
                    </span>
                  ) : selectedBooking.payment_status === 'released' ? (
                    <span>
                      <Badge bg="success" className="ms-2">✅ Payment Released</Badge>
                      <br />
                      <small className="text-muted">Event Completed</small>
                    </span>
                  ) : selectedBooking.status === 'disputed' ? (
                    <span>
                      <Badge bg="warning" className="ms-2">⚠️ Disputed</Badge>
                      <br />
                      <small className="text-muted">Under Admin Review</small>
                    </span>
                  ) : (
                    getStatusBadge(selectedBooking.status)
                  )}
                </p>
                {selectedBooking.payment_status && (
                  <p><strong>Payment:</strong> {getPaymentStatusBadge(selectedBooking.payment_status)}</p>
                )}
                {selectedBooking.total_amount && (
                  <p><strong>Amount:</strong> ${parseFloat(selectedBooking.total_amount).toFixed(2)}</p>
                )}
                {selectedBooking.platform_fee && (
                  <p><strong>Platform Fee:</strong> ${parseFloat(selectedBooking.platform_fee).toFixed(2)} (10%)</p>
                )}
                {selectedBooking.net_amount && (
                  <p><strong>Artist Receives:</strong> ${parseFloat(selectedBooking.net_amount).toFixed(2)}</p>
                )}
                {selectedBooking.package_title && (
                  <p><strong>Package:</strong> {selectedBooking.package_title}</p>
                )}
                {selectedBooking.payment_date && (
                  <p><strong>Payment Date:</strong> {formatDateTime(selectedBooking.payment_date)}</p>
                )}
                {selectedBooking.completion_date && (
                  <p><strong>Completion Date:</strong> {formatDateTime(selectedBooking.completion_date)}</p>
                )}
              </Col>
              
              {selectedBooking.special_requirements && (
                <Col md={12} className="mt-3">
                  <h6 className="fw-bold mb-3">Special Requirements</h6>
                  <p>{selectedBooking.special_requirements}</p>
                </Col>
              )}
            </Row>
          )}
          {renderPaymentActions(selectedBooking)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <Alert variant="warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Are you sure you want to cancel the booking for <strong>{selectedBooking.event_name}</strong>?
              </Alert>
              
              <Form.Group>
                <Form.Label>Cancellation Reason (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={cancelling}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={confirmCancelBooking} disabled={cancelling}>
            {cancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDisputeModal} onHide={() => setShowDisputeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Report Issue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <Alert variant="warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Are you sure you want to report an issue for the booking for <strong>{selectedBooking.event_name}</strong>?
              </Alert>
              
              <Form.Group>
                <Form.Label>Issue Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Please provide a description of the issue..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisputeModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmReportIssue}>
            Report Issue
          </Button>
        </Modal.Footer>
      </Modal>

      <RatingModal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        booking={selectedBooking}
        onSuccess={() => {
          setShowRatingModal(false);
          fetchBookings();
        }}
      />
    </Container>
  );
};

export default OrganizerBookingManagement; 
