import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import organizerService from '../../services/organizerService';
import artistService from '../../services/artistService';

const BookingRequestModal = ({ artist, show, onHide, onBookingCreated }) => {
  const [formData, setFormData] = useState({
    event_name: '',
    event_description: '',
    event_date: '',
    event_time: '',
    duration: '',
    venue_address: '',
    total_amount: '',
    special_requirements: '',
    package_id: ''
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && artist) {
      fetchArtistPackages();
      // Reset form when modal opens
      setFormData({
        event_name: '',
        event_description: '',
        event_date: '',
        event_time: '',
        duration: '',
        venue_address: '',
        total_amount: '',
        special_requirements: '',
        package_id: ''
      });
      setErrors({});
    }
  }, [show, artist]);

  const fetchArtistPackages = async () => {
    try {
      // This would need to be implemented as a public endpoint to fetch artist packages
      // For now, we'll use a placeholder
      setPackages([]);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-populate amount if package is selected
    if (name === 'package_id' && value) {
      const selectedPackage = packages.find(p => p.id === parseInt(value));
      if (selectedPackage) {
        setFormData(prev => ({ 
          ...prev, 
          total_amount: selectedPackage.price,
          duration: selectedPackage.duration || ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    } else {
      const eventDate = new Date(formData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        newErrors.event_date = 'Event date cannot be in the past';
      }
    }

    if (!formData.event_time) {
      newErrors.event_time = 'Event time is required';
    }

    if (!formData.venue_address.trim()) {
      newErrors.venue_address = 'Venue address is required';
    }

    if (formData.total_amount && (isNaN(formData.total_amount) || parseFloat(formData.total_amount) <= 0)) {
      newErrors.total_amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        artist_id: artist.id,
        ...formData,
        package_id: formData.package_id || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null
      };

      const response = await organizerService.createBooking(bookingData);

      if (response.data.success) {
        toast.success('Booking request sent successfully!');
        onBookingCreated && onBookingCreated(response.data.bookingId);
        onHide();
      } else {
        toast.error(response.data.message || 'Failed to send booking request');
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-paper-plane me-2"></i>
          Send Booking Request
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {artist && (
          <>
            {/* Artist Info */}
            <Alert variant="info" className="mb-4">
              <div className="d-flex align-items-center">
                <div className="avatar-circle me-3" style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(45deg, #007bff, #0056b3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h6 className="mb-0">{artist.name}</h6>
                  <small className="text-muted">
                    {artist.location} • ${artist.hourly_rate || 0}/hour
                  </small>
                </div>
              </div>
            </Alert>

            {/* Booking Form */}
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Event Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleChange}
                      isInvalid={!!errors.event_name}
                      placeholder="e.g., Wedding Reception, Corporate Gala"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.event_name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  {packages.length > 0 && (
                    <Form.Group className="mb-3">
                      <Form.Label>Package (Optional)</Form.Label>
                      <Form.Select
                        name="package_id"
                        value={formData.package_id}
                        onChange={handleChange}
                      >
                        <option value="">Select a package (optional)</option>
                        {packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.title} - ${pkg.price}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Event Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="event_description"
                  value={formData.event_description}
                  onChange={handleChange}
                  placeholder="Describe your event, expected audience, music style preferences, etc."
                />
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Event Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleChange}
                      isInvalid={!!errors.event_date}
                      min={formatDate(new Date())}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.event_date}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Event Time *</Form.Label>
                    <Form.Control
                      type="time"
                      name="event_time"
                      value={formData.event_time}
                      onChange={handleChange}
                      isInvalid={!!errors.event_time}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.event_time}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 3 hours, Full day"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Venue Address *</Form.Label>
                    <Form.Control
                      type="text"
                      name="venue_address"
                      value={formData.venue_address}
                      onChange={handleChange}
                      isInvalid={!!errors.venue_address}
                      placeholder="Full venue address including city and state"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.venue_address}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Budget ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                      isInvalid={!!errors.total_amount}
                      placeholder="0.00"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.total_amount}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Special Requirements</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  placeholder="Any specific equipment, setup requirements, music requests, etc."
                />
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Sending...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane me-2"></i>
              Send Booking Request
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BookingRequestModal; 