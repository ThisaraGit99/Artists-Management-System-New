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
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    eventType: 'all',
    dateRange: 'all',
    status: 'all',
    venue: '',
    budgetMin: '',
    budgetMax: '',
    dateFrom: '',
    dateTo: '',
    hasApplications: 'all',
    sortBy: 'newest'
  });
  
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
  const [processingAppId, setProcessingAppId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      eventType: 'all',
      dateRange: 'all',
      status: 'all',
      venue: '',
      budgetMin: '',
      budgetMax: '',
      dateFrom: '',
      dateTo: '',
      hasApplications: 'all',
      sortBy: 'newest'
    });
    setActiveTab('all');
  };

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
    if (!dateString) return 'Date not set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getFilteredEvents = () => {
    let filtered = [...events];

    // Search filter
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.venue_name?.toLowerCase().includes(search) ||
        event.venue_city?.toLowerCase().includes(search)
      );
    }

    // Event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => 
        event.event_type === filters.eventType
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => 
        event.status === filters.status
      );
    }

    // Venue filter
    if (filters.venue) {
      const venueSearch = filters.venue.toLowerCase();
      filtered = filtered.filter(event =>
        event.venue_name?.toLowerCase().includes(venueSearch) ||
        event.venue_city?.toLowerCase().includes(venueSearch) ||
        event.venue_state?.toLowerCase().includes(venueSearch)
      );
    }

    // Budget range filter
    if (filters.budgetMin) {
      filtered = filtered.filter(event => 
        event.budget >= parseFloat(filters.budgetMin)
      );
    }
    if (filters.budgetMax) {
      filtered = filtered.filter(event => 
        event.budget <= parseFloat(filters.budgetMax)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(event => 
        new Date(event.date) >= fromDate
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(event => 
        new Date(event.date) <= toDate
      );
    }

    // Applications filter
    if (filters.hasApplications !== 'all') {
      filtered = filtered.filter(event => {
        const hasApps = event.application_count > 0;
        return filters.hasApplications === 'yes' ? hasApps : !hasApps;
      });
    }

    // Sort events
    switch (filters.sortBy) {
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'budget_high':
        filtered.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget_low':
        filtered.sort((a, b) => a.budget - b.budget);
        break;
      case 'applications':
        filtered.sort((a, b) => (b.application_count || 0) - (a.application_count || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return filtered;
  };

  // Get unique event types for filter
  const getEventTypes = () => {
    const types = [...new Set(events.map(event => event.event_type))];
    return types.filter(type => type);
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
    <Container className="py-4 px-4">
      {/* Header */}
      <Row className="mb-4 mx-0">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-6 fw-bold text-primary mb-2">
                <i className="fas fa-calendar-alt me-3"></i>
                Event Management
              </h1>
              <p className="lead text-muted">Create and manage your events</p>
            </div>
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
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Create Event
            </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filter Section */}
      {showFilters && (
        <Card className="mb-4 mx-0">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-sliders-h me-2"></i>
              Filter Events
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
              {/* Search */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Search Events</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                type="text"
                      placeholder="Search by event title, description, or venue..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
                  </InputGroup>
                </Form.Group>
            </Col>

              {/* Event Type */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Event Type</Form.Label>
                  <Form.Select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                    <option value="all">All Event Types</option>
                    {getEventTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                  </Form.Select>
                </Form.Group>
            </Col>

              {/* Status */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="published">Published</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      )}

      {/* Events List */}
      <Card className="mx-0">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Your Events
              {filteredEvents.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {filteredEvents.length}
                </Badge>
              )}
            </h5>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading events...</span>
              </Spinner>
              <p className="mt-3">Loading your events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5>No events found</h5>
              <p className="text-muted">
                {events.length === 0 
                  ? "Create your first event to get started!" 
                  : "Try adjusting your filters to see more events"}
              </p>
              {events.length === 0 && (
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
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Event Details</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event.id}>
                      <td>
                        <div className="d-flex align-items-center">
                        <div>
                            <h6 className="mb-1">{event.title}</h6>
                          <small className="text-muted">
                              <i className="fas fa-tag me-1"></i>
                              {event.event_type}
                          </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <i className="fas fa-calendar-day me-1 text-muted"></i>
                        {event.event_date ? (
                          formatDate(event.event_date)
                        ) : event.start_date ? (
                          <>
                            {formatDate(event.start_date)}
                            {event.end_date && event.end_date !== event.start_date && (
                              <> - {formatDate(event.end_date)}</>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">Date not set</span>
                        )}
                      </td>
                      <td>
                        <i className="fas fa-map-marker-alt me-1 text-muted"></i>
                        {event.venue_name || 'TBD'}
                      </td>
                      <td>
                        <i className="fas fa-dollar-sign me-1 text-success"></i>
                        {event.budget_min && event.budget_max ? (
                          <span className="text-success">
                            {formatCurrency(event.budget_min)} - {formatCurrency(event.budget_max)}
                          </span>
                        ) : event.budget_min ? (
                          <span className="text-success">
                            From {formatCurrency(event.budget_min)}
                          </span>
                        ) : event.budget_max ? (
                          <span className="text-success">
                            Up to {formatCurrency(event.budget_max)}
                          </span>
                        ) : (
                          <span className="text-muted">Budget not set</span>
                        )}
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



