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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    location: '',
    minRate: '',
    maxRate: '',
    experienceYears: ''
  });

  // Available genres for dropdown
  const availableGenres = [
    'Pop', 'Rock', 'Jazz', 'Classical', 'Hip Hop', 'Country', 
    'Electronic', 'Folk', 'R&B', 'Blues', 'Reggae', 'Punk'
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
    let filtered = artists;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(artist => 
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.bio?.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(artist =>
        artist.location?.toLowerCase().includes(filters.location.toLowerCase())
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

    setFilteredArtists(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      genre: '',
      location: '',
      minRate: '',
      maxRate: '',
      experienceYears: ''
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
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-search me-3"></i>
            Find Artists
          </h1>
          <p className="lead text-muted">
            Discover talented artists for your events
          </p>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                {/* Search Bar */}
                <Col md={12}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search artists by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>

                {/* Filters Row */}
                <Col md={2}>
                  <Form.Select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={2}>
                  <Form.Control
                    type="text"
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Min Rate ($)"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange('minRate', e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Max Rate ($)"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Min Experience"
                    value={filters.experienceYears}
                    onChange={(e) => handleFilterChange('experienceYears', e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                    <i className="fas fa-times me-1"></i>
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-muted mb-0">
              Showing {filteredArtists.length} of {artists.length} artists
            </p>
            {(searchTerm || Object.values(filters).some(f => f)) && (
              <Badge bg="secondary">
                Filters applied
              </Badge>
            )}
          </div>
        </Col>
      </Row>

      {/* Artists Grid */}
      {filteredArtists.length === 0 ? (
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No artists found</h4>
                <p className="text-muted">
                  Try adjusting your search criteria or clearing filters
                </p>
                <Button variant="outline-primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row>
          {filteredArtists.map(artist => (
            <Col key={artist.id} lg={4} md={6} className="mb-4">
              <ArtistCard 
                artist={artist} 
                onViewDetails={() => handleViewDetails(artist)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Artist Details Modal */}
      {selectedArtist && (
        <ArtistDetailsModal
          artist={selectedArtist}
          show={showDetailsModal}
          onHide={handleCloseModal}
        />
      )}
    </Container>
  );
};

export default BrowseArtists; 