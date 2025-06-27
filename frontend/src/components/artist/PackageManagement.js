import React, { useState, useEffect } from 'react';
import { 
    Container, Row, Col, Card, Button, Modal, Form, 
    Table, Badge, Spinner, Alert, InputGroup 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';

const PackageManagement = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        includes: [''],
        is_active: true
    });
    const [formErrors, setFormErrors] = useState({});

    const categories = [
        'Wedding', 'Corporate Event', 'Concert', 'Private Party', 
        'Festival', 'Restaurant/Bar', 'Club', 'Birthday Party',
        'Anniversary', 'Graduation', 'Holiday Event', 'Other'
    ];

    const durations = [
        '1 hour', '2 hours', '3 hours', '4 hours', 
        'Half day (4-6 hours)', 'Full day (8+ hours)', 
        'Weekend', 'Custom'
    ];

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setLoading(true);
            const response = await artistService.getPackages();
            setPackages(response.data.data);
        } catch (error) {
            console.error('Load packages error:', error);
            toast.error('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (packageToEdit = null) => {
        if (packageToEdit) {
            setEditingPackage(packageToEdit);
            setFormData({
                title: packageToEdit.title,
                description: packageToEdit.description || '',
                price: packageToEdit.price.toString(),
                duration: packageToEdit.duration,
                category: packageToEdit.category,
                includes: packageToEdit.includes ? 
                    (typeof packageToEdit.includes === 'string' ? 
                        JSON.parse(packageToEdit.includes) : packageToEdit.includes) : [''],
                is_active: packageToEdit.is_active
            });
        } else {
            setEditingPackage(null);
            setFormData({
                title: '',
                description: '',
                price: '',
                duration: '',
                category: '',
                includes: [''],
                is_active: true
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPackage(null);
        setFormData({
            title: '',
            description: '',
            price: '',
            duration: '',
            category: '',
            includes: ['']
        });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleIncludeChange = (index, value) => {
        const newIncludes = [...formData.includes];
        newIncludes[index] = value;
        setFormData(prev => ({
            ...prev,
            includes: newIncludes
        }));
    };

    const addIncludeField = () => {
        setFormData(prev => ({
            ...prev,
            includes: [...prev.includes, '']
        }));
    };

    const removeIncludeField = (index) => {
        if (formData.includes.length > 1) {
            const newIncludes = formData.includes.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                includes: newIncludes
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.title.trim()) {
            errors.title = 'Package title is required';
        }
        
        if (!formData.price || parseFloat(formData.price) <= 0) {
            errors.price = 'Valid price is required';
        }
        
        if (!formData.duration) {
            errors.duration = 'Duration is required';
        }
        
        if (!formData.category) {
            errors.category = 'Category is required';
        }

        const validIncludes = formData.includes.filter(item => item.trim());
        if (validIncludes.length === 0) {
            errors.includes = 'At least one included item is required';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const validIncludes = formData.includes.filter(item => item.trim());
            const packageData = {
                ...formData,
                includes: validIncludes,
                price: parseFloat(formData.price)
            };

            console.log('Submitting package data:', packageData);
            console.log('Editing package?', !!editingPackage);

            if (editingPackage) {
                await artistService.updatePackage(editingPackage.id, packageData);
                toast.success('Package updated successfully!');
            } else {
                await artistService.addPackage(packageData);
                toast.success('Package created successfully!');
            }

            handleCloseModal();
            loadPackages();
        } catch (error) {
            console.error('Save package error:', error);
            toast.error('Failed to save package');
        }
    };

    const handleToggleStatus = async (packageId) => {
        try {
            await artistService.togglePackageStatus(packageId);
            toast.success('Package status updated!');
            loadPackages();
        } catch (error) {
            console.error('Toggle package status error:', error);
            toast.error('Failed to update package status');
        }
    };

    const handleDeletePackage = async (packageId, packageTitle) => {
        if (window.confirm(`Are you sure you want to delete "${packageTitle}"? This action cannot be undone.`)) {
            try {
                await artistService.deletePackage(packageId);
                toast.success('Package deleted successfully!');
                loadPackages();
            } catch (error) {
                console.error('Delete package error:', error);
                toast.error('Failed to delete package');
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading packages...</span>
                </Spinner>
                <p className="mt-3">Loading your packages...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <i className="fas fa-box me-2"></i>
                                Package Management
                            </h2>
                            <p className="text-muted mb-0">
                                Create and manage your service packages for clients
                            </p>
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={() => handleShowModal()}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Create Package
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Package Stats */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <i className="fas fa-box fa-2x text-primary mb-2"></i>
                            <h4 className="fw-bold">{packages.length}</h4>
                            <p className="text-muted mb-0">Total Packages</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                            <h4 className="fw-bold">
                                {packages.filter(pkg => pkg.is_active).length}
                            </h4>
                            <p className="text-muted mb-0">Active Packages</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <i className="fas fa-dollar-sign fa-2x text-warning mb-2"></i>
                            <h4 className="fw-bold">
                                {packages.length > 0 ? 
                                    formatCurrency(packages.reduce((sum, pkg) => sum + parseFloat(pkg.price), 0) / packages.length) 
                                    : '$0.00'
                                }
                            </h4>
                            <p className="text-muted mb-0">Average Price</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Package List */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <h5 className="mb-0">
                        <i className="fas fa-list me-2"></i>
                        Your Packages
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {packages.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-box fa-3x text-muted mb-3"></i>
                            <h5>No packages yet</h5>
                            <p className="text-muted">Create your first service package to get started!</p>
                            <Button 
                                variant="primary" 
                                onClick={() => handleShowModal()}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Create Your First Package
                            </Button>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Package Details</th>
                                    <th>Category</th>
                                    <th>Duration</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.map(pkg => (
                                    <tr key={pkg.id}>
                                        <td>
                                            <div>
                                                <div className="fw-bold">{pkg.title}</div>
                                                {pkg.description && (
                                                    <small className="text-muted">
                                                        {pkg.description.length > 50 
                                                            ? `${pkg.description.substring(0, 50)}...` 
                                                            : pkg.description
                                                        }
                                                    </small>
                                                )}
                                                <div className="mt-1">
                                                    <small className="text-info">
                                                        <i className="fas fa-check me-1"></i>
                                                        {pkg.includes ? 
                                                            (typeof pkg.includes === 'string' ? 
                                                                JSON.parse(pkg.includes).length : pkg.includes.length
                                                            ) : 0
                                                        } items included
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg="secondary">{pkg.category}</Badge>
                                        </td>
                                        <td>{pkg.duration}</td>
                                        <td className="fw-bold text-success">
                                            {formatCurrency(pkg.price)}
                                        </td>
                                        <td>
                                            <Badge bg={pkg.is_active ? 'success' : 'secondary'}>
                                                {pkg.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleShowModal(pkg)}
                                                    title="Edit Package"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </Button>
                                                <Button
                                                    variant={pkg.is_active ? 'outline-warning' : 'outline-success'}
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(pkg.id)}
                                                    title={pkg.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    <i className={`fas fa-${pkg.is_active ? 'pause' : 'play'}`}></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                                                    title="Delete Package"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Create/Edit Package Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-box me-2"></i>
                        {editingPackage ? 'Edit Package' : 'Create New Package'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Package Title <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Wedding Reception Package"
                                        isInvalid={!!formErrors.title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.title}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Price <span className="text-danger">*</span>
                                    </Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            isInvalid={!!formErrors.price}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.price}
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Category <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        isInvalid={!!formErrors.category}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.category}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Duration <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        isInvalid={!!formErrors.duration}
                                    >
                                        <option value="">Select Duration</option>
                                        {durations.map(duration => (
                                            <option key={duration} value={duration}>
                                                {duration}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.duration}
                                    </Form.Control.Feedback>
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
                                placeholder="Describe your package, what makes it special, and any additional details..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                What's Included <span className="text-danger">*</span>
                            </Form.Label>
                            {formData.includes.map((include, index) => (
                                <div key={index} className="d-flex mb-2">
                                    <Form.Control
                                        type="text"
                                        value={include}
                                        onChange={(e) => handleIncludeChange(index, e.target.value)}
                                        placeholder="e.g., Sound system setup, 3-hour performance"
                                    />
                                    {formData.includes.length > 1 && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="ms-2"
                                            onClick={() => removeIncludeField(index)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={addIncludeField}
                                className="mt-2"
                            >
                                <i className="fas fa-plus me-1"></i>
                                Add Item
                            </Button>
                            {formErrors.includes && (
                                <div className="text-danger small mt-1">{formErrors.includes}</div>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            <i className="fas fa-save me-2"></i>
                            {editingPackage ? 'Update Package' : 'Create Package'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default PackageManagement; 