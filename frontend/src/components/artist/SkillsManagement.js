import React, { useState, useEffect } from 'react';
import { 
    Row, Col, Card, Button, Form, Modal, Badge, Alert, 
    Spinner, ListGroup, ProgressBar 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import artistService from '../../services/artistService';

const SkillsManagement = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [formData, setFormData] = useState({
        skill_name: '',
        proficiency_level: 'Intermediate',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const proficiencyColors = {
        'Beginner': 'info',
        'Intermediate': 'warning', 
        'Advanced': 'success',
        'Expert': 'danger'
    };

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            setLoading(true);
            const response = await artistService.getSkills();
            setSkills(response.data.data);
        } catch (error) {
            console.error('Load skills error:', error);
            toast.error('Failed to load skills');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (skill = null) => {
        if (skill) {
            setEditingSkill(skill);
            setFormData({
                skill_name: skill.skill_name,
                proficiency_level: skill.proficiency_level,
                description: skill.description || ''
            });
        } else {
            setEditingSkill(null);
            setFormData({
                skill_name: '',
                proficiency_level: 'Intermediate',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSkill(null);
        setFormData({
            skill_name: '',
            proficiency_level: 'Intermediate',
            description: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.skill_name.trim()) {
            toast.error('Skill name is required');
            return;
        }

        setSubmitting(true);
        try {
            await artistService.addSkill(formData);
            toast.success('Skill added successfully!');
            loadSkills();
            handleCloseModal();
        } catch (error) {
            console.error('Add skill error:', error);
            toast.error('Failed to add skill');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (skillId) => {
        if (!window.confirm('Are you sure you want to remove this skill?')) {
            return;
        }

        try {
            await artistService.removeSkill(skillId);
            toast.success('Skill removed successfully!');
            loadSkills();
        } catch (error) {
            console.error('Delete skill error:', error);
            toast.error('Failed to remove skill');
        }
    };

    const getProficiencyProgress = (level) => {
        const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        return ((levels.indexOf(level) + 1) / levels.length) * 100;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading skills...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">Skills & Expertise</h4>
                    <p className="text-muted mb-0">
                        Showcase your musical abilities and technical skills
                    </p>
                </div>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    <i className="fas fa-plus me-2"></i>
                    Add Skill
                </Button>
            </div>

            {skills.length === 0 ? (
                <Alert variant="info" className="text-center py-4">
                    <i className="fas fa-star fa-3x mb-3 text-muted"></i>
                    <h5>No Skills Added Yet</h5>
                    <p className="mb-3">
                        Start building your professional profile by adding your musical skills and expertise.
                    </p>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        <i className="fas fa-plus me-2"></i>
                        Add Your First Skill
                    </Button>
                </Alert>
            ) : (
                <Row>
                    {skills.map((skill) => (
                        <Col md={6} lg={4} key={skill.id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-1">{skill.skill_name}</h5>
                                        <div className="dropdown">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="border-0"
                                                onClick={() => handleDelete(skill.id)}
                                            >
                                                <i className="fas fa-trash text-danger"></i>
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small text-muted">Proficiency</span>
                                            <Badge bg={proficiencyColors[skill.proficiency_level]}>
                                                {skill.proficiency_level}
                                            </Badge>
                                        </div>
                                        <ProgressBar 
                                            now={getProficiencyProgress(skill.proficiency_level)}
                                            variant={proficiencyColors[skill.proficiency_level]}
                                            style={{ height: '6px' }}
                                        />
                                    </div>
                                    
                                    {skill.description && (
                                        <p className="text-muted small mb-0">
                                            {skill.description}
                                        </p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add/Edit Skill Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-star me-2"></i>
                        {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                    </Modal.Title>
                </Modal.Header>
                
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Skill Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="skill_name"
                                        value={formData.skill_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Guitar, Vocals, Music Production..."
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Proficiency Level</Form.Label>
                                    <Form.Select
                                        name="proficiency_level"
                                        value={formData.proficiency_level}
                                        onChange={handleInputChange}
                                    >
                                        {proficiencyLevels.map(level => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe your experience with this skill, any certifications, notable achievements..."
                            />
                        </Form.Group>

                        <Alert variant="light" className="border">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-lightbulb text-warning me-2"></i>
                                <small>
                                    <strong>Tip:</strong> Be specific about your skills to help event organizers 
                                    find the perfect match for their needs.
                                </small>
                            </div>
                        </Alert>
                    </Modal.Body>
                    
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    {editingSkill ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    {editingSkill ? 'Update Skill' : 'Add Skill'}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default SkillsManagement; 