import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab, Badge, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';
import BookingRequestModal from './BookingRequestModal';

const ArtistDetailsModal = ({ artist, show, onHide }) => {
  const [artistDetails, setArtistDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (show && artist) {
      fetchArtistDetails();
    }
  }, [show, artist]);

  const fetchArtistDetails = async () => {
    try {
      setLoading(true);
      const response = await artistService.getArtistDetails(artist.id);
      
      if (response.data.success) {
        setArtistDetails(response.data.data);
      } else {
        toast.error('Failed to fetch artist details');
      }
    } catch (error) {
      console.error('Error fetching artist details:', error);
      toast.error('Failed to fetch artist details');
    } finally {
      setLoading(false);
    }
  };

  const getGenres = (genres) => {
    try {
      return genres ? JSON.parse(genres) : [];
    } catch {
      return [];
    }
  };

  const handleBookingRequest = () => {
    setShowBookingModal(true);
  };

  const handleBookingCreated = (bookingId) => {
    toast.success('Booking request sent successfully!');
    // Optionally redirect to booking management or close modal
    onHide();
  };

  const renderOverview = () => (
    <div>
      {/* Artist Header */}
      <Row className="mb-4">
        <Col md={3} className="text-center">
          <div className="avatar-large mb-3">
            <i className="fas fa-user fa-3x"></i>
          </div>
        </Col>
        <Col md={9}>
          <h4 className="fw-bold">{artistDetails.name}</h4>
          <p className="text-muted mb-2">
            <i className="fas fa-map-marker-alt me-2"></i>
            {artistDetails.location || 'Location not specified'}
          </p>
          <p className="text-muted mb-3">
            <i className="fas fa-envelope me-2"></i>
            {artistDetails.email}
          </p>
          
          {/* Quick Stats */}
          <Row className="g-2">
            <Col md={4}>
              <Card className="border-0 bg-light text-center">
                <Card.Body className="py-2">
                  <h5 className="text-primary mb-0">${artistDetails.hourly_rate || 0}</h5>
                  <small className="text-muted">Per Hour</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 bg-light text-center">
                <Card.Body className="py-2">
                  <h5 className="text-success mb-0">{artistDetails.experience_years || 0}y</h5>
                  <small className="text-muted">Experience</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 bg-light text-center">
                <Card.Body className="py-2">
                  <h5 className="text-info mb-0">{artistDetails.skills?.length || 0}</h5>
                  <small className="text-muted">Skills</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Bio */}
      {artistDetails.bio && (
        <Row className="mb-4">
          <Col>
            <h6 className="fw-bold">About</h6>
            <p className="text-muted">{artistDetails.bio}</p>
          </Col>
        </Row>
      )}

      {/* Genres */}
      {getGenres(artistDetails.genres).length > 0 && (
        <Row className="mb-4">
          <Col>
            <h6 className="fw-bold">Genres</h6>
            <div className="d-flex flex-wrap gap-2">
              {getGenres(artistDetails.genres).map((genre, index) => (
                <Badge key={index} bg="primary" className="px-3 py-2">
                  {genre}
                </Badge>
              ))}
            </div>
          </Col>
        </Row>
      )}

      {/* Skills */}
      {artistDetails.skills?.length > 0 && (
        <Row>
          <Col>
            <h6 className="fw-bold">Skills</h6>
            <div className="d-flex flex-wrap gap-2">
              {artistDetails.skills.map((skill, index) => (
                <Badge key={index} bg="light" text="dark" className="px-3 py-2">
                  {skill.skill_name}
                  {skill.proficiency_level && (
                    <span className="ms-2 text-muted">({skill.proficiency_level})</span>
                  )}
                </Badge>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </div>
  );

  const renderPortfolio = () => (
    <div>
      {artistDetails.portfolio?.length > 0 ? (
        <Row>
          {artistDetails.portfolio.map((item, index) => (
            <Col md={6} key={index} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h6 className="fw-bold mb-0">{item.title}</h6>
                    <Badge bg="info" className="small">
                      {item.type || 'Portfolio'}
                    </Badge>
                  </div>
                  
                  {item.description && (
                    <p className="text-muted small mb-3">{item.description}</p>
                  )}
                  
                  {item.media_url && (
                    <div className="mb-3">
                      {item.type === 'video' ? (
                        <div className="ratio ratio-16x9">
                          <iframe
                            src={item.media_url}
                            title={item.title}
                            allowFullScreen
                            className="rounded"
                          ></iframe>
                        </div>
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  )}
                  
                  {item.external_link && (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="fas fa-external-link-alt me-1"></i>
                      View Details
                    </a>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
          <p className="text-muted">No portfolio items available</p>
        </div>
      )}
    </div>
  );

  const renderPackages = () => {
    console.log('Artist packages:', artistDetails.packages); // Debug log
    
    return (
      <div>
        {artistDetails.packages?.length > 0 ? (
          <Row>
            {artistDetails.packages.map((pkg, index) => (
              <Col md={6} key={index} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="fw-bold mb-0">{pkg.title}</h6>
                      <Badge bg="success" className="fs-6">
                        ${pkg.price}
                      </Badge>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-muted mb-3 flex-grow-1">{pkg.description}</p>
                    )}
                    
                    <div className="border-top pt-3">
                      <Row className="g-2 text-sm">
                        {pkg.duration && (
                          <Col xs={6}>
                            <i className="fas fa-clock text-primary me-2"></i>
                            <span className="small">{pkg.duration}</span>
                          </Col>
                        )}
                        {pkg.category && (
                          <Col xs={6}>
                            <i className="fas fa-tag text-primary me-2"></i>
                            <span className="small">{pkg.category}</span>
                          </Col>
                        )}
                        {pkg.includes && Array.isArray(pkg.includes) && pkg.includes.length > 0 && (
                          <Col xs={12}>
                            <div className="mt-2">
                              <h6 className="small fw-bold mb-2">Includes:</h6>
                              <ul className="list-unstyled mb-0">
                                {pkg.includes.map((item, idx) => (
                                  <li key={idx} className="small text-muted">
                                    <i className="fas fa-check-circle text-success me-2"></i>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-5">
            <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
            <p className="text-muted">No packages available</p>
            <p className="small text-muted">Contact this artist directly to discuss custom packages</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user me-2"></i>
            Artist Details
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading artist details...</p>
            </div>
          ) : artistDetails ? (
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="overview" title="Overview">
                {renderOverview()}
              </Tab>
              <Tab eventKey="portfolio" title="Portfolio">
                {renderPortfolio()}
              </Tab>
              <Tab eventKey="packages" title="Packages">
                {renderPackages()}
              </Tab>
            </Tabs>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <p className="text-muted">Failed to load artist details</p>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          {artistDetails && (
            <Button variant="primary" onClick={handleBookingRequest}>
              <i className="fas fa-paper-plane me-2"></i>
              Send Booking Request
            </Button>
          )}
        </Modal.Footer>

        <style jsx>{`
          .avatar-large {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(45deg, #007bff, #0056b3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin: 0 auto;
          }
        `}</style>
      </Modal>

      {/* Booking Request Modal */}
      <BookingRequestModal
        artist={artist}
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        onBookingCreated={handleBookingCreated}
      />
    </>
  );
};

export default ArtistDetailsModal; 