import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Badge, 
  Alert,
  Modal,
  Spinner,
  Nav
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import eventService from '../../services/eventService';
import eventApplicationService from '../../services/eventApplicationService';
import CreateEventForm from './CreateEventForm';
import EditEventForm from './EditEventForm';
import EventDetailsModal from './EventDetailsModal';

const EventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Applications state
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getOrganizerEvents();
      setEvents(response.events || []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await eventService.createEvent(eventData);
      setShowCreateModal(false);
      loadEvents();
    } catch (err) {
      throw err;
    }
  };

  const handleEditEvent = async (eventData) => {
    try {
      await eventService.updateEvent(selectedEvent.id, eventData);
      setShowEditModal(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await eventService.deleteEvent(selectedEvent.id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  // Application management functions
  const loadApplications = async (event) => {
    try {
      setLoadingApplications(true);
      setSelectedEvent(event);
      const response = await eventApplicationService.getEventApplications(event.id, applicationFilter);
      setApplications(response.data.applications || []);
      setShowApplicationsModal(true);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await eventApplicationService.approveApplication(selectedEvent.id, applicationId, 'Application approved');
      loadApplications(selectedEvent); // Reload applications
      loadEvents(); // Refresh event stats
    } catch (err) {
      setError(err.message || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await eventApplicationService.rejectApplication(selectedEvent.id, applicationId, 'Application rejected');
      loadApplications(selectedEvent); // Reload applications
      loadEvents(); // Refresh event stats
    } catch (err) {
      setError(err.message || 'Failed to reject application');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      planning: 'secondary',
      published: 'primary',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'all': return events;
      case 'active': return events.filter(e => e.status === 'planning' || e.status === 'published');
      case 'progress': return events.filter(e => e.status === 'in_progress');
      case 'completed': return events.filter(e => e.status === 'completed');
      default: return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading events...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-6 fw-bold">
                <i className="fas fa-calendar-alt me-3 text-primary"></i>
                Event Management
              </h1>
              <p className="lead text-muted">
                Create and manage your events, track bookings and applications
              </p>
            </div>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Create Event
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-alt fa-3x text-primary mb-3"></i>
              <h3 className="fw-bold text-primary">{events.length}</h3>
              <p className="text-muted mb-0">Total Events</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check fa-3x text-warning mb-3"></i>
              <h3 className="fw-bold text-warning">
                {events.filter(e => e.status === 'published').length}
              </h3>
              <p className="text-muted mb-0">Published</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-users fa-3x text-info mb-3"></i>
              <h3 className="fw-bold text-info">
                {events.reduce((sum, e) => sum + (e.total_bookings || 0), 0)}
              </h3>
              <p className="text-muted mb-0">Total Applications</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-handshake fa-3x text-success mb-3"></i>
              <h3 className="fw-bold text-success">
                {events.reduce((sum, e) => sum + (e.confirmed_bookings || 0), 0)}
              </h3>
              <p className="text-muted mb-0">Confirmed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs */}
      <Card className="mb-4">
        <Card.Header className="bg-white border-0">
          <Nav variant="tabs" className="border-0">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'all'} 
                onClick={() => setActiveTab('all')}
                className="text-decoration-none"
              >
                All Events ({events.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'active'} 
                onClick={() => setActiveTab('active')}
                className="text-decoration-none"
              >
                Active ({events.filter(e => e.status === 'planning' || e.status === 'published').length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'progress'} 
                onClick={() => setActiveTab('progress')}
                className="text-decoration-none"
              >
                In Progress ({events.filter(e => e.status === 'in_progress').length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'completed'} 
                onClick={() => setActiveTab('completed')}
                className="text-decoration-none"
              >
                Completed ({events.filter(e => e.status === 'completed').length})
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        <Card.Body>
          {/* Events Table */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-alt fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No events found</h5>
              <p className="text-muted">
                {activeTab === 'all' 
                  ? "You haven't created any events yet. Create your first event to get started!"
                  : "No events match the current filter."
                }
              </p>
              {activeTab === 'all' && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Your First Event
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div>
                          <h6 className="mb-1 fw-bold">{event.title}</h6>
                          <small className="text-muted">
                            {event.description?.substring(0, 50)}...
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="outline-secondary" className="border">
                          <i className="fas fa-calendar me-1"></i>
                          {event.event_type}
                        </Badge>
                      </td>
                      <td>
                        <i className="fas fa-calendar-day me-1 text-muted"></i>
                        {formatDate(event.event_date)}
                      </td>
                      <td>
                        <i className="fas fa-map-marker-alt me-1 text-muted"></i>
                        {event.venue_city}, {event.venue_state}
                      </td>
                      <td>
                        <i className="fas fa-dollar-sign me-1 text-muted"></i>
                        {event.budget_min && event.budget_max
                          ? `${formatCurrency(event.budget_min)} - ${formatCurrency(event.budget_max)}`
                          : event.budget_min 
                            ? `From ${formatCurrency(event.budget_min)}`
                            : 'Not specified'
                        }
                      </td>
                      <td>
                        <Badge bg={getStatusBadge(event.status)}>
                          {event.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Badge 
                            bg="secondary" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedEvent(event);
                              window.alert(`Applications for ${event.title}:\nTotal: ${event.total_bookings || 0}\nPending: ${event.pending_bookings || 0}\nConfirmed: ${event.confirmed_bookings || 0}\n\nClick "View Applications" button to manage them.`);
                            }}
                            title="Click to view details"
                          >
                            {event.total_bookings || 0} Total
                          </Badge>
                          {event.pending_bookings > 0 && (
                            <Badge bg="warning">{event.pending_bookings} Pending</Badge>
                          )}
                          {event.confirmed_bookings > 0 && (
                            <Badge bg="success">{event.confirmed_bookings} Confirmed</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              alert(`View Applications for "${event.title}"\n\nTotal Applications: ${event.total_bookings || 0}\nPending: ${event.pending_bookings || 0}\nConfirmed: ${event.confirmed_bookings || 0}\n\nThis will load the applications management modal (to be implemented).`);
                            }}
                            title="View Applications"
                          >
                            <i className="fas fa-users"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEditModal(true);
                            }}
                            title="Edit Event"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Event"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
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

      {/* Create Event Modal */}
      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Edit Event Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <EditEventForm
              event={selectedEvent}
              onSubmit={handleEditEvent}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Event Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="xl"
      >
        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => setShowDetailsModal(false)}
            onEdit={() => {
              setShowDetailsModal(false);
              setShowEditModal(true);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete "<strong>{selectedEvent?.title}</strong>"? 
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteEvent}>
            Delete Event
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventManagement; 
