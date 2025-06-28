import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, Modal, 
  Spinner, Alert, Badge, Pagination, Dropdown, InputGroup 
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.event_type = typeFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const response = await adminService.getAllEvents(currentPage, 10, filters);
      
      if (response.success) {
        setEvents(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Fetch events error:', error);
      setError(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      setActionLoading(true);
      await adminService.updateEventStatus(eventId, newStatus);
      fetchEvents();
    } catch (error) {
      console.error('Update event status error:', error);
      setError(error.message || 'Failed to update event status');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsModal = async (event) => {
    try {
      setActionLoading(true);
      const response = await adminService.getEventDetails(event.id);
      setSelectedEvent(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      setError(error.message || 'Failed to load event details');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await adminService.deleteEvent(selectedEvent.id);
      setShowDeleteModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      setError(error.message || 'Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'published': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'light';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading && events.length === 0) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading events...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-calendar-alt me-3"></i>
            Event Management
          </h1>
          <p className="lead text-muted">Manage and monitor all system events</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="published">Published</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate</option>
                <option value="concert">Concert</option>
                <option value="party">Party</option>
                <option value="festival">Festival</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date Created</option>
                <option value="event_date">Event Date</option>
                <option value="title">Title</option>
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

      {/* Events Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                Events ({pagination.total || 0})
              </h5>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={fetchEvents}
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
          ) : events.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
              <p className="text-muted">No events found</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Event Details</th>
                  <th>Organizer</th>
                  <th>Date & Location</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td>
                      <div>
                        <div className="fw-bold">{event.title}</div>
                        <small className="text-muted">
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="border me-1"
                            style={{ fontSize: '0.85em' }}
                          >
                            {event.event_type}
                          </Badge>
                          {event.description?.substring(0, 50)}...
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{event.organizer_name}</div>
                        <small className="text-muted">{event.organizer_email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div><i className="fas fa-calendar me-1"></i>{formatDate(event.event_date)}</div>
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {event.venue_city}, {event.venue_state}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        {event.budget_min && event.budget_max
                          ? `${formatCurrency(event.budget_min)} - ${formatCurrency(event.budget_max)}`
                          : event.budget_min 
                            ? `From ${formatCurrency(event.budget_min)}`
                            : 'Not specified'
                        }
                      </div>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle 
                          as={Badge} 
                          bg={getStatusBadgeVariant(event.status)}
                          style={{ cursor: 'pointer' }}
                          disabled={actionLoading}
                        >
                          {event.status.replace('_', ' ').toUpperCase()}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item 
                            onClick={() => handleStatusChange(event.id, 'planning')}
                            disabled={event.status === 'planning'}
                          >
                            Planning
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleStatusChange(event.id, 'published')}
                            disabled={event.status === 'published'}
                          >
                            Published
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleStatusChange(event.id, 'in_progress')}
                            disabled={event.status === 'in_progress'}
                          >
                            In Progress
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleStatusChange(event.id, 'completed')}
                            disabled={event.status === 'completed'}
                          >
                            Completed
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleStatusChange(event.id, 'cancelled')}
                            disabled={event.status === 'cancelled'}
                          >
                            Cancelled
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Badge bg="secondary">{event.total_bookings || 0}</Badge>
                        {event.pending_bookings > 0 && (
                          <Badge bg="warning">{event.pending_bookings}</Badge>
                        )}
                        {event.confirmed_bookings > 0 && (
                          <Badge bg="success">{event.confirmed_bookings}</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          <i className="fas fa-ellipsis-v"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openDetailsModal(event)}>
                            <i className="fas fa-eye me-2"></i>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => openDeleteModal(event)}
                          >
                            <i className="fas fa-trash me-2"></i>
                            Delete Event
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
                  {pagination.total} events
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

      {/* Event Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Event Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <Row>
              <Col md={8}>
                <h4>{selectedEvent.title}</h4>
                <p className="text-muted">{selectedEvent.description}</p>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Event Type:</strong> {selectedEvent.event_type}<br />
                    <strong>Date:</strong> {formatDate(selectedEvent.event_date)}<br />
                    <strong>Time:</strong> {selectedEvent.start_time} - {selectedEvent.end_time || 'N/A'}
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong> <Badge bg={getStatusBadgeVariant(selectedEvent.status)}>
                      {selectedEvent.status.replace('_', ' ').toUpperCase()}
                    </Badge><br />
                    <strong>Public:</strong> {selectedEvent.is_public ? 'Yes' : 'No'}<br />
                    <strong>Created:</strong> {formatDate(selectedEvent.created_at)}
                  </Col>
                </Row>

                <h5>Venue Information</h5>
                <p>
                  <strong>{selectedEvent.venue_name}</strong><br />
                  {selectedEvent.venue_address}<br />
                  {selectedEvent.venue_city}, {selectedEvent.venue_state} {selectedEvent.venue_country}
                </p>

                <h5>Budget</h5>
                <p>
                  {selectedEvent.budget_min && selectedEvent.budget_max
                    ? `${formatCurrency(selectedEvent.budget_min)} - ${formatCurrency(selectedEvent.budget_max)}`
                    : selectedEvent.budget_min 
                      ? `From ${formatCurrency(selectedEvent.budget_min)}`
                      : 'Not specified'
                  }
                </p>

                {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                  <>
                    <h5>Requirements</h5>
                    <ul>
                      {selectedEvent.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Col>
              <Col md={4}>
                <h5>Organizer Information</h5>
                <p>
                  <strong>{selectedEvent.organizer_name}</strong><br />
                  {selectedEvent.organizer_email}<br />
                  {selectedEvent.organizer_phone}<br />
                  {selectedEvent.organization_name && (
                    <>
                      <small className="text-muted">
                        {selectedEvent.organization_name}
                        {selectedEvent.organization_type && ` (${selectedEvent.organization_type})`}
                      </small>
                    </>
                  )}
                </p>

                {selectedEvent.bookings && selectedEvent.bookings.length > 0 && (
                  <>
                    <h6>Recent Bookings</h6>
                    <div className="list-group list-group-flush">
                      {selectedEvent.bookings.slice(0, 5).map((booking, index) => (
                        <div key={index} className="list-group-item px-0">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{booking.artist_name}</strong>
                              <br />
                              <small className="text-muted">{booking.artist_email}</small>
                            </div>
                            <Badge bg={booking.status === 'confirmed' ? 'success' : 
                                      booking.status === 'pending' ? 'warning' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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

      {/* Delete Event Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5>Are you sure?</h5>
            <p className="text-muted">
              This action cannot be undone. This will permanently delete the event and cancel all related bookings:
            </p>
            <div className="bg-light p-3 rounded">
              <strong>{selectedEvent?.title}</strong><br />
              <small className="text-muted">
                {selectedEvent?.event_date} • {selectedEvent?.venue_city}, {selectedEvent?.venue_state}
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Delete Event
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventManagement; 