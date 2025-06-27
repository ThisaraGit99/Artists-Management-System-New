import React from 'react';
import { Card } from 'react-bootstrap';
import { FaStar, FaUser, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';

const StarDisplay = ({ rating }) => {
    return (
        <div className="d-inline-flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                    key={star}
                    color={star <= rating ? "#ffc107" : "#e4e5e9"}
                    size={20}
                />
            ))}
        </div>
    );
};

const ArtistCard = ({ artist, onViewDetails }) => {
    return (
        <Card 
            className="artist-card mb-3 shadow-sm" 
            onClick={() => onViewDetails(artist)}
            style={{ cursor: 'pointer' }}
        >
            <Card.Body>
                <div className="d-flex">
                    <div className="artist-avatar me-3">
                        {artist.profile_image ? (
                            <img 
                                src={artist.profile_image} 
                                alt={artist.name}
                                className="rounded-circle"
                                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div 
                                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <FaUser size={24} color="white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow-1">
                        <h4 className="mb-2">{artist.name}</h4>
                        
                        {/* Genres */}
                        <div className="mb-2">
                            {artist.genres?.map((genre, index) => (
                                <span 
                                    key={index} 
                                    className="badge bg-primary me-1"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                        
                        {/* Rating */}
                        <div className="mb-2">
                            <StarDisplay rating={artist.rating || 0} />
                            <span className="text-muted ms-2">
                                ({artist.total_ratings || 0} reviews)
                            </span>
                        </div>

                        {/* Additional Info */}
                        <div className="text-muted">
                            {artist.location && (
                                <span className="me-3">
                                    <FaMapMarkerAlt className="me-1" />
                                    {artist.location}
                                </span>
                            )}
                            {artist.hourly_rate && (
                                <span>
                                    <FaDollarSign className="me-1" />
                                    {artist.hourly_rate}/hour
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ArtistCard; 