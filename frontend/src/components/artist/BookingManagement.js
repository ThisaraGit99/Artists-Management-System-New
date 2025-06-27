import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Button, Modal, Form,
    Alert, Badge, Pagination, InputGroup, Spinner, Tab, Tabs
} from 'react-bootstrap';
import { formatDistance, format } from 'date-fns';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        payment_status: '',
        organizer_name: '',
        date_from: '',
        date_to: '',
        sort_by: 'newest',
        page: 1,
        limit: 10
    });

    // Modals
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);

    // Response form
    const [responseAction, setResponseAction] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [responseLoading, setResponseLoading] = useState(false);

    const statusColors = {
        pending: 'warning',
        confirmed: 'success',
        cancelled: 'danger',
        completed: 'info',
        in_progress: 'primary'
    };

    const statusCounts = {
        all: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    useEffect(() => {
        fetchBookings();
    }, [filters]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: filters.page.toString(),
                limit: filters.limit.toString(),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.payment_status && { payment_status: filters.payment_status }),
                ...(filters.organizer_name && { organizer_name: filters.organizer_name }),
                ...(filters.date_from && { date_from: filters.date_from }),
                ...(filters.date_to && { date_to: filters.date_to }),
                sort_by: filters.sort_by
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/artists/bookings?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setBookings(data.data);
                if (data.pagination) {
                    setCurrentPage(data.pagination.current_page);
                    setTotalPages(data.pagination.total_pages);
                    setTotal(data.pagination.total);
                }
            } else {
                setError(data.message || 'Failed to fetch bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setError('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingDetails = async (bookingId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/artists/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setBookingDetails(data.data);
                setShowDetailsModal(true);
            } else {
                setError(data.message || 'Failed to fetch booking details');
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            setError('Failed to fetch booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBooking || !responseAction) return;

        try {
            setResponseLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/artists/bookings/${selectedBooking.id}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: responseAction,
                    message: responseMessage
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Booking ${responseAction}ed successfully`);
                setShowResponseModal(false);
                setResponseAction('');
                setResponseMessage('');
                setSelectedBooking(null);
                fetchBookings();
            } else {
                setError(data.message || `Failed to ${responseAction} booking`);
            }
        } catch (error) {
            console.error('Error responding to booking:', error);
            setError(`Failed to ${responseAction} booking`);
        } finally {
            setResponseLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus, notes = '') => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/artists/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: notes
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Booking status updated successfully');
                fetchBookings();
            } else {
                setError(data.message || 'Failed to update booking status');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            setError('Failed to update booking status');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: field === 'page' ? value : 1 // Reset page only when changing other filters
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            payment_status: '',
            organizer_name: '',
            date_from: '',
            date_to: '',
            sort_by: 'newest',
            page: 1,
            limit: 10
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const getFilteredBookings = () => {
        if (filters.status === 'all') return bookings;
        return bookings.filter(booking => booking.status === filters.status);
    };

    const openResponseModal = (booking, action) => {
        setSelectedBooking(booking);
        setResponseAction(action);
        setShowResponseModal(true);
    };

    return (
        <Container className="py-4 px-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="display-6 fw-bold text-primary mb-2">
                                <i className="fas fa-calendar-check me-3"></i>
                                My Bookings
                            </h1>
                            <p className="lead text-muted">Manage your booking requests and events</p>
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
                                variant="outline-primary"
                                onClick={fetchBookings}
                                disabled={loading}
                            >
                                <i className="fas fa-sync-alt me-1"></i>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Alert Messages */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
                    {success}
                </Alert>
            )}

            {/* Quick Stats */}
            <Row className="mb-4 mx-0">
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-primary">{statusCounts.all}</h3>
                            <small className="text-muted">Total Bookings</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-warning">{statusCounts.pending}</h3>
                            <small className="text-muted">Pending</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-success">{statusCounts.confirmed}</h3>
                            <small className="text-muted">Confirmed</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-primary">{statusCounts.in_progress}</h3>
                            <small className="text-muted">In Progress</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-info">{statusCounts.completed}</h3>
                            <small className="text-muted">Completed</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h3 className="text-danger">{statusCounts.cancelled}</h3>
                            <small className="text-muted">Cancelled</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filter Section */}
            {showFilters && (
                <Card className="mb-4 mx-0">
                    <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="fas fa-sliders-h me-2"></i>
                                Filter Bookings
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
                            {/* Status Filter */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Booking Status</Form.Label>
                                    <Form.Select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="disputed">Disputed</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Payment Status Filter */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Payment Status</Form.Label>
                                    <Form.Select
                                        value={filters.payment_status}
                                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                                    >
                                        <option value="">All Payment Statuses</option>
                                        <option value="pending">Pending Payment</option>
                                        <option value="paid">Paid</option>
                                        <option value="released">Released</option>
                                        <option value="refunded">Refunded</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Organizer Name Search */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Organizer Name</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <i className="fas fa-search"></i>
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search by organizer name..."
                                            value={filters.organizer_name}
                                            onChange={(e) => handleFilterChange('organizer_name', e.target.value)}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* Date Range */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>From Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filters.date_from}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>To Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filters.date_to}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Sort By */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                    <Form.Select
                                        value={filters.sort_by}
                                        onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="event_date">Event Date</option>
                                        <option value="amount_high">Amount (High to Low)</option>
                                        <option value="amount_low">Amount (Low to High)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Results Per Page */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Results Per Page</Form.Label>
                                    <Form.Select
                                        value={filters.limit}
                                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                    >
                                        <option value="5">5 per page</option>
                                        <option value="10">10 per page</option>
                                        <option value="25">25 per page</option>
                                        <option value="50">50 per page</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Bookings Table */}
            <Card className="mx-0">
                <Card.Header>
                    <h5 className="mb-0">
                        <i className="fas fa-list me-2"></i>
                        Booking Requests
                        {total > 0 && (
                            <Badge bg="secondary" className="ms-2">{total}</Badge>
                        )}
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No bookings found</h5>
                            <p className="text-muted">
                                {filters.status !== 'all' || filters.organizer_name || filters.date_from || filters.date_to
                                    ? 'Try adjusting your filters'
                                    : 'You haven\'t received any booking requests yet'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Event</th>
                                        <th>Organizer</th>
                                        <th>Date & Time</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>
                                                <div>
                                                    <strong>{booking.event_name}</strong>
                                                    {booking.venue_address && (
                                                        <div className="small text-muted">
                                                            <i className="fas fa-map-marker-alt me-1"></i>
                                                            {booking.venue_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div>{booking.organizer_name}</div>
                                                    <small className="text-muted">{booking.organizer_email}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    {format(new Date(booking.event_date), 'MMM dd, yyyy')}
                                                    {booking.event_time && (
                                                        <div className="small text-muted">
                                                            {booking.event_time}
                                                            {booking.duration && ` (${booking.duration})`}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{formatCurrency(booking.total_amount)}</strong>
                                            </td>
                                            <td>
                                                {booking.payment_status === 'paid' ? (
                                                    <div>
                                                        <Badge bg="primary" className="mb-1">
                                                            💳 Payment Made
                                                        </Badge>
                                                        <br />
                                                        <small className="text-muted">Status: {booking.status}</small>
                                                    </div>
                                                ) : booking.payment_status === 'released' ? (
                                                    <div>
                                                        <Badge bg="success" className="mb-1">
                                                            ✅ Payment Released
                                                        </Badge>
                                                        <br />
                                                        <small className="text-muted">Event Completed</small>
                                                    </div>
                                                ) : booking.status === 'disputed' ? (
                                                    <div>
                                                        <Badge bg="warning" className="mb-1">
                                                            ⚠️ Disputed
                                                        </Badge>
                                                        <br />
                                                        <small className="text-muted">Under Review</small>
                                                    </div>
                                                ) : (
                                                    <Badge bg={statusColors[booking.status]}>
                                                        {booking.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {formatDistance(new Date(booking.created_at), new Date(), { addSuffix: true })}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        onClick={() => fetchBookingDetails(booking.id)}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </Button>
                                                    
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() => openResponseModal(booking, 'accept')}
                                                                title="Accept Booking"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => openResponseModal(booking, 'decline')}
                                                                title="Decline Booking"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </Button>
                                                        </>
                                                    )}
                                                    

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card.Footer>
                        <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                Showing {((currentPage - 1) * filters.limit) + 1} to {Math.min(currentPage * filters.limit, total)} of {total} bookings
                            </small>
                            <Pagination className="mb-0">
                                <Pagination.Prev 
                                    disabled={currentPage === 1}
                                    onClick={() => handleFilterChange('page', currentPage - 1)}
                                />
                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() => handleFilterChange('page', index + 1)}
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next 
                                    disabled={currentPage === totalPages}
                                    onClick={() => handleFilterChange('page', currentPage + 1)}
                                />
                            </Pagination>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            {/* Booking Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {bookingDetails && (
                        <Row>
                            <Col md={6}>
                                <h6 className="fw-bold text-primary">Event Information</h6>
                                <div className="mb-3">
                                    <strong>Event Name:</strong> {bookingDetails.booking.event_name}
                                </div>
                                <div className="mb-3">
                                    <strong>Date:</strong> {format(new Date(bookingDetails.booking.event_date), 'PPPP')}
                                </div>
                                {bookingDetails.booking.event_time && (
                                    <div className="mb-3">
                                        <strong>Time:</strong> {bookingDetails.booking.event_time}
                                        {bookingDetails.booking.duration && ` (Duration: ${bookingDetails.booking.duration})`}
                                    </div>
                                )}
                                {bookingDetails.booking.venue_address && (
                                    <div className="mb-3">
                                        <strong>Venue:</strong> {bookingDetails.booking.venue_address}
                                    </div>
                                )}
                                {bookingDetails.booking.event_description && (
                                    <div className="mb-3">
                                        <strong>Description:</strong>
                                        <div className="mt-1">{bookingDetails.booking.event_description}</div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <strong>Status:</strong>{' '}
                                    {bookingDetails.booking.payment_status === 'paid' ? (
                                        <span>
                                            <Badge bg="primary" className="ms-2">💳 Payment Made</Badge>
                                            <br />
                                            <small className="text-muted">Booking Status: {bookingDetails.booking.status}</small>
                                        </span>
                                    ) : bookingDetails.booking.payment_status === 'released' ? (
                                        <span>
                                            <Badge bg="success" className="ms-2">✅ Payment Released</Badge>
                                            <br />
                                            <small className="text-muted">Event Completed</small>
                                        </span>
                                    ) : bookingDetails.booking.status === 'disputed' ? (
                                        <span>
                                            <Badge bg="warning" className="ms-2">⚠️ Disputed</Badge>
                                            <br />
                                            <small className="text-muted">Under Admin Review</small>
                                        </span>
                                    ) : (
                                        <Badge bg={statusColors[bookingDetails.booking.status]}>
                                            {bookingDetails.booking.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <strong>Total Amount:</strong> {formatCurrency(bookingDetails.booking.total_amount)}
                                </div>
                                {bookingDetails.booking.payment_status && (
                                    <div className="mb-3">
                                        <strong>Payment Status:</strong>{' '}
                                        <Badge bg={bookingDetails.booking.payment_status === 'paid' ? 'primary' : 
                                                   bookingDetails.booking.payment_status === 'released' ? 'success' : 'secondary'}>
                                            {bookingDetails.booking.payment_status.toUpperCase()}
                                        </Badge>
                                    </div>
                                )}
                                {bookingDetails.booking.platform_fee && (
                                    <div className="mb-3">
                                        <strong>Platform Fee:</strong> {formatCurrency(bookingDetails.booking.platform_fee)} (10%)
                                    </div>
                                )}
                                {bookingDetails.booking.net_amount && (
                                    <div className="mb-3">
                                        <strong>You Will Receive:</strong> {formatCurrency(bookingDetails.booking.net_amount)}
                                    </div>
                                )}
                                {bookingDetails.booking.payment_date && (
                                    <div className="mb-3">
                                        <strong>Payment Date:</strong> {format(new Date(bookingDetails.booking.payment_date), 'PPpp')}
                                    </div>
                                )}
                            </Col>
                            <Col md={6}>
                                <h6 className="fw-bold text-primary">Organizer Information</h6>
                                <div className="mb-3">
                                    <strong>Name:</strong> {bookingDetails.booking.organizer_name}
                                </div>
                                <div className="mb-3">
                                    <strong>Email:</strong> {bookingDetails.booking.organizer_email}
                                </div>
                                {bookingDetails.booking.organizer_phone && (
                                    <div className="mb-3">
                                        <strong>Phone:</strong> {bookingDetails.booking.organizer_phone}
                                    </div>
                                )}

                                <h6 className="fw-bold text-primary mt-4">Timeline</h6>
                                <div className="mb-2">
                                    <strong>Created:</strong> {format(new Date(bookingDetails.booking.created_at), 'PPpp')}
                                </div>
                                <div className="mb-2">
                                    <strong>Last Updated:</strong> {format(new Date(bookingDetails.booking.updated_at), 'PPpp')}
                                </div>

                                {bookingDetails.messages && bookingDetails.messages.length > 0 && (
                                    <>
                                        <h6 className="fw-bold text-primary mt-4">Messages</h6>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {bookingDetails.messages.map((message, index) => (
                                                <div key={index} className="border rounded p-2 mb-2">
                                                    <div className="d-flex justify-content-between">
                                                        <small className="fw-bold">{message.sender_name}</small>
                                                        <small className="text-muted">
                                                            {format(new Date(message.created_at), 'MMM dd, h:mm a')}
                                                        </small>
                                                    </div>
                                                    <div className="mt-1">{message.message}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Response Modal */}
            <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {responseAction === 'accept' ? 'Accept' : 'Decline'} Booking
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleResponseSubmit}>
                    <Modal.Body>
                        {selectedBooking && (
                            <div className="mb-3">
                                <strong>Event:</strong> {selectedBooking.event_name}<br />
                                <strong>Organizer:</strong> {selectedBooking.organizer_name}<br />
                                <strong>Date:</strong> {format(new Date(selectedBooking.event_date), 'PPP')}<br />
                                <strong>Amount:</strong> {formatCurrency(selectedBooking.total_amount)}
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Message to Organizer (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder={
                                    responseAction === 'accept' 
                                        ? 'Thank you for choosing me for your event...'
                                        : 'I apologize, but I won\'t be able to perform at your event...'
                                }
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowResponseModal(false)}
                            disabled={responseLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant={responseAction === 'accept' ? 'success' : 'danger'}
                            disabled={responseLoading}
                        >
                            {responseLoading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className={`fas fa-${responseAction === 'accept' ? 'check' : 'times'} me-2`}></i>
                                    {responseAction === 'accept' ? 'Accept' : 'Decline'} Booking
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default BookingManagement; 