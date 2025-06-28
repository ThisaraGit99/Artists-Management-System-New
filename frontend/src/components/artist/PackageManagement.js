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
    const [showFilters, setShowFilters] = useState(false);
    const [filteredPackages, setFilteredPackages] = useState([]);
    
    // Filter state
    const [filters, setFilters] = useState({
        category: '',
        status: 'all',
        priceMin: '',
        priceMax: '',
        duration: '',
        searchTerm: '',
        sortBy: 'newest'
    });

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

    useEffect(() => {
        applyFilters();
    }, [filters, packages]);

    const applyFilters = () => {
        let filtered = [...packages];

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(pkg => pkg.category === filters.category);
        }

        // Apply status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(pkg => 
                filters.status === 'active' ? pkg.is_active : !pkg.is_active
            );
        }

        // Apply price range filter
        if (filters.priceMin) {
            filtered = filtered.filter(pkg => parseFloat(pkg.price) >= parseFloat(filters.priceMin));
        }
        if (filters.priceMax) {
            filtered = filtered.filter(pkg => parseFloat(pkg.price) <= parseFloat(filters.priceMax));
        }

        // Apply duration filter
        if (filters.duration) {
            filtered = filtered.filter(pkg => pkg.duration === filters.duration);
        }

        // Apply search term
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(pkg => 
                pkg.title.toLowerCase().includes(searchLower) ||
                pkg.description?.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        switch (filters.sortBy) {
            case 'price_high':
                filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
            case 'price_low':
                filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        setFilteredPackages(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            status: 'all',
            priceMin: '',
            priceMax: '',
            duration: '',
            searchTerm: '',
            sortBy: 'newest'
        });
    };

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
            <Container className="py-4 px-4">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading packages...</span>
                </Spinner>
                <p className="mt-3">Loading your packages...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4 px-4">
            {/* Header Section */}
            <Row className="mb-4 mx-0">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="display-6 fw-bold text-primary mb-2">
                                <i className="fas fa-box me-3"></i>
                                Service Packages
                            </h1>
                            <p className="lead text-muted">Create and manage your performance packages</p>
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
                            variant="primary" 
                            onClick={() => handleShowModal()}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Create Package
                        </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Quick Stats */}
            <Row className="mb-4 mx-0">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <i className="fas fa-box fa-2x text-primary mb-2"></i>
                            <h3 className="fw-bold">{filteredPackages.length}</h3>
                            <small className="text-muted">Total Packages</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                            <h3 className="fw-bold">
                                {filteredPackages.filter(pkg => pkg.is_active).length}
                            </h3>
                            <small className="text-muted">Active Packages</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <i className="fas fa-pause-circle fa-2x text-warning mb-2"></i>
                            <h3 className="fw-bold">
                                {filteredPackages.filter(pkg => !pkg.is_active).length}
                            </h3>
                            <small className="text-muted">Inactive Packages</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <i className="fas fa-dollar-sign fa-2x text-info mb-2"></i>
                            <h3 className="fw-bold">
                                {filteredPackages.length > 0 ? 
                                    formatCurrency(filteredPackages.reduce((sum, pkg) => sum + parseFloat(pkg.price), 0) / filteredPackages.length) 
                                    : '$0.00'
                                }
                            </h3>
                            <small className="text-muted">Average Price</small>
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
                                Filter Packages
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
                            {/* Search */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Search Packages</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <i className="fas fa-search"></i>
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search by package title or description..."
                                            value={filters.searchTerm}
                                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* Category Filter */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Duration Filter */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Duration</Form.Label>
                                    <Form.Select
                                        value={filters.duration}
                                        onChange={(e) => handleFilterChange('duration', e.target.value)}
                                    >
                                        <option value="">All Durations</option>
                                        {durations.map(duration => (
                                            <option key={duration} value={duration}>{duration}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Status Filter */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Price Range */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Min Price</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            placeholder="0"
                                            value={filters.priceMin}
                                            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                                            min="0"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Max Price</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            placeholder="Any"
                                            value={filters.priceMax}
                                            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                            min="0"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* Sort By */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                    <Form.Select
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="price_high">Price (High to Low)</option>
                                        <option value="price_low">Price (Low to High)</option>
                                        <option value="alphabetical">Alphabetical</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Package List */}
            <Card className="mx-0">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fas fa-list me-2"></i>
                        Your Packages
                            {filteredPackages.length > 0 && (
                                <Badge bg="secondary" className="ms-2">
                                    {filteredPackages.length}
                                </Badge>
                            )}
                    </h5>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status" variant="primary">
                                <span className="visually-hidden">Loading packages...</span>
                            </Spinner>
                            <p className="mt-3">Loading your packages...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-box fa-3x text-muted mb-3"></i>
                            <h5>No packages found</h5>
                            <p className="text-muted">
                                {packages.length === 0 
                                    ? "Create your first service package to get started!" 
                                    : "Try adjusting your filters to see more packages"}
                            </p>
                            {packages.length === 0 && (
                            <Button 
                                variant="primary" 
                                onClick={() => handleShowModal()}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Create Your First Package
                            </Button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                        <th className="px-4">Package Details</th>
                                    <th>Category</th>
                                    <th>Duration</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                        <th className="px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                    {filteredPackages.map(pkg => (
                                    <tr key={pkg.id}>
                                            <td className="px-4">
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
                                            <td className="px-4">
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
                        </div>
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