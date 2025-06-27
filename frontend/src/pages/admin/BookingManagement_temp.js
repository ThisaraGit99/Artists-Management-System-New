import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, Modal, 
  Spinner, Alert, Badge, Pagination, Dropdown, InputGroup 
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBookings();
  };

  const openDetailsModal = async (booking) => {
    try {
      setActionLoading(true);
      const response = await adminService.getBookingDetails(booking.id);
      if (response.success) {
        setBookingDetails(response.data);
        setSelectedBooking(booking);
        setShowDetailsModal(true);
      } else {
        throw new Error(response.message || 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Fetch booking details error:', error);
      setError(error.message || 'Failed to load booking details');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusUpdateData({ status: booking.status, notes: '' });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.updateBookingStatus(selectedBooking.id, statusUpdateData.status, statusUpdateData.notes);
      setShowStatusModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Update booking status error:', error);
      setError(error.message || 'Failed to update booking status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'cancelled': return 'secondary';
      case 'in_progress': return 'info';
      case 'completed': return 'primary';
      default: return 'light';
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
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
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6 fw-bold text-primary">
            <i className="fas fa-calendar-check me-3"></i>
            Booking Management
          </h1>
          <p className="lead text-muted">Manage all artist bookings and events</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date Created</option>
                <option value="performance_date">Performance Date</option>
                <option value="event_title">Event Title</option>
                <option value="status">Status</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                Bookings ({pagination.total || 0})
              </h5>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={fetchBookings}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
              <p className="text-muted">No bookings found</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Event & Artist</th>
                  <th>Performance Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <div className="fw-bold">{booking.event_title}</div>
                        <small className="text-muted">
                          <i className="fas fa-microphone me-1"></i>
                          {booking.artist_name}
                        </small>
                        <br />
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {booking.organizer_name}
                        </small>
                        <br />
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {booking.venue_name}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold">
                        {new Date(booking.performance_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <small className="text-muted">
                        {booking.performance_start_time ? 
                          new Date(`2000-01-01T${booking.performance_start_time}`).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Time TBD'
                        }
                      </small>
                    </td>
                    <td>
                      <div className="fw-bold">
                        {formatCurrency(booking.final_fee || booking.proposed_fee)}
                      </div>
                      {booking.final_fee && booking.proposed_fee && booking.final_fee !== booking.proposed_fee && (
                        <small className="text-muted">
                          Proposed: {formatCurrency(booking.proposed_fee)}
                        </small>
                      )}
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
                        <Badge bg={getStatusBadgeVariant(booking.status)}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <small>
                        {new Date(booking.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </small>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          <i className="fas fa-ellipsis-v"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openDetailsModal(booking)}>
                            <i className="fas fa-eye me-2"></i>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openStatusModal(booking)}>
                            <i className="fas fa-edit me-2"></i>
                            Update Status
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Card.Footer className="bg-white">
            <Row className="align-items-center">
              <Col>
                <small className="text-muted">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} bookings
                </small>
              </Col>
              <Col xs="auto">
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={pagination.current_page <= 1}
                    onClick={() => setCurrentPage(pagination.current_page - 1)}
                  />
                  {[...Array(pagination.total_pages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === pagination.current_page}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={pagination.current_page >= pagination.total_pages}
                    onClick={() => setCurrentPage(pagination.current_page + 1)}
                  />
                </Pagination>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>

      {/* Booking Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingDetails && (
            <Row>
              <Col md={6}>
                <h6 className="fw-bold">Event Information</h6>
                <p><strong>Title:</strong> {bookingDetails.booking.event_title}</p>
                <p><strong>Date:</strong> {new Date(bookingDetails.booking.event_date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> {bookingDetails.booking.venue_name}</p>
                <p><strong>Address:</strong> {bookingDetails.booking.venue_address}</p>
                
                <h6 className="fw-bold mt-4">Financial Details</h6>
                <p><strong>Proposed Fee:</strong> {formatCurrency(bookingDetails.booking.proposed_fee)}</p>
                {bookingDetails.booking.final_fee && (
                  <p><strong>Final Fee:</strong> {formatCurrency(bookingDetails.booking.final_fee)}</p>
                )}
              </Col>
              <Col md={6}>
                <h6 className="fw-bold">Artist</h6>
                <p><strong>Name:</strong> {bookingDetails.booking.artist_name}</p>
                <p><strong>Email:</strong> {bookingDetails.booking.artist_email}</p>
                
                <h6 className="fw-bold mt-4">Organizer</h6>
                <p><strong>Name:</strong> {bookingDetails.booking.organizer_name}</p>
                <p><strong>Email:</strong> {bookingDetails.booking.organizer_email}</p>
                
                <h6 className="fw-bold mt-4">Status</h6>
                <p>
                  <Badge bg={getStatusBadgeVariant(bookingDetails.booking.status)}>
                    {bookingDetails.booking.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </p>
              </Col>
            </Row>
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
          <Modal.Title>Update Booking Status</Modal.Title>
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
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusUpdateData.notes}
                onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this status change..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default BookingManagement;