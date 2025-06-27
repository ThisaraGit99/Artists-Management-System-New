import React from 'react';
import { Modal, Card, Row, Col, Badge, Button } from 'react-bootstrap';

const EventDetailsModal = ({ event, onClose, onEdit }) => {
  // Add safety check for event data
  if (!event) {
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>Event Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-4">
            <p className="text-muted">Event data not available</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || isNaN(amount)) return 'Not specified';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return ${currency} ;
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

  // Safe venue details parsing
  const getVenueDetails = () => {
    if (!event.venue_details) return null;
    
    try {
      if (typeof event.venue_details === 'string') {
        return JSON.parse(event.venue_details);
      }
      return event.venue_details;
    } catch (error) {
      return null;
    }
  };

  // Safe requirements parsing
  const getRequirements = () => {
    if (!event.requirements) return [];
    
    try {
      if (typeof event.requirements === 'string') {
        return JSON.parse(event.requirements);
      }
      if (Array.isArray(event.requirements)) {
        return event.requirements;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Safe contact info parsing
  const getContactInfo = () => {
    if (!event.contact_info) return null;
    
    try {
      if (typeof event.contact_info === 'string') {
        return JSON.parse(event.contact_info);
      }
      return event.contact_info;
    } catch (error) {
      return null;
    }
  };

  const venueDetails = getVenueDetails();
  const requirements = getRequirements();
  const contactInfo = getContactInfo();

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-calendar-alt me-2"></i>
          Event Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col lg={8} md={7}>
            {/* Basic Information */}
            <Card className="mb-3">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Basic Information
                </h5>
              </Card.Header>
              <Card.Body>
                <h4 className="fw-bold text-primary">{event.title || 'Untitled Event'}</h4>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <Badge bg="secondary" className="border">
                    <i className="fas fa-tag me-1"></i>
                    {event.event_type || 'Unknown Type'}
                  </Badge>
                  <Badge bg={getStatusBadge(event.status)}>
                    {event.status?.replace('_', ' ').toUpperCase() || 'NO STATUS'}
                  </Badge>
                  {event.is_public && (
                    <Badge bg="success">
                      <i className="fas fa-globe me-1"></i>
                      Public
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-muted">{event.description}</p>
                )}
              </Card.Body>
            </Card>

            {/* Date & Time */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-calendar me-2"></i>
                  Date & Time
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <strong>Date:</strong><br />
                    <span className="text-muted">{formatDate(event.event_date)}</span>
                  </Col>
                  <Col md={4}>
                    <strong>Start Time:</strong><br />
                    <span className="text-muted">{formatTime(event.start_time)}</span>
                  </Col>
                  <Col md={4}>
                    <strong>End Time:</strong><br />
                    <span className="text-muted">{formatTime(event.end_time)}</span>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Venue Information */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Venue Information
                </h6>
              </Card.Header>
              <Card.Body>
                <h6 className="fw-bold">{event.venue_name || 'Venue not specified'}</h6>
                {event.venue_address && (
                  <p className="mb-1">{event.venue_address}</p>
                )}
                <p className="text-muted mb-3">
                  {[event.venue_city, event.venue_state, event.venue_country]
                    .filter(Boolean)
                    .join(', ') || 'Location not specified'}
                </p>

                {venueDetails && (
                  <Row>
                    {venueDetails.capacity && (
                      <Col md={6}>
                        <small><strong>Capacity:</strong> {venueDetails.capacity} guests</small>
                      </Col>
                    )}
                    {venueDetails.stage_size && (
                      <Col md={6}>
                        <small><strong>Stage Size:</strong> {venueDetails.stage_size}</small>
                      </Col>
                    )}
                    <Col md={6}>
                      <small>
                        <strong>Outdoor:</strong> {venueDetails.outdoor ? 'Yes' : 'No'}
                      </small>
                    </Col>
                    <Col md={6}>
                      <small>
                        <strong>Sound System:</strong> {venueDetails.sound_system ? 'Available' : 'Not available'}
                      </small>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

            {/* Budget */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-dollar-sign me-2"></i>
                  Budget
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <strong>Minimum:</strong><br />
                    <span className="text-muted">{formatCurrency(event.budget_min, event.currency)}</span>
                  </Col>
                  <Col md={6}>
                    <strong>Maximum:</strong><br />
                    <span className="text-muted">{formatCurrency(event.budget_max, event.currency)}</span>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Requirements */}
            {requirements.length > 0 && (
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="fas fa-music me-2"></i>
                    Music Requirements
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-1">
                    {requirements.map((genre, index) => (
                      <Badge key={index} bg="primary" className="me-1 mb-1">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Contact Information */}
            {contactInfo && (
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="fas fa-address-card me-2"></i>
                    Contact Information
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {contactInfo.name && (
                      <Col md={4}>
                        <strong>Name:</strong><br />
                        <span className="text-muted">{contactInfo.name}</span>
                      </Col>
                    )}
                    {contactInfo.phone && (
                      <Col md={4}>
                        <strong>Phone:</strong><br />
                        <span className="text-muted">{contactInfo.phone}</span>
                      </Col>
                    )}
                    {contactInfo.email && (
                      <Col md={4}>
                        <strong>Email:</strong><br />
                        <span className="text-muted">{contactInfo.email}</span>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4} md={5}>
            {/* Statistics */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Statistics
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <h4 className="text-primary fw-bold">{event.total_bookings || 0}</h4>
                  <small className="text-muted">Total Applications</small>
                </div>
                
                <Row className="text-center">
                  <Col>
                    <h6 className="text-warning">{event.pending_bookings || 0}</h6>
                    <small className="text-muted">Pending</small>
                  </Col>
                  <Col>
                    <h6 className="text-success">{event.confirmed_bookings || 0}</h6>
                    <small className="text-muted">Confirmed</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Actions */}
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-cog me-2"></i>
                  Actions
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={onEdit} size="sm">
                    <i className="fas fa-edit me-2"></i>
                    Edit Event
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </>
  );
};

export default EventDetailsModal;
