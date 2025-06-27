import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Card } from 'react-bootstrap';
import organizerService from '../../services/organizerService';

const StarRating = ({ value, onChange, onHover, size = "1.5rem", readOnly = false }) => {
    const [hoverValue, setHoverValue] = useState(0);

    const handleClick = (rating) => {
        if (!readOnly && onChange) {
            onChange(rating);
        }
    };

    const handleHover = (rating) => {
        if (!readOnly) {
            setHoverValue(rating);
            if (onHover) onHover(rating);
        }
    };

    const handleLeave = () => {
        if (!readOnly) {
            setHoverValue(0);
            if (onHover) onHover(0);
        }
    };

    return (
        <div className="star-rating" onMouseLeave={handleLeave}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${(hoverValue || value) >= star ? 'filled' : ''}`}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => handleHover(star)}
                    style={{
                        fontSize: size,
                        color: (hoverValue || value) >= star ? '#ffc107' : '#dee2e6',
                        cursor: readOnly ? 'default' : 'pointer',
                        marginRight: '0.2rem'
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

const RatingModal = ({ show, onHide, booking, onSuccess }) => {
    const [formData, setFormData] = useState({
        overall_rating: 0,
        communication_rating: 0,
        professionalism_rating: 0,
        punctuality_rating: 0,
        quality_rating: 0,
        review_title: '',
        review_text: '',
        would_recommend: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        if (show) {
            loadReviewTemplates();
            resetForm();
        }
    }, [show]);

    const loadReviewTemplates = async () => {
        try {
            const response = await organizerService.getReviewTemplates();
            setTemplates(response.data.data || []);
        } catch (error) {
            console.error('Failed to load review templates:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            overall_rating: 0,
            communication_rating: 0,
            professionalism_rating: 0,
            punctuality_rating: 0,
            quality_rating: 0,
            review_title: '',
            review_text: '',
            would_recommend: false
        });
        setError('');
        setSelectedTemplate('');
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template.id);
        setFormData(prev => ({
            ...prev,
            review_title: template.template_name,
            review_text: template.template_text
        }));
    };

    const validateForm = () => {
        if (formData.overall_rating === 0) {
            setError('Please provide an overall rating');
            return false;
        }
        if (!formData.review_title.trim()) {
            setError('Please provide a review title');
            return false;
        }
        if (!formData.review_text.trim()) {
            setError('Please provide review details');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await organizerService.submitArtistRating(booking.id, formData);

            if (response.data.success) {
                if (onSuccess) onSuccess();
            onHide();
                resetForm();
            } else {
                setError(response.data.message || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Rating submission error:', error);
            setError(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Rate {booking?.artist_name || 'Artist'}'s Performance</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    {/* Event Information */}
                    <Card className="mb-3">
                        <Card.Body>
                            <h6>Event Details</h6>
                            <p className="mb-1"><strong>Event:</strong> {booking?.event_name}</p>
                            <p className="mb-1"><strong>Date:</strong> {new Date(booking?.event_date).toLocaleDateString()}</p>
                            <p className="mb-0"><strong>Artist:</strong> {booking?.artist_name}</p>
                        </Card.Body>
                    </Card>

                    {/* Overall Rating */}
                    <Form.Group className="mb-4">
                        <Form.Label><strong>Overall Rating *</strong></Form.Label>
                        <div className="d-flex align-items-center">
                            <StarRating 
                                value={formData.overall_rating} 
                                onChange={(rating) => handleInputChange('overall_rating', rating)}
                                size="2rem"
                            />
                            <span className="ms-3 text-muted">
                                {formData.overall_rating > 0 ? `${formData.overall_rating}/5` : 'Select rating'}
                            </span>
                        </div>
                    </Form.Group>

                    {/* Detailed Ratings */}
                    <Card className="mb-3">
                        <Card.Body>
                            <h6 className="mb-3">Detailed Ratings</h6>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Communication</Form.Label>
                                        <StarRating 
                                            value={formData.communication_rating} 
                                            onChange={(rating) => handleInputChange('communication_rating', rating)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Professionalism</Form.Label>
                                        <StarRating 
                                            value={formData.professionalism_rating} 
                                            onChange={(rating) => handleInputChange('professionalism_rating', rating)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Punctuality</Form.Label>
                                        <StarRating 
                                            value={formData.punctuality_rating} 
                                            onChange={(rating) => handleInputChange('punctuality_rating', rating)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Quality</Form.Label>
                                        <StarRating 
                                            value={formData.quality_rating} 
                                            onChange={(rating) => handleInputChange('quality_rating', rating)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Review Templates */}
                    {templates.length > 0 && (
                        <Form.Group className="mb-3">
                            <Form.Label>Quick Templates (Optional)</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {templates.slice(0, 4).map((template) => (
                                    <Button
                                        key={template.id}
                                        variant={selectedTemplate === template.id ? "primary" : "outline-secondary"}
                                        size="sm"
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        {template.template_name}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    )}

                    {/* Review Title */}
                    <Form.Group className="mb-3">
                        <Form.Label><strong>Review Title *</strong></Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Summarize your experience"
                            value={formData.review_title}
                            onChange={(e) => handleInputChange('review_title', e.target.value)}
                            required
                        />
                    </Form.Group>

                    {/* Review Text */}
                    <Form.Group className="mb-3">
                        <Form.Label><strong>Review Details *</strong></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Share your experience working with this artist..."
                            value={formData.review_text}
                            onChange={(e) => handleInputChange('review_text', e.target.value)}
                            required
                        />
                        <Form.Text className="text-muted">
                            Minimum 20 characters. Be specific and constructive.
                        </Form.Text>
                    </Form.Group>

                    {/* Recommendation */}
                    <Form.Group className="mb-4">
                        <Form.Check
                            type="checkbox"
                            label="I would recommend this artist to other organizers"
                            checked={formData.would_recommend}
                            onChange={(e) => handleInputChange('would_recommend', e.target.checked)}
                        />
                    </Form.Group>

                    {/* Submit Buttons */}
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default RatingModal; 