// Application management functions to be added to EventManagement component

// Application management functions
const loadApplications = async (event) => {
  try {
    setLoadingApplications(true);
    setSelectedEvent(event);
    const response = await eventApplicationService.getEventApplications(event.id, applicationFilter);
    setApplications(response.data.applications || []);
    setShowApplicationsModal(true);
  } catch (err) {
    setError(err.message || 'Failed to load applications');
  } finally {
    setLoadingApplications(false);
  }
};

const handleApproveApplication = async (applicationId) => {
  try {
    await eventApplicationService.approveApplication(selectedEvent.id, applicationId, 'Application approved - looking forward to working with you!');
    loadApplications(selectedEvent); // Reload applications
    loadEvents(); // Refresh event stats
  } catch (err) {
    setError(err.message || 'Failed to approve application');
  }
};

const handleRejectApplication = async (applicationId) => {
  try {
    await eventApplicationService.rejectApplication(selectedEvent.id, applicationId, 'Thank you for your application. We have decided to go with another artist for this event.');
    loadApplications(selectedEvent); // Reload applications
    loadEvents(); // Refresh event stats
  } catch (err) {
    setError(err.message || 'Failed to reject application');
  }
};

const getApplicationStatusBadge = (status) => {
  const variants = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return variants[status] || 'secondary';
};

// Replace the alert with real functionality:
// CHANGE THIS:
onClick={() => {
  setSelectedEvent(event);
  alert(`View Applications for "${event.title}"...`);
}}

// TO THIS:
onClick={() => loadApplications(event)}

// Applications Modal JSX:
{/* Applications Management Modal */}
<Modal 
  show={showApplicationsModal} 
  onHide={() => setShowApplicationsModal(false)}
  size="xl"
>
  <Modal.Header closeButton>
    <Modal.Title>
      <i className="fas fa-users me-2"></i>
      Applications for "{selectedEvent?.title}"
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {loadingApplications ? (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading applications...</p>
      </div>
    ) : applications.length === 0 ? (
      <div className="text-center py-5">
        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
        <h5 className="text-muted">No Applications Yet</h5>
        <p className="text-muted">
          No artists have applied to this event yet. Applications will appear here when artists submit them.
        </p>
      </div>
    ) : (
      <div>
        {/* Filter buttons */}
        <div className="mb-3">
          <Button
            variant={applicationFilter === 'all' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setApplicationFilter('all')}
            className="me-2"
          >
            All ({applications.length})
          </Button>
          <Button
            variant={applicationFilter === 'pending' ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={() => setApplicationFilter('pending')}
            className="me-2"
          >
            Pending ({applications.filter(app => app.application_status === 'pending').length})
          </Button>
          <Button
            variant={applicationFilter === 'approved' ? 'success' : 'outline-success'}
            size="sm"
            onClick={() => setApplicationFilter('approved')}
            className="me-2"
          >
            Approved ({applications.filter(app => app.application_status === 'approved').length})
          </Button>
          <Button
            variant={applicationFilter === 'rejected' ? 'danger' : 'outline-danger'}
            size="sm"
            onClick={() => setApplicationFilter('rejected')}
          >
            Rejected ({applications.filter(app => app.application_status === 'rejected').length})
          </Button>
        </div>

        {/* Applications list */}
        <div className="row">
          {applications
            .filter(app => applicationFilter === 'all' || app.application_status === applicationFilter)
            .map((application) => (
            <div key={application.id} className="col-12 mb-3">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-2">
                        <h6 className="mb-0 me-3">{application.artist_name}</h6>
                        <Badge bg={getApplicationStatusBadge(application.application_status)}>
                          {application.application_status.toUpperCase()}
                        </Badge>
                        {application.is_verified && (
                          <Badge bg="info" className="ms-2">VERIFIED</Badge>
                        )}
                      </div>
                      <div className="text-muted small mb-2">
                        <i className="fas fa-envelope me-1"></i>
                        {application.artist_email}
                        {application.artist_phone && (
                          <span className="ms-3">
                            <i className="fas fa-phone me-1"></i>
                            {application.artist_phone}
                          </span>
                        )}
                      </div>
                      <div className="text-muted small mb-2">
                        <i className="fas fa-music me-1"></i>
                        {application.genre}
                        {application.location && (
                          <span className="ms-3">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {application.location}
                          </span>
                        )}
                      </div>
                      <div className="text-muted small mb-2">
                        <i className="fas fa-star me-1"></i>
                        {application.rating ? `${application.rating}/5 (${application.total_ratings} reviews)` : 'No ratings yet'}
                        <span className="ms-3">
                          <i className="fas fa-calendar me-1"></i>
                          {application.experience_years} years experience
                        </span>
                      </div>
                      {application.message && (
                        <div className="mt-2">
                          <small className="text-muted">Artist Message:</small>
                          <p className="mt-1 mb-0 small">{application.message}</p>
                        </div>
                      )}
                      {application.organizer_response && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small className="text-muted">Your Response:</small>
                          <p className="mt-1 mb-0 small">{application.organizer_response}</p>
                        </div>
                      )}
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="mb-2">
                        <h5 className="mb-0 text-success">
                          <i className="fas fa-dollar-sign"></i>
                          {application.proposed_budget.toLocaleString()}
                        </h5>
                        <small className="text-muted">Proposed Budget</small>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted">
                          Applied: {new Date(application.applied_at).toLocaleDateString()}
                        </small>
                      </div>
                      {application.application_status === 'pending' && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveApplication(application.id)}
                          >
                            <i className="fas fa-check me-1"></i>
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectApplication(application.id)}
                          >
                            <i className="fas fa-times me-1"></i>
                            Reject
                          </Button>
                        </div>
                      )}
                      {application.application_status === 'approved' && (
                        <Badge bg="success" className="px-3 py-2">
                          <i className="fas fa-check me-1"></i>
                          Approved
                        </Badge>
                      )}
                      {application.application_status === 'rejected' && (
                        <Badge bg="danger" className="px-3 py-2">
                          <i className="fas fa-times me-1"></i>
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowApplicationsModal(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal> 