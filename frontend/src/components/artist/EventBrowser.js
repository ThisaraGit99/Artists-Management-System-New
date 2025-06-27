import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Modal, Form, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import eventService from '../../services/eventService';
import eventApplicationService from '../../services/eventApplicationService';

const EventBrowser = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [applicationData, setApplicationData] = useState({
    proposed_budget: '',
    message: ''
  });
  const [applying, setApplying] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [sortBy, setSortBy] = useState('date_upcoming');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  useEffect(() => {
    loadEvents();
    loadMyApplications();
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchTerm, selectedEventType, sortBy, showUpcomingOnly]);

  const filterAndSortEvents = () => {
    let filtered = [...events];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        (event.title || event.name || '').toLowerCase().includes(search) ||
        (event.description || '').toLowerCase().includes(search) ||
        (event.venue_city || '').toLowerCase().includes(search) ||
        (event.venue_state || '').toLowerCase().includes(search) ||
        (event.organizer_name || '').toLowerCase().includes(search) ||
        (event.event_type || '').toLowerCase().includes(search)
      );
    }
    
    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => 
        (event.event_type || '').toLowerCase() === selectedEventType.toLowerCase()
      );
    }
    
    // Filter by upcoming/past
    if (showUpcomingOnly) {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date || event.event_date);
        return eventDate >= now;
      });
    }
    
    // Sort events
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.event_date);
      const dateB = new Date(b.date || b.event_date);
      const now = new Date();
      
      switch (sortBy) {
        case 'date_upcoming':
          // Upcoming events first, then by closest date
          const aIsUpcoming = dateA >= now;
          const bIsUpcoming = dateB >= now;
          
          if (aIsUpcoming && !bIsUpcoming) return -1;
          if (!aIsUpcoming && bIsUpcoming) return 1;
          
          return aIsUpcoming ? dateA - dateB : dateB - dateA;
          
        case 'date_newest':
          return dateB - dateA;
          
        case 'date_oldest':
          return dateA - dateB;
          
        case 'budget_high':
          return (b.budget_max || b.budget || 0) - (a.budget_max || a.budget || 0);
          
        case 'budget_low':
          return (a.budget_max || a.budget || 0) - (b.budget_max || b.budget || 0);
          
        case 'alphabetical':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
          
        default:
          return 0;
      }
    });
    
    setFilteredEvents(filtered);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading events...');
      const response = await eventService.browseEvents({ 
        status: 'published', 
        limit: 50,
        page: 1 
      });
      console.log('📊 Events API response:', response);
      
      if (response.success === false) {
        throw new Error(response.message || 'API returned unsuccessful response');
      }
      
      const eventsData = response.data || [];
      console.log('📋 Events data:', eventsData);
      
      setEvents(eventsData);
      
      if (eventsData.length === 0) {
        console.log('⚠️ No events found');
      }
      
    } catch (error) {
      console.error('❌ Load events error:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in as an artist.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You must be logged in as an artist to view events.');
      } else {
        setError('Failed to load events. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    try {
      const response = await eventApplicationService.getMyApplications();
      setMyApplications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Load applications error:', error);
      setMyApplications([]);
    }
  };

  const hasApplied = (eventId) => {
    if (!Array.isArray(myApplications)) {
      return false;
    }
    return myApplications.some(app => app.event_id === eventId);
  };

  const getApplicationStatus = (eventId) => {
    if (!Array.isArray(myApplications)) {
      return null;
    }
    const application = myApplications.find(app => app.event_id === eventId);
    return application ? application.status : null;
  };

  const handleApplyClick = (event) => {
    setSelectedEvent(event);
    setApplicationData({
      proposed_budget: '',
      message: ''
    });
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!applicationData.proposed_budget || parseFloat(applicationData.proposed_budget) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    try {
      setApplying(true);
      await eventApplicationService.applyToEvent(selectedEvent.id, {
        proposed_budget: parseFloat(applicationData.proposed_budget),
        message: applicationData.message.trim() || null
      });
      
      toast.success('Application submitted successfully!');
      setShowApplicationModal(false);
      loadMyApplications();
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">⏳ Pending</Badge>;
      case 'approved':
        return <Badge bg="success">✅ Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">❌ Rejected</Badge>;
      default:
        return null;
    }
  };

  const getEventTypes = () => {
    const types = [...new Set(events.map(e => e.event_type).filter(Boolean))];
    return types;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading events...</span>
        </Spinner>
        <p className="mt-3">Loading available events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
        <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadEvents}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <>
      {/* Header and Filters */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Available Events
          </h4>
          <Button variant="outline-primary" size="sm" onClick={loadEvents}>
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </Button>
        </div>

        {/* Event Stats */}
        {events.length > 0 && (
          <div className="row mb-3">
            <div className="col-md-8">
              <div className="d-flex align-items-center flex-wrap gap-3">
                <span className="badge bg-success fs-6">
                  <i className="fas fa-calendar-check me-1"></i>
                  {filteredEvents.filter(e => new Date(e.date || e.event_date) >= new Date()).length} Upcoming
                </span>
                <span className="badge bg-info fs-6">
                  <i className="fas fa-list me-1"></i>
                  {filteredEvents.length} Total {showUpcomingOnly ? 'Upcoming ' : ''}Events
                </span>
                {showUpcomingOnly && (
                  <span className="badge bg-warning fs-6">
                    <i className="fas fa-filter me-1"></i>
                    Filter: Upcoming Only
                  </span>
                )}
                <span className="badge bg-primary fs-6">
                  <i className="fas fa-dollar-sign me-1"></i>
                  Up to {formatCurrency(Math.max(...events.map(e => e.budget_max || e.budget || 0)))}
                </span>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <small className="text-muted">
                <i className="fas fa-clock me-1"></i>
                Last updated: {new Date().toLocaleTimeString()}
              </small>
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-4">
            <InputGroup>
              <InputGroup.Text>
                <i className="fas fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search events, location, organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* Event Type Filter */}
          <div className="col-md-3">
            <Form.Select 
              value={selectedEventType} 
              onChange={(e) => setSelectedEventType(e.target.value)}
            >
              <option value="all">All Types</option>
              {getEventTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </div>

          {/* Sort By */}
          <div className="col-md-3">
            <Form.Select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_upcoming">Upcoming First</option>
              <option value="date_newest">Newest Posted</option>
              <option value="date_oldest">Oldest Posted</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
              <option value="alphabetical">A-Z</option>
            </Form.Select>
          </div>

          {/* Show Only Upcoming */}
          <div className="col-md-2">
            <div className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="upcoming-switch"
                label={
                  <span className="d-flex align-items-center">
                    Upcoming Only
                    {showUpcomingOnly && (
                      <Badge bg="primary" className="ms-2 small">
                        ON
                      </Badge>
                    )}
                  </span>
                }
                checked={showUpcomingOnly}
                onChange={(e) => setShowUpcomingOnly(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">
            {events.length === 0 ? 'No Events Available' : 'No Events Match Your Filters'}
          </h5>
          <p className="text-muted">
            {events.length === 0 
              ? 'Check back later for new event opportunities!' 
              : 'Try adjusting your search criteria or filters.'
            }
          </p>
          {events.length > 0 && (
            <Button variant="outline-primary" onClick={() => {
              setSearchTerm('');
              setSelectedEventType('all');
              setShowUpcomingOnly(false);
            }}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <Row>
          {filteredEvents.map(event => {
            const eventDate = new Date(event.date || event.event_date);
            const isUpcoming = eventDate >= new Date();
            const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <Col lg={6} xl={4} className="mb-4" key={event.id}>
                <Card className={`border-0 shadow-sm h-100 ${isUpcoming ? 'border-start border-primary border-3' : 'opacity-75'}`}>
                  <Card.Header className="bg-transparent border-0 pb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <Badge bg={isUpcoming ? 'success' : 'secondary'} className="mb-2">
                          {isUpcoming ? (
                            daysUntil === 0 ? 'Today' : 
                            daysUntil === 1 ? 'Tomorrow' : 
                            `${daysUntil} days away`
                          ) : 'Past Event'}
                        </Badge>
                        {event.event_type && (
                          <Badge bg="dark" className="ms-2">
                            <i className="fas fa-tag me-1"></i>
                            {event.event_type}
                          </Badge>
                        )}
                      </div>
                      {hasApplied(event.id) && getStatusBadge(getApplicationStatus(event.id))}
                    </div>
                  </Card.Header>
                  
                  <Card.Body className="pt-0">
                    <h5 className="fw-bold text-primary mb-2" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.title || event.name}
                    </h5>
                    <p className="text-muted mb-3 small" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.description}
                    </p>
                    
                    <div className="mb-3">
                      <div className="row g-2">
                        <div className="col-12">
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-calendar me-2 text-primary"></i>
                            <strong>{formatDate(event.date || event.event_date)}</strong>
                          </small>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-clock me-2 text-info"></i>
                            {event.start_time} - {event.end_time}
                          </small>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-map-marker-alt me-2 text-danger"></i>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {event.venue_name || event.location}
                              {event.venue_city && `, ${event.venue_city}`}
                              {event.venue_state && `, ${event.venue_state}`}
                            </span>
                          </small>
                        </div>
                        <div className="col-12">
                          <small className="text-success d-flex align-items-center fw-bold">
                            <i className="fas fa-dollar-sign me-2"></i>
                            Budget: {formatCurrency(event.budget_max || event.budget || event.budget_min || 0)}
                            {event.budget_min && event.budget_max && event.budget_min !== event.budget_max && (
                              <span className="text-muted ms-1">
                                ({formatCurrency(event.budget_min)} - {formatCurrency(event.budget_max)})
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                    </div>

                    {event.requirements && Array.isArray(event.requirements) && event.requirements.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted">
                          <strong>Requirements:</strong>
                        </small>
                        <div className="mt-1">
                          {event.requirements.slice(0, 3).map((req, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1 mb-1 small">
                              {req}
                            </Badge>
                          ))}
                          {event.requirements.length > 3 && (
                            <Badge bg="light" text="muted" className="me-1 mb-1 small">
                              +{event.requirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <small className="text-muted">
                        <i className="fas fa-user me-1"></i>
                        by {event.organizer_name}
                      </small>
                      {hasApplied(event.id) ? (
                        <Button variant="outline-secondary" size="sm" disabled>
                          <i className="fas fa-check me-1"></i>
                          Applied
                        </Button>
                      ) : isUpcoming ? (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleApplyClick(event)}
                        >
                          <i className="fas fa-paper-plane me-1"></i>
                          Apply Now
                        </Button>
                      ) : (
                        <Button variant="outline-secondary" size="sm" disabled>
                          <i className="fas fa-clock me-1"></i>
                          Event Passed
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Application Modal */}
      <Modal show={showApplicationModal} onHide={() => setShowApplicationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Apply to Event</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleApplicationSubmit}>
          <Modal.Body>
            {selectedEvent && (
              <>
                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="fw-bold text-primary">{selectedEvent.title || selectedEvent.name}</h6>
                  <p className="mb-2">{selectedEvent.description}</p>
                  <small className="text-muted">
                    <i className="fas fa-calendar me-2"></i>
                    {formatDate(selectedEvent.date || selectedEvent.event_date)} • {selectedEvent.start_time} - {selectedEvent.end_time}
                  </small>
                  <br />
                  <small className="text-muted">
                    <i className="fas fa-dollar-sign me-2"></i>
                    Organizer Budget: {formatCurrency(selectedEvent.budget_max || selectedEvent.budget || selectedEvent.budget_min || 0)}
                  </small>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Your Proposed Budget *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedEvent.budget_max || selectedEvent.budget || selectedEvent.budget_min || 999999}
                    placeholder="Enter your proposed budget"
                    value={applicationData.proposed_budget}
                    onChange={(e) => setApplicationData({
                      ...applicationData,
                      proposed_budget: e.target.value
                    })}
                    required
                  />
                  <Form.Text className="text-muted">
                    Maximum budget: {formatCurrency(selectedEvent.budget_max || selectedEvent.budget || selectedEvent.budget_min || 0)}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message to Organizer (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Tell the organizer why you're perfect for this event..."
                    value={applicationData.message}
                    onChange={(e) => setApplicationData({
                      ...applicationData,
                      message: e.target.value
                    })}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowApplicationModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={applying}>
              {applying ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Submit Application
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default EventBrowser;