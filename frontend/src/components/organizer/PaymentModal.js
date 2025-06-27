import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import organizerService from '../../services/organizerService';

const PaymentModal = ({ show, onHide, booking, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [paymentReceipt, setPaymentReceipt] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show && booking) {
            loadPaymentDetails();
        }
    }, [show, booking]);

    const loadPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await organizerService.getPaymentDetails(booking.id);
            setPaymentDetails(response.data.data);
        } catch (error) {
            console.error('Error loading payment details:', error);
            toast.error('Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!paymentReceipt.trim()) {
            setErrors({ paymentReceipt: 'Payment receipt is required' });
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const response = await organizerService.makePayment(booking.id, {
                paymentReceipt: paymentReceipt.trim()
            });

            if (response.data.success) {
                toast.success('Payment processed successfully!');
                onPaymentSuccess && onPaymentSuccess(response.data.data);
                onHide();
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    if (!booking) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="fas fa-credit-card me-2"></i>
                    Process Payment
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {loading && !paymentDetails ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Loading payment details...</p>
                    </div>
                ) : paymentDetails ? (
                    <>
                        {/* Event Details */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h6 className="mb-0">
                                    <i className="fas fa-calendar me-2"></i>
                                    Event Details
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <strong>Event:</strong> {booking.event_name}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Artist:</strong> {paymentDetails.booking.artist_name}
                                    </Col>
                                    <Col md={6} className="mt-2">
                                        <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}
                                    </Col>
                                    <Col md={6} className="mt-2">
                                        <strong>Duration:</strong> {booking.duration || 'N/A'}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Payment Breakdown */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h6 className="mb-0">
                                    <i className="fas fa-receipt me-2"></i>
                                    Payment Breakdown
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Original Amount:</span>
                                    <span>{formatCurrency(paymentDetails.paymentBreakdown.originalAmount)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Platform Fee (3%):</span>
                                    <span className="text-warning">
                                        +{formatCurrency(paymentDetails.paymentBreakdown.platformFee)}
                                    </span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-3">
                                    <strong>Total to Pay:</strong>
                                    <strong className="text-primary fs-5">
                                        {formatCurrency(paymentDetails.paymentBreakdown.totalToPay)}
                                    </strong>
                                </div>
                                <Alert variant="info" className="small mb-0">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Artist will receive {formatCurrency(paymentDetails.paymentBreakdown.netToArtist)} after the 3% platform fee deduction.
                                </Alert>
                            </Card.Body>
                        </Card>

                        {/* Payment Form */}
                        <Form onSubmit={handlePayment}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Payment Receipt / Confirmation <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={paymentReceipt}
                                    onChange={(e) => setPaymentReceipt(e.target.value)}
                                    placeholder="Enter payment confirmation details, transaction ID, or upload receipt information..."
                                    isInvalid={!!errors.paymentReceipt}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.paymentReceipt}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Please provide payment confirmation details for our records.
                                </Form.Text>
                            </Form.Group>

                            <Alert variant="warning" className="small">
                                <i className="fas fa-shield-alt me-2"></i>
                                <strong>Escrow Protection:</strong> Your payment will be held securely until the event is completed. 
                                The artist will receive payment after you confirm event completion or automatically after 3 days.
                            </Alert>
                        </Form>
                    </>
                ) : (
                    <Alert variant="danger">
                        Failed to load payment details. Please try again.
                    </Alert>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                {paymentDetails && (
                    <Button 
                        type="submit" 
                        variant="success" 
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check me-2"></i>
                                Confirm Payment ({formatCurrency(paymentDetails.paymentBreakdown.totalToPay)})
                            </>
                        )}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default PaymentModal; 