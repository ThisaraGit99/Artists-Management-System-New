import React from 'react';
import { Navbar as BSNavbar, Nav, NavDropdown, Container, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, loading, isAuthenticated, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <BSNavbar bg="dark" variant="dark" expand="lg" className="py-3">
        <Container>
          <BSNavbar.Brand as={Link} to="/">
            <i className="fas fa-music me-2"></i>
            Artist Management
          </BSNavbar.Brand>
          <div className="d-flex align-items-center">
            <Spinner animation="border" size="sm" variant="light" />
          </div>
        </Container>
      </BSNavbar>
    );
  }

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="py-3 shadow-sm">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold">
          <i className="fas fa-music me-2"></i>
          Artist Management
        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              <i className="fas fa-home me-1"></i>
              Home
            </Nav.Link>

            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to={getDashboardRoute()}>
                  <i className="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </Nav.Link>

                {user?.role === 'organizer' && (
                  <>
                    <Nav.Link as={Link} to="/organizer/events">
                      <i className="fas fa-calendar-alt me-1"></i>
                      Events
                    </Nav.Link>
                    <Nav.Link as={Link} to="/artists">
                      <i className="fas fa-search me-1"></i>
                      Find Artists
                    </Nav.Link>
                    <Nav.Link as={Link} to="/organizer/bookings">
                      <i className="fas fa-calendar-check me-1"></i>
                      My Bookings
                    </Nav.Link>
                  </>
                )}

                {user?.role === 'artist' && (
                  <>
                    <Nav.Link as={Link} to="/artist/bookings">
                      <i className="fas fa-calendar-alt me-1"></i>
                      My Bookings
                    </Nav.Link>
                    <Nav.Link as={Link} to="/artist/packages">
                      <i className="fas fa-box me-1"></i>
                      My Packages
                    </Nav.Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <NavDropdown title={<><i className="fas fa-cog me-1"></i>Admin</>} id="admin-dropdown">
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <i className="fas fa-users me-2"></i>
                      Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/bookings">
                      <i className="fas fa-calendar-check me-2"></i>
                      All Bookings
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/analytics">
                      <i className="fas fa-chart-bar me-2"></i>
                      Analytics
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user me-1"></i>
                    {user?.name}
                    <span className="badge bg-secondary ms-2 text-capitalize">
                      {user?.role}
                    </span>
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="fas fa-user-edit me-2"></i>
                  Edit Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings">
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <button className="btn btn-primary btn-sm">
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar; 