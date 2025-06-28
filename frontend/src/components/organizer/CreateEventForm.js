import React, { useState } from 'react';
import {
  Form,
  Row,
  Col,
  Button,
  Alert,
  Card,
  Badge
} from 'react-bootstrap';

const eventTypes = [
  'Wedding',
  'Corporate',
  'Concert',
  'Festival',
  'Private Party',
  'Birthday',
  'Anniversary',
  'Other'
];

const musicGenres = [
  'Rock', 'Pop', 'Jazz', 'Classical', 'Blues', 'Country', 'Folk', 'Hip Hop',
  'Electronic', 'R&B', 'Soul', 'Funk', 'Reggae', 'Latin', 'World Music',
  'Acoustic', 'Alternative', 'Indie', 'Contemporary'
];

const CreateEventForm = ({ onSubmit, onCancel, initialData, isEdit = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    event_type: '',
    event_date: '',
    start_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    venue_state: '',
    venue_country: 'USA',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    requirements: [],
    is_public: true,
    // Venue details
    venue_capacity: '',
    venue_outdoor: false,
    venue_sound_system: false,
    venue_stage_size: '',
    // Contact info
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(genre)
        ? prev.requirements.filter(g => g !== genre)
        : [...prev.requirements, genre]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.event_type || !formData.event_date || !formData.start_time || !formData.venue_name) {
        throw new Error('Please fill in all required fields');
      }

      // Format data for submission
      const submitData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        venue_city: formData.venue_city,
        venue_state: formData.venue_state,
        venue_country: formData.venue_country,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        currency: formData.currency,
        requirements: formData.requirements,
        is_public: formData.is_public,
        venue_details: {
          capacity: formData.venue_capacity ? parseInt(formData.venue_capacity) : null,
          outdoor: formData.venue_outdoor,
          sound_system: formData.venue_sound_system,
          stage_size: formData.venue_stage_size
        },
        contact_info: {
          name: formData.contact_name,
          phone: formData.contact_phone,
          email: formData.contact_email
        }
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Basic Event Information */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-info-circle me-2"></i>
            Event Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Event Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={handleChange('title')}
                  placeholder="e.g., Summer Wedding Celebration"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Event Type *</Form.Label>
                <Form.Select
                  value={formData.event_type}
                  onChange={handleChange('event_type')}
                  required
                >
                  <option value="">Select event type</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Event Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange('description')}
                  placeholder="Describe your event, atmosphere, and what you're looking for..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Date and Time */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-calendar me-2"></i>
            Date & Time
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Event Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.event_date}
                  onChange={handleChange('event_date')}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange('start_time')}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange('end_time')}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Venue Information */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-map-marker-alt me-2"></i>
            Venue Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Venue Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.venue_name}
                  onChange={handleChange('venue_name')}
                  placeholder="e.g., Garden View Manor"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Venue Address</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.venue_address}
                  onChange={handleChange('venue_address')}
                  placeholder="Street address"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.venue_city}
                  onChange={handleChange('venue_city')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.venue_state}
                  onChange={handleChange('venue_state')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.venue_country}
                  onChange={handleChange('venue_country')}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.venue_capacity}
                  onChange={handleChange('venue_capacity')}
                  placeholder="Number of guests"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Stage Size</Form.Label>
                <Form.Select
                  value={formData.venue_stage_size}
                  onChange={handleChange('venue_stage_size')}
                >
                  <option value="">Not specified</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div className="d-flex gap-3">
                <Form.Check
                  type="checkbox"
                  id="venue_outdoor"
                  label="Outdoor Event"
                  checked={formData.venue_outdoor}
                  onChange={handleChange('venue_outdoor')}
                />
                <Form.Check
                  type="checkbox"
                  id="venue_sound_system"
                  label="Sound System Available"
                  checked={formData.venue_sound_system}
                  onChange={handleChange('venue_sound_system')}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Budget */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-dollar-sign me-2"></i>
            Budget
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Minimum Budget</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.budget_min}
                  onChange={handleChange('budget_min')}
                  placeholder="1000"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Maximum Budget</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.budget_max}
                  onChange={handleChange('budget_max')}
                  placeholder="5000"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  value={formData.currency}
                  onChange={handleChange('currency')}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Music Requirements */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-music me-2"></i>
            Music Requirements
          </h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Preferred Genres</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {musicGenres.map((genre) => (
                <Badge
                  key={genre}
                  bg={formData.requirements.includes(genre) ? 'primary' : 'light'}
                  text={formData.requirements.includes(genre) ? 'light' : 'dark'}
                  className={`p-2 cursor-pointer border`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                  {formData.requirements.includes(genre) && (
                    <i className="fas fa-check ms-1"></i>
                  )}
                </Badge>
              ))}
            </div>
            <Form.Text className="text-muted">
              Click on genres to select them
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Contact Information */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-address-card me-2"></i>
            Contact Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Contact Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.contact_name}
                  onChange={handleChange('contact_name')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.contact_phone}
                  onChange={handleChange('contact_phone')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Contact Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange('contact_email')}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Settings */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Check
            type="checkbox"
            id="is_public"
            label="Make this event public (artists can browse and apply)"
            checked={formData.is_public}
            onChange={handleChange('is_public')}
          />
        </Card.Body>
      </Card>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
              {isEdit ? 'Update Event' : 'Create Event'}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default CreateEventForm; 