import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, Alert, InputGroup } from 'react-bootstrap';
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
    payment_status: '',
    artist_name: '',
    date_from: '',
    date_to: '',
    sort_by: 'newest',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      payment_status: '',
      artist_name: '',
      date_from: '',
      date_to: '',
      sort_by: 'newest',
      page: 1,
      limit: 10
    });
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
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'danger',
      completed: 'success',
      disputed: 'warning',
      in_progress: 'info'
    };
    return variants[status?.toLowerCase()] || 'secondary';
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const variants = {
      pending: 'warning',
      paid: 'info',
      released: 'success',
      refunded: 'secondary',
      disputed: 'danger',
      cancelled: 'danger'
    };
    return variants[paymentStatus?.toLowerCase()] || 'secondary';
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
    <Container className="py-4 px-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">
              <i className="fas fa-calendar-check me-2 text-primary"></i>
            My Booking Requests
            </h2>
            <div>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter me-1"></i>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button 
                variant="outline-primary"
                onClick={fetchBookings}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <Card className="mb-4 shadow-sm mx-0">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-sliders-h me-2"></i>
                    Filter Bookings
                  </h5>
                  <Button 
                    variant="link" 
                    className="text-muted p-0" 
                    onClick={clearFilters}
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {/* Status Filter */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Booking Status</Form.Label>
          <Form.Select
            value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="disputed">Disputed</option>
          </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Payment Status Filter */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Payment Status</Form.Label>
                      <Form.Select
                        value={filters.payment_status}
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                      >
                        <option value="">All Payment Statuses</option>
                        <option value="pending">Pending Payment</option>
                        <option value="paid">Paid</option>
                        <option value="released">Released</option>
                        <option value="refunded">Refunded</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Artist Name Search */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Artist Name</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="fas fa-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by artist name..."
                          value={filters.artist_name}
                          onChange={(e) => handleFilterChange('artist_name', e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Date Range */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  {/* Sort By */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Sort By</Form.Label>
                      <Form.Select
                        value={filters.sort_by}
                        onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="event_date">Event Date</option>
                        <option value="amount_high">Amount (High to Low)</option>
                        <option value="amount_low">Amount (Low to High)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Results Per Page */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Results Per Page</Form.Label>
                      <Form.Select
                        value={filters.limit}
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                      >
                        <option value="5">5 per page</option>
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                      </Form.Select>
                    </Form.Group>
        </Col>
      </Row>
              </Card.Body>
            </Card>
          )}

          {/* Bookings Summary */}
          <Card className="mb-4 shadow-sm mx-0">
            <Card.Body>
      <Row>
                <Col sm={6} md={3} className="mb-3 mb-md-0">
                  <div className="text-center">
                    <h3 className="text-primary mb-1">
                      {bookings.filter(b => b.status === 'pending').length}
                    </h3>
                    <small className="text-muted">Pending Requests</small>
                  </div>
                </Col>
                <Col sm={6} md={3} className="mb-3 mb-md-0">
                  <div className="text-center">
                    <h3 className="text-success mb-1">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </h3>
                    <small className="text-muted">Confirmed Bookings</small>
                  </div>
                </Col>
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <h3 className="text-info mb-1">
                      {bookings.filter(b => b.status === 'completed').length}
                    </h3>
                    <small className="text-muted">Completed Events</small>
                  </div>
                </Col>
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <h3 className="text-warning mb-1">
                      {bookings.filter(b => b.payment_status === 'pending').length}
                    </h3>
                    <small className="text-muted">Pending Payments</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Bookings Table */}
          <Card className="mx-0">
            <Card.Header className="bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-check me-2"></i>
                  Your Booking Requests
                  {bookings.length > 0 && (
                    <Badge bg="secondary" className="ms-2">
                      {bookings.length}
                    </Badge>
                  )}
                </h5>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading bookings...</span>
                  </Spinner>
                  <p className="mt-3">Loading your booking requests...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h5>No booking requests found</h5>
                  <p className="text-muted">
                    You haven't made any booking requests yet
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                        <th className="px-4">Artist Details</th>
                      <th>Event</th>
                      <th>Date & Time</th>
                        <th>Payment</th>
                      <th>Status</th>
                        <th className="px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {bookings.map(booking => (
                      <tr key={booking.id}>
                          <td className="px-4">
                            <div className="d-flex align-items-center">
                          <div>
                                <h6 className="mb-1">{booking.artist_name}</h6>
                              <small className="text-muted">
                                  <i className="fas fa-tag me-1"></i>
                                  {booking.artist_type || 'Artist'}
                              </small>
                              </div>
                          </div>
                        </td>
                        <td>
                          <div>
                              <h6 className="mb-1">{booking.event_name}</h6>
                              <small className="text-muted">
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {booking.venue_name || 'Venue TBD'}
                              </small>
                          </div>
                        </td>
                        <td>
                          <div>
                              <div className="mb-1">
                                <i className="fas fa-calendar-day me-1 text-muted"></i>
                                {formatDateTime(booking.event_date, booking.start_time)}
                              </div>
                            <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {booking.duration} hours
                            </small>
                          </div>
                        </td>
                        <td>
                            <div>
                              <h6 className="mb-1 text-success">
                                <i className="fas fa-dollar-sign me-1"></i>
                                {booking.total_amount}
                              </h6>
                              <Badge 
                                bg={getPaymentStatusBadge(booking.payment_status)}
                                className="text-dark"
                              >
                                {booking.payment_status}
                              </Badge>
                            </div>
                        </td>
                        <td>
                            <Badge 
                              bg={getStatusBadge(booking.status)}
                              className="text-dark"
                            >
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-4">
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
                </div>
              )}
            </Card.Body>
          </Card>

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
        </Col>
      </Row>
    </Container>
  );
};

export default OrganizerBookingManagement; 
