import React, { useState, useEffect } from 'react';
import { 
    Row, Col, Card, Button, Form, Modal, Alert, 
    Spinner, Badge 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';

const PortfolioManagement = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        media_type: 'image',
        media_url: '',
        project_date: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const mediaTypes = [
        { value: 'image', label: 'Image', icon: 'fas fa-image' },
        { value: 'video', label: 'Video', icon: 'fas fa-video' },
        { value: 'audio', label: 'Audio', icon: 'fas fa-music' },
        { value: 'document', label: 'Document', icon: 'fas fa-file-alt' },
        { value: 'link', label: 'Link', icon: 'fas fa-link' }
    ];

    const mediaTypeColors = {
        'image': 'success',
        'video': 'primary',
        'audio': 'warning',
        'document': 'info',
        'link': 'secondary'
    };

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const response = await artistService.getPortfolio();
            setPortfolio(response.data.data);
        } catch (error) {
            console.error('Load portfolio error:', error);
            toast.error('Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                description: item.description || '',
                media_type: item.media_type,
                media_url: item.media_url || '',
                project_date: item.project_date ? item.project_date.split('T')[0] : ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                description: '',
                media_type: 'image',
                media_url: '',
                project_date: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        setSubmitting(true);
        try {
            if (editingItem) {
                await artistService.updatePortfolioItem(editingItem.id, formData);
                toast.success('Portfolio item updated successfully!');
            } else {
                await artistService.addPortfolioItem(formData);
                toast.success('Portfolio item added successfully!');
            }
            loadPortfolio();
            handleCloseModal();
        } catch (error) {
            console.error('Portfolio submit error:', error);
            toast.error('Failed to save portfolio item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to remove this portfolio item?')) {
            return;
        }

        try {
            await artistService.removePortfolioItem(itemId);
            toast.success('Portfolio item removed successfully!');
            loadPortfolio();
        } catch (error) {
            console.error('Delete portfolio item error:', error);
            toast.error('Failed to remove portfolio item');
        }
    };

    const getMediaTypeIcon = (type) => {
        const mediaType = mediaTypes.find(mt => mt.value === type);
        return mediaType ? mediaType.icon : 'fas fa-file';
    };

    const getMediaTypeLabel = (type) => {
        const mediaType = mediaTypes.find(mt => mt.value === type);
        return mediaType ? mediaType.label : type;
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : 'No date';
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading portfolio...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">Portfolio</h4>
                    <p className="text-muted mb-0">
                        Showcase your best work and past projects
                    </p>
                </div>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    <i className="fas fa-plus me-2"></i>
                    Add Item
                </Button>
            </div>

            {portfolio.length === 0 ? (
                <Alert variant="info" className="text-center py-4">
                    <i className="fas fa-briefcase fa-3x mb-3 text-muted"></i>
                    <h5>No Portfolio Items Yet</h5>
                    <p className="mb-3">
                        Start building your portfolio by adding samples of your work, recordings, or project links.
                    </p>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        <i className="fas fa-plus me-2"></i>
                        Add Your First Item
                    </Button>
                </Alert>
            ) : (
                <Row>
                    {portfolio.map((item) => (
                        <Col md={6} lg={4} key={item.id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center">
                                            <i className={`${getMediaTypeIcon(item.media_type)} text-primary me-2`}></i>
                                            <Badge bg={mediaTypeColors[item.media_type]} className="px-2">
                                                {getMediaTypeLabel(item.media_type)}
                                            </Badge>
                                        </div>
                                        <div className="dropdown">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="border-0 me-1"
                                                onClick={() => handleShowModal(item)}
                                            >
                                                <i className="fas fa-edit text-primary"></i>
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="border-0"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <i className="fas fa-trash text-danger"></i>
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <h5 className="card-title mb-2">{item.title}</h5>
                                    
                                    {item.description && (
                                        <p className="text-muted small mb-3">
                                            {item.description}
                                        </p>
                                    )}
                                    
                                    {item.media_url && (
                                        <div className="mb-3">
                                            <a 
                                                href={item.media_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-outline-primary btn-sm"
                                            >
                                                <i className="fas fa-external-link-alt me-1"></i>
                                                View Media
                                            </a>
                                        </div>
                                    )}
                                    
                                    <div className="text-muted small">
                                        <i className="fas fa-calendar me-1"></i>
                                        {formatDate(item.project_date)}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add/Edit Portfolio Item Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-briefcase me-2"></i>
                        {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                    </Modal.Title>
                </Modal.Header>
                
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Live Concert at Madison Square Garden"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Media Type</Form.Label>
                                    <Form.Select
                                        name="media_type"
                                        value={formData.media_type}
                                        onChange={handleInputChange}
                                    >
                                        {mediaTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe this project, performance, or work sample..."
                            />
                        </Form.Group>

                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Media URL</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="media_url"
                                        value={formData.media_url}
                                        onChange={handleInputChange}
                                        placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                                    />
                                    <Form.Text className="text-muted">
                                        Link to YouTube, SoundCloud, Vimeo, or any other platform
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Project Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="project_date"
                                        value={formData.project_date}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="light" className="border">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-lightbulb text-warning me-2"></i>
                                <small>
                                    <strong>Tip:</strong> Add your best work samples, recordings, and projects 
                                    to showcase your range and quality to potential clients.
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
                                    {editingItem ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    {editingItem ? 'Update Item' : 'Add Item'}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default PortfolioManagement; 