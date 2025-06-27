import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, 
  Spinner, Alert, Badge, Modal
} from 'react-bootstrap';
import adminService from '../../services/adminService';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      setError(error.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value
      }
    }));
    
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await adminService.updateSystemSettings(pendingChanges);
      if (response.success) {
        setSuccess('Settings updated successfully!');
        setPendingChanges({});
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      setError(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  const renderSettingInput = (key, setting) => {
    const { value, type, description } = setting;

    switch (type) {
      case 'boolean':
        return (
          <Form.Check
            type="switch"
            checked={value}
            onChange={(e) => handleSettingChange(key, e.target.checked)}
            label={value ? 'Enabled' : 'Disabled'}
          />
        );
      
      case 'number':
        return (
          <Form.Control
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(key, parseFloat(e.target.value) || 0)}
            step="0.01"
          />
        );
      
      case 'json':
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(key, parsed);
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
          />
        );
      
      default: // string
        return (
          <Form.Control
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
          />
        );
    }
  };

  const getSettingDisplayName = (key) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const categorizeSettings = () => {
    const categories = {
      platform: ['platform_name', 'contact_email'],
      business: ['commission_rate', 'booking_auto_approval'],
      user: ['allow_public_registration', 'email_notifications'],
      files: ['max_file_upload_size', 'supported_file_types'],
      system: ['maintenance_mode'],
      legal: ['terms_of_service_url', 'privacy_policy_url']
    };

    const categorized = {};
    
    Object.keys(categories).forEach(category => {
      categorized[category] = {};
      categories[category].forEach(key => {
        if (settings[key]) {
          categorized[category][key] = settings[key];
        }
      });
    });

    // Add any uncategorized settings to 'other'
    const allCategorizedKeys = Object.values(categories).flat();
    const uncategorized = Object.keys(settings).filter(key => !allCategorizedKeys.includes(key));
    if (uncategorized.length > 0) {
      categorized.other = {};
      uncategorized.forEach(key => {
        categorized.other[key] = settings[key];
      });
    }

    return categorized;
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading system settings...</p>
      </Container>
    );
  }

  const categorizedSettings = categorizeSettings();

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6 fw-bold text-primary">
            <i className="fas fa-cog me-3"></i>
            System Settings
          </h1>
          <p className="lead text-muted">Configure platform settings and preferences</p>
        </Col>
        <Col xs="auto">
          {Object.keys(pendingChanges).length > 0 && (
            <Button 
              variant="success" 
              onClick={() => setShowConfirmModal(true)}
              disabled={saving}
            >
              {saving && <Spinner animation="border" size="sm" className="me-2" />}
              <i className="fas fa-save me-2"></i>
              Save Changes ({Object.keys(pendingChanges).length})
            </Button>
          )}
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Platform Settings */}
      {categorizedSettings.platform && Object.keys(categorizedSettings.platform).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-building me-2"></i>
              Platform Settings
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.platform).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Business Settings */}
      {categorizedSettings.business && Object.keys(categorizedSettings.business).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Business Settings
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.business).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* User Settings */}
      {categorizedSettings.user && Object.keys(categorizedSettings.user).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="fas fa-users me-2"></i>
              User Settings
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.user).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* File Settings */}
      {categorizedSettings.files && Object.keys(categorizedSettings.files).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">
              <i className="fas fa-file-upload me-2"></i>
              File & Upload Settings
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.files).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* System Settings */}
      {categorizedSettings.system && Object.keys(categorizedSettings.system).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">
              <i className="fas fa-server me-2"></i>
              System Control
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.system).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                      {key === 'maintenance_mode' && setting.value && (
                        <Badge bg="danger" className="ms-2">ACTIVE</Badge>
                      )}
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Legal Settings */}
      {categorizedSettings.legal && Object.keys(categorizedSettings.legal).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">
              <i className="fas fa-gavel me-2"></i>
              Legal & Compliance
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.legal).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Other Settings */}
      {categorizedSettings.other && Object.keys(categorizedSettings.other).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fas fa-ellipsis-h me-2"></i>
              Other Settings
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(categorizedSettings.other).map(([key, setting]) => (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      {getSettingDisplayName(key)}
                      <Badge bg="secondary" className="ms-2 text-capitalize">{setting.type}</Badge>
                    </Form.Label>
                    {renderSettingInput(key, setting)}
                    <Form.Text className="text-muted">{setting.description}</Form.Text>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Save Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Settings Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to update the following settings:</p>
          <ul>
            {Object.keys(pendingChanges).map(key => (
              <li key={key}>
                <strong>{getSettingDisplayName(key)}</strong>: {
                  typeof pendingChanges[key] === 'boolean' 
                    ? (pendingChanges[key] ? 'Enabled' : 'Disabled')
                    : typeof pendingChanges[key] === 'object'
                    ? JSON.stringify(pendingChanges[key])
                    : pendingChanges[key]
                }
              </li>
            ))}
          </ul>
          <Alert variant="warning" className="mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            These changes will affect the entire platform. Please confirm you want to proceed.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveSettings} disabled={saving}>
            {saving && <Spinner animation="border" size="sm" className="me-2" />}
            Confirm Update
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SystemSettings; 