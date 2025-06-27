import React, { useState, useEffect } from 'react';
import { Card, Badge, Row, Col, Button, Pagination, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const StarDisplay = ({ rating, size = "1rem", showText = true }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="d-flex align-items-center">
            <div className="star-display">
                {[...Array(fullStars)].map((_, i) => (
                    <span key={`full-${i}`} style={{ fontSize: size, color: '#ffc107' }}>★</span>
                ))}
                {hasHalfStar && (
                    <span style={{ fontSize: size, color: '#ffc107' }}>☆</span>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={`empty-${i}`} style={{ fontSize: size, color: '#dee2e6' }}>☆</span>
                ))}
            </div>
            {showText && (
                <span className="ms-2 text-muted">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
};

const RatingProgressBar = ({ label, count, total, percentage }) => (
    <div className="d-flex align-items-center mb-2">
        <div className="me-2" style={{ width: '60px', fontSize: '0.9rem' }}>
            {label}
        </div>
        <div className="flex-grow-1 me-2">
            <div className="progress" style={{ height: '8px' }}>
                <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
        <div style={{ width: '40px', fontSize: '0.9rem' }}>
            {count}
        </div>
    </div>
);

const ReviewCard = ({ review, onVote }) => {
    const [voting, setVoting] = useState(false);

    const handleVote = async (voteType) => {
        setVoting(true);
        try {
            await onVote(review.id, voteType);
        } catch (error) {
            console.error('Vote failed:', error);
        } finally {
            setVoting(false);
        }
    };

    return (
        <Card className="mb-3">
                <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 className="mb-1">{review.review_title}</h6>
                        <div className="d-flex align-items-center mb-2">
                            <StarDisplay rating={review.overall_rating} />
                            {review.would_recommend && (
                                <Badge bg="success" className="ms-2">Recommended</Badge>
                            )}
                            {review.is_featured && (
                                <Badge bg="primary" className="ms-2">Featured</Badge>
                            )}
                        </div>
                    </div>
                    <small className="text-muted">
                        {new Date(review.created_at).toLocaleDateString()}
                    </small>
                </div>

                <p className="mb-3">{review.review_text}</p>

                {/* Detailed Ratings */}
                <Row className="mb-3">
                    {review.communication_rating && (
                        <Col sm={6} md={3}>
                            <small className="text-muted d-block">Communication</small>
                            <StarDisplay rating={review.communication_rating} size="0.9rem" showText={false} />
                        </Col>
                    )}
                    {review.professionalism_rating && (
                        <Col sm={6} md={3}>
                            <small className="text-muted d-block">Professionalism</small>
                            <StarDisplay rating={review.professionalism_rating} size="0.9rem" showText={false} />
                        </Col>
                    )}
                    {review.punctuality_rating && (
                        <Col sm={6} md={3}>
                            <small className="text-muted d-block">Punctuality</small>
                            <StarDisplay rating={review.punctuality_rating} size="0.9rem" showText={false} />
                        </Col>
                    )}
                    {review.quality_rating && (
                        <Col sm={6} md={3}>
                            <small className="text-muted d-block">Quality</small>
                            <StarDisplay rating={review.quality_rating} size="0.9rem" showText={false} />
                        </Col>
                    )}
                    </Row>

                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted">
                            By {review.organizer_name} • {review.event_name}
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleVote('helpful')}
                            disabled={voting}
                        >
                            👍 {review.helpful_votes || 0}
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleVote('unhelpful')}
                            disabled={voting}
                        >
                            👎 {review.unhelpful_votes || 0}
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

const RatingsDisplay = ({ artistId, showHeader = true }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 5;

    useEffect(() => {
        if (artistId) {
            loadRatings();
        }
    }, [artistId]);

    const loadRatings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/artists/ratings/${artistId}`);
            
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError('Failed to load ratings');
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            setError(error.response?.data?.message || 'Failed to load ratings');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (reviewId, voteType) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/reviews/${reviewId}/vote`, {
                vote_type: voteType
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Refresh ratings to get updated vote counts
            loadRatings();
        } catch (error) {
            console.error('Vote failed:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading ratings...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!data || !data.artist) {
        return <Alert variant="info">No rating data available</Alert>;
    }

    const { artist, reviews, rating_distribution } = data;
    const totalReviews = artist.total_reviews || 0;

    // Pagination
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    return (
        <div>
            {showHeader && (
                <Card className="mb-4">
                                <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h5 className="mb-3">Overall Rating</h5>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-4">
                                        <div className="display-4 fw-bold text-warning">
                                            {artist.average_rating ? artist.average_rating.toFixed(1) : '0.0'}
                                        </div>
                                        <StarDisplay rating={artist.average_rating || 0} size="1.2rem" showText={false} />
                                        <div className="text-muted">
                                            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                                    </div>
                                    </div>
                                </div>
                            </Col>
                            
                            {rating_distribution && totalReviews > 0 && (
                                <Col md={6}>
                                    <h6 className="mb-3">Rating Distribution</h6>
                                    <RatingProgressBar 
                                        label="5 stars" 
                                        count={rating_distribution.five_star || 0}
                                        total={totalReviews}
                                        percentage={totalReviews > 0 ? ((rating_distribution.five_star || 0) / totalReviews) * 100 : 0}
                                    />
                                    <RatingProgressBar 
                                        label="4 stars" 
                                        count={rating_distribution.four_star || 0}
                                        total={totalReviews}
                                        percentage={totalReviews > 0 ? ((rating_distribution.four_star || 0) / totalReviews) * 100 : 0}
                                    />
                                    <RatingProgressBar 
                                        label="3 stars" 
                                        count={rating_distribution.three_star || 0}
                                        total={totalReviews}
                                        percentage={totalReviews > 0 ? ((rating_distribution.three_star || 0) / totalReviews) * 100 : 0}
                                    />
                                    <RatingProgressBar 
                                        label="2 stars" 
                                        count={rating_distribution.two_star || 0}
                                        total={totalReviews}
                                        percentage={totalReviews > 0 ? ((rating_distribution.two_star || 0) / totalReviews) * 100 : 0}
                                    />
                                    <RatingProgressBar 
                                        label="1 star" 
                                        count={rating_distribution.one_star || 0}
                                        total={totalReviews}
                                        percentage={totalReviews > 0 ? ((rating_distribution.one_star || 0) / totalReviews) * 100 : 0}
                                    />
                                </Col>
                            )}
                        </Row>
                                </Card.Body>
                            </Card>
            )}

            <div>
                <h5 className="mb-3">
                    Reviews ({reviews.length})
                    {totalPages > 1 && (
                        <small className="text-muted ms-2">
                            Page {currentPage} of {totalPages}
                        </small>
                    )}
                </h5>

                {reviews.length === 0 ? (
                    <Alert variant="info">No reviews available yet.</Alert>
                ) : (
                    <>
                        {currentReviews.map((review) => (
                            <ReviewCard 
                                key={review.id} 
                                review={review} 
                                onVote={handleVote}
                            />
                        ))}

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.First 
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    />
                                    <Pagination.Prev 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    />
                                    
                                    {[...Array(totalPages)].map((_, index) => (
                                        <Pagination.Item
                                            key={index + 1}
                                            active={index + 1 === currentPage}
                                            onClick={() => setCurrentPage(index + 1)}
                                        >
                                            {index + 1}
                                        </Pagination.Item>
                                    ))}
                                    
                                    <Pagination.Next 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    />
                                    <Pagination.Last 
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
                    </div>
        </div>
    );
};

export default RatingsDisplay; 