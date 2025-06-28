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
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-users me-3"></i>
            User Management
          </h1>
          <p className="lead text-muted">Manage all users in the system</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm mb-4">
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
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0 text-primary">
                <i className="fas fa-users me-2"></i>
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
          <div className="table-responsive">
            <Table hover className="table-centered mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 rounded-start ps-3">User Details</th>
                  <th className="border-0">Role</th>
                  <th className="border-0">Contact</th>
                  <th className="border-0">Joined Date</th>
                  <th className="border-0">Status</th>
                  <th className="border-0 rounded-end text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <div className="avatar avatar-sm rounded-circle bg-light text-primary">
                            <i className="fas fa-user"></i>
                            </div>
                        </div>
                        <div className="flex-grow-1 ms-2">
                          <h6 className="mb-0">{user.name}</h6>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge 
                        bg={getRoleBadgeVariant(user.role)}
                        className="text-capitalize px-2 py-1"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <div>
                        <div className="mb-1">
                          <i className="fas fa-envelope me-1 text-muted"></i>
                          {user.email}
                        </div>
                        {user.phone && (
                          <div>
                            <i className="fas fa-phone me-1 text-muted"></i>
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <Badge 
                        bg={getStatusBadgeVariant(user.status)}
                        className="text-capitalize px-2 py-1"
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="text-end pe-3">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary me-2 p-0"
                        onClick={() => openEditModal(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0"
                            onClick={() => openDeleteModal(user)}
                          >
                        <i className="fas fa-trash-alt"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="fas fa-users text-muted fa-3x mb-3"></i>
              <h5 className="text-muted">No users found</h5>
              <p className="text-muted mb-0">Try adjusting your search or filters</p>
            </div>
          )}
        </Card.Body>
        {pagination.totalPages > 1 && (
          <Card.Footer className="bg-white border-0 py-3">
            <Row className="align-items-center">
              <Col>
                <small className="text-muted">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} users
                </small>
              </Col>
              <Col xs="auto">
                <Pagination className="mb-0">
                  <Pagination.First
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ))
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <Pagination.Ellipsis />
                        )}
                    <Pagination.Item
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                    >
                          {page}
                    </Pagination.Item>
                      </React.Fragment>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    disabled={currentPage === pagination.totalPages}
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