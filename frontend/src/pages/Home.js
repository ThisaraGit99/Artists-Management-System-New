import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [artistStartIndex, setArtistStartIndex] = useState(0);
  const [organizerStartIndex, setOrganizerStartIndex] = useState(0);

  const artists = [
    { id: 1, name: "John Smith", rating: 4.5, image: "/images/artists/artist1.jpg", genre: "Pop/Rock" },
    { id: 2, name: "Sarah Wilson", rating: 5.0, image: "/images/artists/artist2.jpg", genre: "Jazz" },
    { id: 3, name: "Michael Chen", rating: 4.8, image: "/images/artists/artist3.jpg", genre: "Classical" },
    { id: 4, name: "Emma Davis", rating: 4.7, image: "/images/artists/artist4.jpg", genre: "R&B" },
    { id: 5, name: "David Kim", rating: 4.9, image: "/images/artists/artist5.jpg", genre: "Electronic" }
  ];

  const organizers = [
    { 
      id: 1, 
      name: "Michael Events", 
      rating: 5.0, 
      image: "/images/organizers/organizer1.jpg",
      events: 50,
      speciality: "Music Festivals"
    },
    {
      id: 2,
      name: "Elite Weddings",
      rating: 4.9,
      image: "/images/organizers/organizer2.jpg",
      events: 75,
      speciality: "Wedding Events"
    },
    {
      id: 3,
      name: "Tech Conference Pro",
      rating: 4.8,
      image: "/images/organizers/organizer3.jpg",
      events: 40,
      speciality: "Tech Conferences"
    },
    {
      id: 4,
      name: "Sports Events Plus",
      rating: 4.7,
      image: "/images/organizers/organizer4.jpg",
      events: 60,
      speciality: "Sports Events"
    },
    {
      id: 5,
      name: "Cultural Celebrations",
      rating: 4.9,
      image: "/images/organizers/organizer5.jpg",
      events: 45,
      speciality: "Cultural Shows"
    }
  ];

  // Double the arrays for continuous scrolling
  const extendedArtists = [...artists, ...artists];
  const extendedOrganizers = [...organizers, ...organizers];

  useEffect(() => {
    setIsVisible(true);

    // Auto scroll for artists
    const artistInterval = setInterval(() => {
      setArtistStartIndex((prevIndex) => (prevIndex + 1) % artists.length);
    }, 3000);

    // Auto scroll for organizers
    const organizerInterval = setInterval(() => {
      setOrganizerStartIndex((prevIndex) => (prevIndex + 1) % organizers.length);
    }, 4000);

    return () => {
      clearInterval(artistInterval);
      clearInterval(organizerInterval);
    };
  }, [artists.length, organizers.length]);

  const CardComponent = ({ item, type }) => {
    const isArtist = type === 'artist';
    return (
      <div className="h-100">
        <Card className={`${isArtist ? 'artist-card' : 'organizer-card'} h-100`}>
          <div className="card-image-wrapper">
            <Card.Img 
              variant="top" 
              src={item.image} 
              className={isArtist ? 'artist-image' : 'organizer-image'}
            />
          </div>
          <Card.Body className="text-center">
            <h5 className={`${isArtist ? 'artist-name' : 'organizer-name'} mb-2`}>{item.name}</h5>
            {isArtist ? (
              <p className="text-muted mb-2">{item.genre}</p>
            ) : (
              <span className="organizer-speciality">{item.speciality}</span>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderSliderSection = (items, startIndex, type, title, subtitle) => {
    const visibleItems = items.slice(startIndex, startIndex + 4);
    if (visibleItems.length < 4) {
      visibleItems.push(...items.slice(0, 4 - visibleItems.length));
    }

  return (
      <section className={`${type}s-section py-5 ${type === 'organizer' ? 'bg-light' : ''}`}>
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="display-4 fw-bold text-gradient mb-3">{title}</h2>
            <p className="lead text-muted">{subtitle}</p>
          </div>

          <div className="continuous-slider-container">
            <Row className="g-4">
              {visibleItems.map((item, index) => (
                <Col key={`${item.id}-${index}`} xs={12} sm={6} lg={3}>
                  <CardComponent item={item} type={type} />
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      </section>
    );
  };

  return (
    <div className="home-page">
      {/* Hero Slider Section */}
      <section className="hero-section">
        <Container fluid className="px-0">
          <Row className="g-0">
            <Col className="position-relative">
              <Carousel fade interval={5000} className="modern-carousel">
                <Carousel.Item>
                  <div className="overlay"></div>
                  <img
                    className="d-block w-100 carousel-image"
                    src="/images/slider/slide1.jpg"
                    alt="Music Events"
                    style={{ height: '90vh', objectFit: 'cover' }}
                  />
                  <Carousel.Caption className="text-center carousel-content">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <h1 className="display-3 fw-bold text-gradient">Music Events</h1>
                      <p className="lead fw-light mb-4">Find the perfect artist for your event</p>
                      <Button 
                        variant="outline-light" 
                        size="lg"
                        className="btn-glow me-3"
                        as={Link}
                        to="/login"
                      >
                        Explore Artists
                      </Button>
                    </motion.div>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <div className="overlay"></div>
                  <img
                    className="d-block w-100 carousel-image"
                    src="/images/slider/slide2.jpg"
                    alt="Live Performances"
                    style={{ height: '90vh', objectFit: 'cover' }}
                  />
                  <Carousel.Caption className="text-center carousel-content">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <h1 className="display-3 fw-bold text-gradient">Live Performances</h1>
                      <p className="lead fw-light mb-4">Experience amazing live shows</p>
                      <Button 
                        variant="outline-light" 
                        size="lg"
                        className="btn-glow me-3"
                        as={Link}
                        to="/login"
                      >
                        Browse Events
                      </Button>
                    </motion.div>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <div className="overlay"></div>
                  <img
                    className="d-block w-100 carousel-image"
                    src="/images/slider/slide3.jpg"
                    alt="Artist Collaborations"
                    style={{ height: '90vh', objectFit: 'cover' }}
                  />
                  <Carousel.Caption className="text-center carousel-content">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <h1 className="display-3 fw-bold text-gradient">Artist Collaborations</h1>
                      <p className="lead fw-light mb-4">Connect with talented artists</p>
                      <Button 
                        variant="outline-light" 
                        size="lg"
                        className="btn-glow me-3"
                        as={Link}
                        to="/login"
                      >
                        Get Started
                      </Button>
                    </motion.div>
                  </Carousel.Caption>
                </Carousel.Item>
              </Carousel>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Artists Section */}
      {renderSliderSection(
        extendedArtists,
        artistStartIndex,
        'artist',
        'Popular Artists',
        'Discover talented performers for your events'
      )}

      {/* Organizers Section */}
      {renderSliderSection(
        extendedOrganizers,
        organizerStartIndex,
        'organizer',
        'Top Organizers',
        'Meet our most successful event creators'
      )}

      {/* Why Choose Us Section */}
      <section className="why-choose-us-section py-5">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="section-header text-center mb-5">
              <h2 className="display-4 fw-bold text-gradient mb-3">Why Choose Us</h2>
              <p className="lead text-muted">Experience the difference with our platform</p>
            </div>
          </motion.div>

          <Row className="g-4">
            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="feature-card text-center p-4">
                  <div className="feature-icon mb-4">
                    <i className="fas fa-search fa-2x"></i>
                  </div>
                  <h4 className="feature-title mb-3">Easy Discovery</h4>
                  <p className="feature-text">Find the perfect artist for any event with our advanced search</p>
                </div>
              </motion.div>
            </Col>

            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="feature-card text-center p-4">
                  <div className="feature-icon mb-4">
                    <i className="fas fa-shield-alt fa-2x"></i>
                  </div>
                  <h4 className="feature-title mb-3">Secure Platform</h4>
                  <p className="feature-text">Safe and secure transactions with buyer protection</p>
                </div>
              </motion.div>
            </Col>

            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="feature-card text-center p-4">
                  <div className="feature-icon mb-4">
                    <i className="fas fa-headset fa-2x"></i>
                  </div>
                  <h4 className="feature-title mb-3">24/7 Support</h4>
                  <p className="feature-text">Dedicated support team available round the clock to assist you</p>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Ready to Get Started Section */}
      <section className="cta-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <div className="cta-content">
                <h2 className="display-4 fw-bold text-gradient mb-4">Ready to Get Started?</h2>
                <p className="lead mb-4">Join our platform to connect with talented artists and create unforgettable events</p>
                <div className="cta-buttons">
                  <Link to="/login" className="btn btn-primary btn-lg me-3 btn-glow">
                    Sign Up Now
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Us Section */}
      <section className="contact-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="display-4 fw-bold text-gradient mb-3">Contact Us</h2>
            <p className="lead text-muted">Get in touch with our support team</p>
          </div>

          <Row className="justify-content-center">
            <Col lg={4} md={6} className="mb-4">
              <Card className="contact-card h-100 text-center">
                <Card.Body>
                  <div className="contact-icon mb-4">
                    <i className="fas fa-phone-alt fa-2x"></i>
                  </div>
                  <h4 className="contact-title mb-3">Phone</h4>
                  <p className="contact-info mb-0">
                    <a href="tel:+94112345678" className="text-decoration-none">
                      +94 11 234 5678
                    </a>
                  </p>
                  <p className="text-muted small">Mon-Fri, 9am-6pm</p>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} className="mb-4">
              <Card className="contact-card h-100 text-center">
                <Card.Body>
                  <div className="contact-icon mb-4">
                    <i className="fas fa-envelope fa-2x"></i>
                  </div>
                  <h4 className="contact-title mb-3">Email</h4>
                  <p className="contact-info mb-0">
                    <a href="mailto:support@artistmgmt.com" className="text-decoration-none">
                      support@artistmgmt.com
                    </a>
                  </p>
                  <p className="text-muted small">24/7 Support</p>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} className="mb-4">
              <Card className="contact-card h-100 text-center">
                <Card.Body>
                  <div className="contact-icon mb-4">
                    <i className="fas fa-map-marker-alt fa-2x"></i>
                  </div>
                  <h4 className="contact-title mb-3">Location</h4>
                  <p className="contact-info mb-0">
                    123 Artist Avenue<br />
                    Colombo 03, Sri Lanka
                  </p>
                  <p className="text-muted small">Visit Our Office</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="justify-content-center mt-5">
            <Col md={8} className="text-center">
              <div className="social-links">
                <h4 className="mb-4">Follow Us</h4>
                <div className="d-flex justify-content-center gap-4">
                  <a href="#" className="social-link">
                    <i className="fab fa-facebook-f fa-lg"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-twitter fa-lg"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-instagram fa-lg"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-linkedin-in fa-lg"></i>
                  </a>
                </div>
              </div>
              </Col>
            </Row>
          </Container>
        </section>
    </div>
  );
};

export default Home; 