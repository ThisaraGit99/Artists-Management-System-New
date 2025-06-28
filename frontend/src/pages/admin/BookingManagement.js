import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, Modal, 
  Spinner, Alert, Badge, Pagination, Dropdown, InputGroup,
  ButtonGroup, OverlayTrigger, Tooltip, Toast, ToastContainer
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, current: 1 });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Data states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '', notes: '' });
  const [paymentAction, setPaymentAction] = useState({ action: '', notes: '' });
  const [disputeData, setDisputeData] = useState({ resolution: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const response = await adminService.getAllBookings(currentPage, 10, filters);
      
      if (response.success) {
        setBookings(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
      setError(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBookings();
  };

  // Modal handlers
  const openDetailsModal = async (booking) => {
    try {
      setActionLoading(true);
      const response = await adminService.getBookingDetails(booking.id);
      if (response.success) {
        setBookingDetails(response.data.booking);
        setSelectedBooking(booking);
        setShowDetailsModal(true);
      } else {
        throw new Error(response.message || 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Fetch booking details error:', error);
      showToast(error.message || 'Failed to load booking details', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusUpdateData({ status: booking.status, notes: '' });
    setShowStatusModal(true);
  };

  const openPaymentModal = (booking, action) => {
    setSelectedBooking(booking);
    setPaymentAction({ action, notes: '' });
    setShowPaymentModal(true);
  };

  const openDisputeModal = (booking) => {
    setSelectedBooking(booking);
    setDisputeData({ resolution: '', notes: '' });
    setShowDisputeModal(true);
  };

  const openDeleteModal = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const openRefundModal = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  // Action handlers
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.updateBookingStatus(selectedBooking.id, statusUpdateData.status, statusUpdateData.notes);
      setShowStatusModal(false);
      showToast('Booking status updated successfully');
      fetchBookings();
    } catch (error) {
      console.error('Update booking status error:', error);
      showToast(error.message || 'Failed to update booking status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentAction = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      
      if (paymentAction.action === 'release') {
        await adminService.releasePayment(selectedBooking.id, paymentAction.notes);
        showToast('Payment released to artist successfully');
      } else if (paymentAction.action === 'refund') {
        await adminService.processRefund(selectedBooking.id, paymentAction.notes);
        showToast('Refund processed successfully');
      }
      
      setShowPaymentModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Payment action error:', error);
      showToast(error.message || 'Failed to process payment action', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeResolution = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.resolveDispute(selectedBooking.id, disputeData.resolution, disputeData.notes);
      setShowDisputeModal(false);
      showToast('Dispute resolved successfully');
      fetchBookings();
    } catch (error) {
      console.error('Dispute resolution error:', error);
      showToast(error.message || 'Failed to resolve dispute', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    try {
      setActionLoading(true);
      await adminService.deleteBooking(selectedBooking.id);
      setShowDeleteModal(false);
      showToast('Booking deleted successfully');
      fetchBookings();
    } catch (error) {
      console.error('Delete booking error:', error);
      showToast(error.message || 'Failed to delete booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setActionLoading(true);
      await adminService.processRefund(selectedBooking.id, 'Admin initiated refund');
      setShowRefundModal(false);
      showToast('Refund processed successfully');
      fetchBookings();
    } catch (error) {
      console.error('Refund error:', error);
      showToast(error.message || 'Failed to process refund', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced action buttons function
  const getActionButtons = (booking) => {
    return (
      <div className="d-flex gap-1 flex-wrap">
        {/* View Details - Always available */}
        <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => openDetailsModal(booking)}
          >
            <i className="fas fa-eye"></i>
          </Button>
        </OverlayTrigger>

        {/* Status Update */}
        <OverlayTrigger overlay={<Tooltip>Update Status</Tooltip>}>
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => openStatusModal(booking)}
          >
            <i className="fas fa-edit"></i>
          </Button>
        </OverlayTrigger>

        {/* Payment Actions */}
        {booking.status === 'completed' && !booking.payment_released && (
          <OverlayTrigger overlay={<Tooltip>Release Payment</Tooltip>}>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => openPaymentModal(booking, 'release')}
            >
              <i className="fas fa-dollar-sign"></i>
            </Button>
          </OverlayTrigger>
        )}

        {/* Refund Option */}
        {booking.status !== 'refunded' && booking.payment_status === 'paid' && (
          <OverlayTrigger overlay={<Tooltip>Process Refund</Tooltip>}>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => openRefundModal(booking)}
            >
              <i className="fas fa-undo"></i>
            </Button>
          </OverlayTrigger>
        )}

        {/* Dispute Resolution */}
        {booking.status === 'disputed' && (
          <OverlayTrigger overlay={<Tooltip>Resolve Dispute</Tooltip>}>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => openDisputeModal(booking)}
            >
              <i className="fas fa-gavel"></i>
            </Button>
          </OverlayTrigger>
        )}

        {/* Delete Booking */}
          <OverlayTrigger overlay={<Tooltip>Delete Booking</Tooltip>}>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => openDeleteModal(booking)}
            >
              <i className="fas fa-trash"></i>
            </Button>
          </OverlayTrigger>
      </div>
    );
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'cancelled': return 'secondary';
      case 'in_progress': return 'info';
      case 'completed': return 'primary';
      case 'disputed': return 'warning';
      default: return 'light';
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const variants = {
      'pending': 'secondary',
      'paid': 'success',
      'released': 'primary',
      'refunded': 'warning'
    };
    
    const icons = {
      'pending': 'fas fa-clock',
      'paid': 'fas fa-credit-card',
      'released': 'fas fa-check-circle',
      'refunded': 'fas fa-undo'
    };

    return (
      <Badge bg={variants[paymentStatus] || 'light'} className="d-flex align-items-center gap-1">
        <i className={icons[paymentStatus] || 'fas fa-question'}></i>
        {paymentStatus || 'Unknown'}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return amount ? `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';
  };

  if (loading && bookings.length === 0) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading bookings...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        {success && (
          <Toast bg="success" onClose={() => setSuccess(null)} show={!!success} delay={3000} autohide>
            <Toast.Header closeButton={false}>
              <i className="fas fa-check-circle me-2"></i>
              <strong className="me-auto">Success</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{success}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-calendar-check me-3"></i>
            Booking Management
          </h1>
          <p className="lead text-muted">Monitor and manage all artist bookings</p>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filter Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filters & Search
          </h5>
        </Card.Header>
        <Card.Body>
              <Form onSubmit={handleSearch}>
            <Row className="g-3">
              {/* Search */}
              <Col md={6} lg={4}>
                <Form.Group>
                  <Form.Label>Search Bookings</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                      placeholder="Search by artist, event, or organizer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
                </Form.Group>
            </Col>

              {/* Status Filter */}
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Booking Status</Form.Label>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="disputed">Disputed</option>
              </Form.Select>
                </Form.Group>
            </Col>

              {/* Sort By */}
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
              <Form.Select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                    <option value="created_at">Date Created</option>
                    <option value="event_date">Event Date</option>
                    <option value="status">Status</option>
                    <option value="amount">Amount</option>
              </Form.Select>
                </Form.Group>
            </Col>

              {/* Sort Order */}
              <Col md={6} lg={2}>
                <Form.Group>
                  <Form.Label>Order</Form.Label>
              <Form.Select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
              </Form.Select>
                </Form.Group>
              </Col>

              {/* Action Buttons */}
              <Col xs={12} className="text-end">
                <Button
                  variant="outline-secondary"
                  className="me-2"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('created_at');
                    setSortOrder('DESC');
                  }}
                >
                  <i className="fas fa-undo me-1"></i>
                  Reset Filters
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                >
                  <i className="fas fa-search me-1"></i>
                  Apply Filters
                </Button>
            </Col>
          </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Bookings ({pagination.total || 0})
              </h5>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary" 
                onClick={fetchBookings}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">No bookings found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>📋 Booking ID</th>
                  <th>🎪 Event</th>
                  <th>🎭 Artist</th>
                  <th>👤 Organizer</th>
                  <th>📅 Performance Date</th>
                  <th>💰 Amount</th>
                  <th>📊 Status</th>
                  <th>💳 Payment</th>
                  <th>🛠️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <code className="text-primary">#{booking.id}</code>
                    </td>
                    <td>
                      <div>
                        <strong>{booking.event_title}</strong>
                        <br />
                        <small className="text-muted">{booking.event_type}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{booking.artist_name}</strong>
                        <br />
                        <small className="text-muted">{booking.artist_email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{booking.organizer_name}</strong>
                        <br />
                        <small className="text-muted">{booking.organizer_email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{formatDate(booking.performance_date)}</strong>
                        <br />
                        <small className="text-muted">
                          {booking.performance_duration || 'N/A'} mins
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong className="text-success">{formatCurrency(booking.total_amount)}</strong>
                        {booking.platform_fee && (
                          <>
                            <br />
                            <small className="text-muted">
                              Fee: {formatCurrency(booking.platform_fee)}
                            </small>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(booking.status)} className="d-flex align-items-center gap-1">
                        {booking.status === 'disputed' && <i className="fas fa-exclamation-triangle"></i>}
                        {booking.status}
                      </Badge>
                    </td>
                    <td>
                      {getPaymentStatusBadge(booking.payment_status)}
                    </td>
                    <td>
                      {getActionButtons(booking)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            />
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + i;
              return (
                <Pagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next 
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(pagination.pages)}
              disabled={currentPage === pagination.pages}
            />
          </Pagination>
        </div>
      )}

      {/* Enhanced Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-info-circle me-2 text-primary"></i>
            Booking Details #{selectedBooking?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingDetails ? (
            <Row>
              <Col md={6}>
                <h6 className="text-primary">📋 Booking Information</h6>
                <Table size="sm" className="mb-3">
                  <tbody>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(bookingDetails.status)}>
                          {bookingDetails.status}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Created:</strong></td>
                      <td>{formatDate(bookingDetails.created_at)}</td>
                    </tr>
                    <tr>
                      <td><strong>Performance:</strong></td>
                      <td>{formatDate(bookingDetails.performance_date)}</td>
                    </tr>
                    <tr>
                      <td><strong>Duration:</strong></td>
                      <td>{bookingDetails.performance_duration || 'N/A'} minutes</td>
                    </tr>
                  </tbody>
                </Table>

                <h6 className="text-success">💰 Payment Information</h6>
                <Table size="sm" className="mb-3">
                  <tbody>
                    <tr>
                      <td><strong>Total Amount:</strong></td>
                      <td className="text-success fw-bold">{formatCurrency(bookingDetails.total_amount)}</td>
                    </tr>
                    <tr>
                      <td><strong>Platform Fee:</strong></td>
                      <td>{formatCurrency(bookingDetails.platform_fee)}</td>
                    </tr>
                    <tr>
                      <td><strong>Net to Artist:</strong></td>
                      <td>{formatCurrency(bookingDetails.net_amount)}</td>
                    </tr>
                    <tr>
                      <td><strong>Payment Status:</strong></td>
                      <td>{getPaymentStatusBadge(bookingDetails.payment_status)}</td>
                    </tr>
                    {bookingDetails.payment_date && (
                      <tr>
                        <td><strong>Payment Date:</strong></td>
                        <td>{formatDate(bookingDetails.payment_date)}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6 className="text-info">🎪 Event Details</h6>
                <Table size="sm" className="mb-3">
                  <tbody>
                    <tr>
                      <td><strong>Title:</strong></td>
                      <td>{bookingDetails.event_title}</td>
                    </tr>
                    <tr>
                      <td><strong>Type:</strong></td>
                      <td>{bookingDetails.event_type}</td>
                    </tr>
                    <tr>
                      <td><strong>Location:</strong></td>
                      <td>{bookingDetails.location || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Description:</strong></td>
                      <td>
                        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                          {bookingDetails.event_description || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <h6 className="text-warning">👥 Participants</h6>
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Artist:</strong></td>
                      <td>
                        {bookingDetails.artist_name}
                        <br />
                        <small className="text-muted">{bookingDetails.artist_email}</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Organizer:</strong></td>
                      <td>
                        {bookingDetails.organizer_name}
                        <br />
                        <small className="text-muted">{bookingDetails.organizer_email}</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading booking details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit me-2 text-secondary"></i>
            Update Booking Status
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStatusUpdate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusUpdateData.status}
                onChange={(e) => setStatusUpdateData(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="pending">⏳ Pending</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="in_progress">🎵 In Progress</option>
                <option value="completed">🎉 Completed</option>
                <option value="cancelled">❌ Cancelled</option>
                <option value="rejected">🚫 Rejected</option>
                <option value="disputed">⚠️ Disputed</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusUpdateData.notes}
                onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this status change..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              {actionLoading ? <Spinner animation="border" size="sm" /> : 'Update Status'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Payment Action Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-hand-holding-usd me-2 text-success"></i>
            Payment Action: {paymentAction.action}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaymentAction}>
          <Modal.Body>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              You are about to <strong>{paymentAction.action}</strong> payment for booking #{selectedBooking?.id}
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={paymentAction.notes}
                onChange={(e) => setPaymentAction(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this payment action..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={actionLoading}>
              {actionLoading ? <Spinner animation="border" size="sm" /> : `${paymentAction.action} Payment`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Dispute Resolution Modal */}
      <Modal show={showDisputeModal} onHide={() => setShowDisputeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-gavel me-2 text-warning"></i>
            Resolve Dispute
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDisputeResolution}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Resolution Action</Form.Label>
              <Form.Select
                value={disputeData.resolution}
                onChange={(e) => setDisputeData(prev => ({ ...prev, resolution: e.target.value }))}
                required
              >
                <option value="">Select resolution...</option>
                <option value="favor_artist">✅ Resolve in favor of Artist</option>
                <option value="favor_organizer">✅ Resolve in favor of Organizer</option>
                <option value="partial_refund">💰 Process partial refund</option>
                <option value="full_refund">💸 Process full refund</option>
                <option value="escalate">⬆️ Escalate to senior admin</option>
                <option value="request_info">📋 Request additional information</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Resolution Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={disputeData.notes}
                onChange={(e) => setDisputeData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Detailed explanation of the resolution decision..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDisputeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="warning" disabled={actionLoading}>
              {actionLoading ? <Spinner animation="border" size="sm" /> : 'Resolve Dispute'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-trash me-2 text-danger"></i>
            Delete Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Warning!</strong> This action cannot be undone. Are you sure you want to delete booking #{selectedBooking?.id}?
          </Alert>
          <p>This will permanently remove the booking record from the system.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBooking} disabled={actionLoading}>
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Delete Booking'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-undo me-2 text-warning"></i>
            Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            You are about to process a refund for booking #{selectedBooking?.id}
          </Alert>
          <p>
            <strong>Refund Amount:</strong> {formatCurrency(selectedBooking?.total_amount)}
            <br />
            <strong>Platform Fee:</strong> {formatCurrency(selectedBooking?.platform_fee)} (will be retained)
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleRefund} disabled={actionLoading}>
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Process Refund'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookingManagement; 
