import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, Modal, 
  Spinner, Alert, Badge, Pagination, Dropdown, InputGroup 
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const response = await adminService.getAllUsers(currentPage, 10, filters);
      
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Role changes are disabled for security - roles are fixed after registration

  const handleStatusChange = (userId, newStatus) => {
    setActionLoading(true);
    adminService.updateUserStatus(userId, newStatus)
      .then(() => {
        fetchUsers();
        setActionLoading(false);
      })
      .catch(error => {
        console.error('Update status error:', error);
        setError(error.message || 'Failed to update user status');
        setActionLoading(false);
      });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.updateUser(selectedUser.id, editFormData);
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Update user error:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await adminService.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'artist': return 'success';
      case 'organizer': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'verified': return 'success';
      case 'unverified': return 'warning';
      case 'inactive': return 'secondary';
      case 'suspended': return 'warning';
      default: return 'light';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading users...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6 fw-bold text-primary">
            <i className="fas fa-users me-3"></i>
            User Management
          </h1>
          <p className="lead text-muted">Manage all users in the system</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="artist">Artists</option>
                <option value="organizer">Organizers</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date Joined</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card>
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                Users ({pagination.total || 0})
              </h5>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={fetchUsers}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle me-3">
                          {user.profile_image ? (
                            <img 
                              src={user.profile_image} 
                              alt={user.name}
                              className="rounded-circle"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="fw-bold">{user.name}</div>
                          <small className="text-muted">{user.email}</small>
                          {user.phone && (
                            <div><small className="text-muted">{user.phone}</small></div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Dropdown>
                          <Dropdown.Toggle 
                            as={Badge} 
                            bg={getStatusBadgeVariant(user.status || 'unverified')}
                            style={{ cursor: 'pointer' }}
                            disabled={actionLoading}
                          >
                            {user.status || 'unverified'}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(user.id, 'verified')}
                              disabled={(user.status || 'unverified') === 'verified'}
                            >
                              <i className="fas fa-check-circle me-2 text-success"></i>
                              Verified
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(user.id, 'unverified')}
                              disabled={(user.status || 'unverified') === 'unverified'}
                            >
                              <i className="fas fa-times-circle me-2 text-warning"></i>
                              Unverified
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </td>
                    <td>
                      <small>
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </small>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          <i className="fas fa-ellipsis-v"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openEditModal(user)}>
                            <i className="fas fa-edit me-2"></i>
                            Edit Details
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => openDeleteModal(user)}
                          >
                            <i className="fas fa-trash me-2"></i>
                            Delete User
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Card.Footer className="bg-white">
            <Row className="align-items-center">
              <Col>
                <small className="text-muted">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} users
                </small>
              </Col>
              <Col xs="auto">
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={pagination.current_page <= 1}
                    onClick={() => setCurrentPage(pagination.current_page - 1)}
                  />
                  {[...Array(pagination.total_pages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === pagination.current_page}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={pagination.current_page >= pagination.total_pages}
                    onClick={() => setCurrentPage(pagination.current_page + 1)}
                  />
                </Pagination>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User Details</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              {actionLoading && <Spinner animation="border" size="sm" className="me-2" />}
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5>Are you sure?</h5>
            <p className="text-muted">
              This action cannot be undone. This will permanently delete the user account for:
            </p>
            <div className="bg-light p-3 rounded">
              <strong>{selectedUser?.name}</strong><br />
              <small className="text-muted">{selectedUser?.email}</small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement; 