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
  Nav,
  Form,
  FormControl,
  InputGroup
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
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
  
  // Additional filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  
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

  // Add processing state for this specific application
  const [processingAppId, setProcessingAppId] = useState(null);

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
      toast.error(err.message || 'Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      setLoadingApplications(true); // Show loading state
      
      console.log('🎯 Approving application:', applicationId);
      
      const response = await eventApplicationService.approveApplication(
        selectedEvent.id, 
        applicationId, 
        'Application approved - looking forward to working with you!'
      );
      
      console.log('✅ Approval response:', response);
      
      // Check if response indicates success
      if (response && response.success) {
        // Show success message
        toast.success('Application approved successfully!');
        
        // Update the application status locally for immediate UI feedback
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  application_status: 'approved', 
                  organizer_response: 'Application approved - looking forward to working with you!',
                  responded_at: new Date().toISOString()
                }
              : app
          )
        );
        
        // Clear any previous errors
        setError(null);
        
        // Reload data in background to ensure consistency
        setTimeout(async () => {
          try {
            await loadApplications(selectedEvent);
            await loadEvents();
          } catch (reloadError) {
            console.warn('Warning: Failed to reload data after approval:', reloadError);
          }
        }, 1000);
        
      } else {
        // Handle case where success is false
        throw new Error(response?.message || 'Failed to approve application');
      }
      
    } catch (err) {
      console.error('❌ Approval error:', err);
      
      // Determine the specific error message
      let errorMessage = 'Failed to approve application';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Only show error if it's a real failure (not already processed)
      if (errorMessage.includes('already been processed')) {
        // Application was already approved, just refresh the UI
        toast.info('Application has already been processed');
        loadApplications(selectedEvent);
      } else {
        // Show actual error
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await eventApplicationService.rejectApplication(selectedEvent.id, applicationId, 'Thank you for your application. We have decided to go with another artist for this event.');
      toast.success('Application rejected successfully.');
      loadApplications(selectedEvent); // Reload applications
      loadEvents(); // Refresh event stats
    } catch (err) {
      const errorMessage = err.message || 'Failed to reject application';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const getApplicationStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return variants[status] || 'secondary';
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
    let filtered = events;

    // Filter by tab (status)
    switch (activeTab) {
      case 'all': 
        filtered = events; 
        break;
      case 'active': 
        filtered = events.filter(e => e.status === 'planning' || e.status === 'published'); 
        break;
      case 'progress': 
        filtered = events.filter(e => e.status === 'in_progress'); 
        break;
      case 'completed': 
        filtered = events.filter(e => e.status === 'completed'); 
        break;
      default: 
        filtered = events;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedEventType);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        switch (dateRangeFilter) {
          case 'today':
            return eventDate >= today && eventDate < tomorrow;
          case 'thisWeek':
            return eventDate >= today && eventDate < nextWeek;
          case 'thisMonth':
            return eventDate >= today && eventDate < nextMonth;
          case 'upcoming':
            return eventDate >= today;
          case 'past':
            return eventDate < today;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Get unique event types for filter
  const getEventTypes = () => {
    const types = [...new Set(events.map(event => event.event_type))];
    return types.filter(type => type);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedEventType('all');
    setDateRangeFilter('all');
    setActiveTab('all');
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

      {/* Advanced Filters Section */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="fas fa-filter me-2"></i>
              Filter Events
            </h6>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedEventType('all');
                setDateRangeFilter('all');
              }}
            >
              <i className="fas fa-times me-1"></i>
              Clear Filters
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <label className="form-label fw-bold">
                <i className="fas fa-search me-1"></i>
                Search Events
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, description, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={4} className="mb-3">
              <label className="form-label fw-bold">
                <i className="fas fa-calendar me-1"></i>
                Event Type
              </label>
              <select
                className="form-select"
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
              >
                <option value="all">All Types</option>
                {[...new Set(events.map(event => event.event_type))].filter(type => type).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Col>
            <Col md={4} className="mb-3">
              <label className="form-label fw-bold">
                <i className="fas fa-clock me-1"></i>
                Date Range
              </label>
              <select
                className="form-select"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past Events</option>
              </select>
            </Col>
          </Row>
          {(searchTerm || selectedEventType !== 'all' || dateRangeFilter !== 'all') && (
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Showing filtered results. 
                {searchTerm && ` Search: "${searchTerm}"`}
                {selectedEventType !== 'all' && ` Type: ${selectedEventType}`}
                {dateRangeFilter !== 'all' && ` Date: ${dateRangeFilter}`}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

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
                        <Badge bg="primary" className="text-white">
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
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => loadApplications(event)}
                            title="View Applications"
                            disabled={loadingApplications}
                          >
                            {loadingApplications ? (
                              <Spinner size="sm" />
                            ) : (
                              <i className="fas fa-users"></i>
                            )}
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

      {/* Applications Management Modal */}
      <Modal 
        show={showApplicationsModal} 
        onHide={() => setShowApplicationsModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-users me-2"></i>
            Applications for "{selectedEvent?.title}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingApplications ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Applications Yet</h5>
              <p className="text-muted">
                No artists have applied to this event yet. Applications will appear here when artists submit them.
              </p>
            </div>
          ) : (
            <div>
              {/* Filter buttons */}
              <div className="mb-3">
                <Button
                  variant={applicationFilter === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => {
                    setApplicationFilter('all');
                    loadApplications(selectedEvent);
                  }}
                  className="me-2"
                >
                  All ({applications.length})
                </Button>
                <Button
                  variant={applicationFilter === 'pending' ? 'warning' : 'outline-warning'}
                  size="sm"
                  onClick={() => {
                    setApplicationFilter('pending');
                    loadApplications(selectedEvent);
                  }}
                  className="me-2"
                >
                  Pending ({applications.filter(app => app.application_status === 'pending').length})
                </Button>
                <Button
                  variant={applicationFilter === 'approved' ? 'success' : 'outline-success'}
                  size="sm"
                  onClick={() => {
                    setApplicationFilter('approved');
                    loadApplications(selectedEvent);
                  }}
                  className="me-2"
                >
                  Approved ({applications.filter(app => app.application_status === 'approved').length})
                </Button>
                <Button
                  variant={applicationFilter === 'rejected' ? 'danger' : 'outline-danger'}
                  size="sm"
                  onClick={() => {
                    setApplicationFilter('rejected');
                    loadApplications(selectedEvent);
                  }}
                >
                  Rejected ({applications.filter(app => app.application_status === 'rejected').length})
                </Button>
              </div>

              {/* Applications list */}
              <div className="row">
                {applications
                  .filter(app => applicationFilter === 'all' || app.application_status === applicationFilter)
                  .map((application) => (
                  <div key={application.id} className="col-12 mb-3">
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 me-3">{application.artist_name}</h6>
                              <Badge bg={getApplicationStatusBadge(application.application_status)}>
                                {application.application_status.toUpperCase()}
                              </Badge>
                              {application.is_verified && (
                                <Badge bg="info" className="ms-2">VERIFIED</Badge>
                              )}
                            </div>
                            <div className="text-muted small mb-2">
                              <i className="fas fa-envelope me-1"></i>
                              {application.artist_email}
                              {application.artist_phone && (
                                <span className="ms-3">
                                  <i className="fas fa-phone me-1"></i>
                                  {application.artist_phone}
                                </span>
                              )}
                            </div>
                            <div className="text-muted small mb-2">
                              <i className="fas fa-music me-1"></i>
                              {application.genre}
                              {application.location && (
                                <span className="ms-3">
                                  <i className="fas fa-map-marker-alt me-1"></i>
                                  {application.location}
                                </span>
                              )}
                            </div>
                            <div className="text-muted small mb-2">
                              <i className="fas fa-star me-1"></i>
                              {application.rating ? `${application.rating}/5 (${application.total_ratings} reviews)` : 'No ratings yet'}
                              <span className="ms-3">
                                <i className="fas fa-calendar me-1"></i>
                                {application.experience_years} years experience
                              </span>
                            </div>
                            {application.message && (
                              <div className="mt-2">
                                <small className="text-muted">Artist Message:</small>
                                <p className="mt-1 mb-0 small">{application.message}</p>
                              </div>
                            )}
                            {application.organizer_response && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted">Your Response:</small>
                                <p className="mt-1 mb-0 small">{application.organizer_response}</p>
                              </div>
                            )}
                          </div>
                          <div className="col-md-4 text-end">
                            <div className="mb-2">
                              <h5 className="mb-0 text-success">
                                <i className="fas fa-dollar-sign"></i>
                                {application.proposed_budget?.toLocaleString()}
                              </h5>
                              <small className="text-muted">Proposed Budget</small>
                            </div>
                            <div className="mb-3">
                              <small className="text-muted">
                                Applied: {new Date(application.applied_at).toLocaleDateString()}
                              </small>
                            </div>
                            {application.application_status === 'pending' && (
                              <div className="d-flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleApproveApplication(application.id)}
                                >
                                  <i className="fas fa-check me-1"></i>
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRejectApplication(application.id)}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  Reject
                                </Button>
                              </div>
                            )}
                            {application.application_status === 'approved' && (
                              <Badge bg="success" className="px-3 py-2">
                                <i className="fas fa-check me-1"></i>
                                Approved
                              </Badge>
                            )}
                            {application.application_status === 'rejected' && (
                              <Badge bg="danger" className="px-3 py-2">
                                <i className="fas fa-times me-1"></i>
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApplicationsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventManagement;



