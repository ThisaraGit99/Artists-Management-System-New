import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';
import ArtistCard from '../../components/organizer/ArtistCard';
import ArtistDetailsModal from '../../components/organizer/ArtistDetailsModal';

const BrowseArtists = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    location: '',
    city: '',
    state: '',
    minRate: '',
    maxRate: '',
    experienceYears: '',
    availability: 'all',
    rating: '',
    skills: [],
    sortBy: 'rating',
    verificationStatus: 'all'
  });

  // Available options for dropdowns
  const availableGenres = [
    'Pop', 'Rock', 'Jazz', 'Classical', 'Hip Hop', 'Country', 
    'Electronic', 'Folk', 'R&B', 'Blues', 'Reggae', 'Punk'
  ];

  const availableSkills = [
    'Vocals', 'Guitar', 'Piano', 'Drums', 'Bass', 'Violin',
    'Saxophone', 'Trumpet', 'DJ', 'Production', 'Composition'
  ];

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [artists, searchTerm, filters]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await artistService.browseArtists();
      
      if (response.data.success) {
        setArtists(response.data.data);
      } else {
        toast.error('Failed to fetch artists');
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast.error('Failed to fetch artists');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...artists];

    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(artist => 
        artist.name?.toLowerCase().includes(search) ||
        artist.bio?.toLowerCase().includes(search) ||
        artist.skills?.some(skill => skill.toLowerCase().includes(search))
      );
    }

    // Apply genre filter
    if (filters.genre) {
      filtered = filtered.filter(artist => {
        try {
          const genres = artist.genres ? JSON.parse(artist.genres) : [];
          return genres.includes(filters.genre);
        } catch {
          return false;
        }
      });
    }

    // Apply location filters
    if (filters.city) {
      filtered = filtered.filter(artist =>
        artist.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter(artist =>
        artist.state?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    // Apply rate filters
    if (filters.minRate) {
      filtered = filtered.filter(artist => 
        artist.hourly_rate >= parseFloat(filters.minRate)
      );
    }

    if (filters.maxRate) {
      filtered = filtered.filter(artist => 
        artist.hourly_rate <= parseFloat(filters.maxRate)
      );
    }

    // Apply experience filter
    if (filters.experienceYears) {
      filtered = filtered.filter(artist => 
        artist.experience_years >= parseInt(filters.experienceYears)
      );
    }

    // Apply availability filter
    if (filters.availability !== 'all') {
      filtered = filtered.filter(artist => 
        artist.is_available === (filters.availability === 'available')
      );
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(artist => 
        artist.average_rating >= parseFloat(filters.rating)
      );
    }

    // Apply skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(artist => {
        const artistSkills = artist.skills || [];
        return filters.skills.every(skill => artistSkills.includes(skill));
      });
    }

    // Apply verification status filter
    if (filters.verificationStatus !== 'all') {
      filtered = filtered.filter(artist => 
        artist.is_verified === (filters.verificationStatus === 'verified')
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'experience':
        filtered.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
        break;
      case 'rate_low':
        filtered.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
        break;
      case 'rate_high':
        filtered.sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredArtists(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillToggle = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      genre: '',
      location: '',
      city: '',
      state: '',
      minRate: '',
      maxRate: '',
      experienceYears: '',
      availability: 'all',
      rating: '',
      skills: [],
      sortBy: 'rating',
      verificationStatus: 'all'
    });
  };

  const handleViewDetails = (artist) => {
    setSelectedArtist(artist);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedArtist(null);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading artists...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold text-primary mb-2">
                <i className="fas fa-search me-3"></i>
                Find Artists
              </h1>
              <p className="lead text-muted">
                Discover talented artists for your events
              </p>
            </div>
            <Button 
              variant="outline-primary"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-2"
            >
              <i className={`fas fa-${showFilters ? 'times' : 'filter'} me-2`}></i>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-users fa-2x text-primary mb-2"></i>
              <h3 className="fw-bold">{filteredArtists.length}</h3>
              <small className="text-muted">Artists Found</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
              <h3 className="fw-bold">
                {filteredArtists.filter(a => a.is_verified).length}
              </h3>
              <small className="text-muted">Verified Artists</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-star fa-2x text-warning mb-2"></i>
              <h3 className="fw-bold">
                {filteredArtists.filter(a => (a.average_rating || 0) >= 4.5).length}
              </h3>
              <small className="text-muted">Top Rated (4.5+)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check fa-2x text-info mb-2"></i>
              <h3 className="fw-bold">
                {filteredArtists.filter(a => a.is_available).length}
              </h3>
              <small className="text-muted">Available Now</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-sliders-h me-2"></i>
                Advanced Filters
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
              {/* Search Bar - Moved inside filters */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Search Artists</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, bio, or skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* First Row */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Genre</Form.Label>
                  <Form.Select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter city..."
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter state..."
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Second Row */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Min Rate ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange('minRate', e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Max Rate ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Any"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Min Experience (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={filters.experienceYears}
                    onChange={(e) => handleFilterChange('experienceYears', e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Min Rating</Form.Label>
                  <Form.Select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ ⭐⭐⭐⭐½</option>
                    <option value="4">4.0+ ⭐⭐⭐⭐</option>
                    <option value="3.5">3.5+ ⭐⭐⭐½</option>
                    <option value="3">3.0+ ⭐⭐⭐</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Third Row */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Availability</Form.Label>
                  <Form.Select
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                  >
                    <option value="all">All Artists</option>
                    <option value="available">Available Now</option>
                    <option value="unavailable">Currently Unavailable</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Verification Status</Form.Label>
                  <Form.Select
                    value={filters.verificationStatus}
                    onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
                  >
                    <option value="all">All Artists</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="experience">Most Experienced</option>
                    <option value="rate_low">Rate (Low to High)</option>
                    <option value="rate_high">Rate (High to Low)</option>
                    <option value="name">Name (A-Z)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Skills Section */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Skills</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <Badge
                        key={skill}
                        bg={filters.skills.includes(skill) ? "primary" : "light"}
                        text={filters.skills.includes(skill) ? "white" : "dark"}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSkillToggle(skill)}
                        className="px-3 py-2"
                      >
                        {skill}
                        {filters.skills.includes(skill) && (
                          <i className="fas fa-check ms-2"></i>
                        )}
                      </Badge>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Artists Grid */}
      <Row>
        {filteredArtists.length === 0 ? (
          <Col className="text-center py-5">
            <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
            <h5>No artists found</h5>
            <p className="text-muted">
              Try adjusting your filters to see more results
            </p>
          </Col>
        ) : (
          filteredArtists.map(artist => (
            <Col key={artist.id} md={4} className="mb-4">
              <ArtistCard 
                artist={artist} 
                onViewDetails={() => handleViewDetails(artist)}
              />
            </Col>
          ))
        )}
      </Row>

      {/* Artist Details Modal */}
      <ArtistDetailsModal
        show={showDetailsModal}
        onHide={handleCloseModal}
        artist={selectedArtist}
      />
    </Container>
  );
};

export default BrowseArtists; 