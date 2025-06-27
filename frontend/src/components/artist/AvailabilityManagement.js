import React, { useState, useEffect } from 'react';
import { 
    Row, Col, Card, Button, Form, Modal, Alert, 
    Spinner, Table, Badge 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';

const AvailabilityManagement = () => {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date_from: '',
        date_to: '',
        time_from: '',
        time_to: '',
        is_available: true,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            const response = await artistService.getAvailability();
            setAvailability(response.data.data);
        } catch (error) {
            console.error('Load availability error:', error);
            toast.error('Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = () => {
        setFormData({
            date_from: '',
            date_to: '',
            time_from: '',
            time_to: '',
            is_available: true,
            notes: ''
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.date_from || !formData.date_to) {
            toast.error('Please select date range');
            return;
        }

        if (new Date(formData.date_from) > new Date(formData.date_to)) {
            toast.error('End date must be after start date');
            return;
        }

        setSubmitting(true);
        try {
            await artistService.setAvailability(formData);
            toast.success('Availability set successfully!');
            loadAvailability();
            handleCloseModal();
        } catch (error) {
            console.error('Set availability error:', error);
            toast.error('Failed to set availability');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (availabilityId) => {
        if (!window.confirm('Are you sure you want to remove this availability?')) {
            return;
        }

        try {
            await artistService.removeAvailability(availabilityId);
            toast.success('Availability removed successfully!');
            loadAvailability();
        } catch (error) {
            console.error('Delete availability error:', error);
            toast.error('Failed to remove availability');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (timeString) => {
        return timeString ? new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All day';
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading availability...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">Availability Calendar</h4>
                    <p className="text-muted mb-0">
                        Manage your availability for bookings and events
                    </p>
                </div>
                <Button variant="primary" onClick={handleShowModal}>
                    <i className="fas fa-plus me-2"></i>
                    Add Availability
                </Button>
            </div>

            {availability.length === 0 ? (
                <Alert variant="info" className="text-center py-4">
                    <i className="fas fa-calendar fa-3x mb-3 text-muted"></i>
                    <h5>No Availability Set</h5>
                    <p className="mb-3">
                        Set your availability to help event organizers know when you're free to perform.
                    </p>
                    <Button variant="primary" onClick={handleShowModal}>
                        <i className="fas fa-plus me-2"></i>
                        Set Your Availability
                    </Button>
                </Alert>
            ) : (
                <Card className="shadow-sm">
                    <Card.Body className="p-0">
                        <Table responsive className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Date Range</th>
                                    <th>Time Range</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availability.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div>
                                                <strong>{formatDate(item.date_from)}</strong>
                                                {item.date_from !== item.date_to && (
                                                    <span> - {formatDate(item.date_to)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {item.time_from && item.time_to ? (
                                                <span>
                                                    {formatTime(item.time_from)} - {formatTime(item.time_to)}
                                                </span>
                                            ) : (
                                                <span className="text-muted">All day</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge 
                                                bg={item.is_available ? 'success' : 'danger'}
                                                className="px-3"
                                            >
                                                {item.is_available ? 'Available' : 'Unavailable'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {item.notes ? (
                                                <span className="text-muted">{item.notes}</span>
                                            ) : (
                                                <span className="text-muted fst-italic">No notes</span>
                                            )}
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            {/* Add Availability Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-calendar me-2"></i>
                        Set Availability
                    </Modal.Title>
                </Modal.Header>
                
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>From Date <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_from"
                                        value={formData.date_from}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>To Date <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_to"
                                        value={formData.date_to}
                                        onChange={handleInputChange}
                                        min={formData.date_from || new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>From Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="time_from"
                                        value={formData.time_from}
                                        onChange={handleInputChange}
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank for all day availability
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>To Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="time_to"
                                        value={formData.time_to}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        name="is_available"
                                        checked={formData.is_available}
                                        onChange={handleInputChange}
                                        label="Available for bookings"
                                        className="mb-2"
                                    />
                                    <Form.Text className="text-muted">
                                        Uncheck this if you want to mark a time period as unavailable
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Add any notes about this availability (e.g., preferred event types, special requirements...)"
                            />
                        </Form.Group>

                        <Alert variant="light" className="border">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-info-circle text-info me-2"></i>
                                <small>
                                    <strong>Note:</strong> Event organizers will see your availability 
                                    when browsing artists. Keep it updated for better booking opportunities.
                                </small>
                            </div>
                        </Alert>
                    </Modal.Body>
                    
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Setting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    Set Availability
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default AvailabilityManagement; 