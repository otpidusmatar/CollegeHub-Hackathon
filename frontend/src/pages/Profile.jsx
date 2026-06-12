import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup, Tabs, Tab, ProgressBar, Alert, Modal } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import ProfileDropdown from '../components/ProfileDropdown';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    addCourse,
    removeCourse,
    addItem,
    removeItem,
    clearProfile,
    clearSection,
    getProfileCompleteness
  } = useProfile();

  const [activeTab, setActiveTab] = useState('academic');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearSectionModal, setShowClearSectionModal] = useState(false);
  const [sectionToClear, setSectionToClear] = useState(null);

  // Form states for adding new items
  const [newCourse, setNewCourse] = useState({ name: '', grade: '', year: '' });
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '' });
  const [newActivity, setNewActivity] = useState({ name: '', role: '', description: '', years: '' });

  const handleSaveBasicInfo = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddCourse = (type) => {
    if (newCourse.name.trim()) {
      addCourse(type, newCourse);
      setNewCourse({ name: '', grade: '', year: '' });
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.title.trim()) {
      addItem('achievements', newAchievement);
      setNewAchievement({ title: '', description: '', date: '' });
    }
  };

  const handleAddActivity = (type) => {
    if (newActivity.name.trim()) {
      addItem(type, newActivity);
      setNewActivity({ name: '', role: '', description: '', years: '' });
    }
  };

  const handleClearAll = () => {
    clearProfile();
    setShowClearModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClearSectionClick = (section) => {
    setSectionToClear(section);
    setShowClearSectionModal(true);
  };

  const handleClearSectionConfirm = () => {
    clearSection(sectionToClear);
    setShowClearSectionModal(false);
    setSectionToClear(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getSectionName = (section) => {
    const names = {
      academic: 'Academic Information',
      courses: 'All Courses',
      achievements: 'Achievements',
      activities: 'All Activities'
    };
    return names[section] || section;
  };

  const completeness = getProfileCompleteness();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">CollegeHub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/matchmaker">Matchmaker</Nav.Link>
              <Nav.Link as={Link} to="/explore">Explore</Nav.Link>
              <Nav.Link as={Link} to="/analyzer">Analysis</Nav.Link>
              <div className="ms-2">
                <ProfileDropdown />
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4 mb-5">
        <Row>
          <Col lg={3}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="text-center mb-3">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#007bff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    margin: '0 auto'
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <h5 className="mt-3 mb-1">{user?.name || 'User'}</h5>
                  <p className="text-muted small mb-0">{user?.email}</p>
                </div>
                
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold">Profile Completeness</span>
                    <span className="small text-muted">{completeness}%</span>
                  </div>
                  <ProgressBar 
                    now={completeness} 
                    variant={completeness === 100 ? 'success' : completeness >= 50 ? 'info' : 'warning'}
                    style={{ height: '8px' }}
                  />
                  <p className="text-muted small mt-2 mb-0">
                    {completeness === 100 
                      ? '🎉 Profile complete!' 
                      : completeness >= 50 
                      ? '👍 Almost there!' 
                      : '📝 Keep building your profile'}
                  </p>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="mb-3">Quick Stats</h6>
                <ListGroup variant="flush" className="small">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>AP Courses</span>
                    <Badge bg="primary">{profile.apCourses.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Honors Courses</span>
                    <Badge bg="primary">{profile.honorsCourses.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Achievements</span>
                    <Badge bg="success">{profile.achievements.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Activities</span>
                    <Badge bg="info">{profile.extracurriculars.length + profile.leadership.length + profile.volunteering.length}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">📚 Academic Portfolio</h2>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowClearModal(true)}
              >
                🗑️ Clear All Sections
              </Button>
            </div>
            
            {showSuccess && (
              <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
                Profile updated successfully!
              </Alert>
            )}

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              {/* Academic Info Tab */}
              <Tab eventKey="academic" title="📊 Academic Info">
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Academic Information</h5>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleClearSectionClick('academic')}
                      >
                        🗑️ Clear Section
                      </Button>
                    </div>
                    <Form onSubmit={handleSaveBasicInfo}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>GPA</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              placeholder="3.85"
                              value={profile.gpa}
                              onChange={(e) => updateProfile({ gpa: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>GPA Scale</Form.Label>
                            <Form.Select
                              value={profile.gpaScale}
                              onChange={(e) => updateProfile({ gpaScale: e.target.value })}
                            >
                              <option value="4.0">4.0</option>
                              <option value="5.0">5.0 (Weighted)</option>
                              <option value="100">100 Point Scale</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Class Rank</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="15"
                              value={profile.classRank}
                              onChange={(e) => updateProfile({ classRank: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Class Size</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="350"
                              value={profile.classSize}
                              onChange={(e) => updateProfile({ classSize: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <h5 className="mt-4 mb-3">Test Scores</h5>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>SAT Total</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="1450"
                              value={profile.satScore}
                              onChange={(e) => updateProfile({ satScore: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>SAT Math</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="750"
                              value={profile.satMath}
                              onChange={(e) => updateProfile({ satMath: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>SAT Reading</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="700"
                              value={profile.satReading}
                              onChange={(e) => updateProfile({ satReading: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>ACT Composite</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="32"
                              value={profile.actScore}
                              onChange={(e) => updateProfile({ actScore: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Intended Major</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Computer Science"
                              value={profile.intendedMajor}
                              onChange={(e) => updateProfile({ intendedMajor: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button type="submit" variant="primary">Save Academic Info</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Courses Tab */}
              <Tab eventKey="courses" title="📖 Courses">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Course History</h5>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleClearSectionClick('courses')}
                  >
                    🗑️ Clear All Courses
                  </Button>
                </div>
                <Card className="shadow-sm mb-3">
                  <Card.Body>
                    <h5>AP Courses</h5>
                    <Row className="mb-3">
                      <Col md={5}>
                        <Form.Control
                          placeholder="Course name"
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Grade (A, B, etc.)"
                          value={newCourse.grade}
                          onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Year"
                          value={newCourse.year}
                          onChange={(e) => setNewCourse({ ...newCourse, year: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddCourse('apCourses')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.apCourses.map((course) => (
                        <ListGroup.Item key={course.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{course.name}</strong>
                            {course.grade && <Badge bg="success" className="ms-2">{course.grade}</Badge>}
                            {course.year && <span className="text-muted ms-2">({course.year})</span>}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeCourse('apCourses', course.id)}
                          >
                            Remove
                          </Button>
                        </ListGroup.Item>
                      ))}
                      {profile.apCourses.length === 0 && (
                        <ListGroup.Item className="text-muted">No AP courses added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm mb-3">
                  <Card.Body>
                    <h5>Honors Courses</h5>
                    <Row className="mb-3">
                      <Col md={5}>
                        <Form.Control
                          placeholder="Course name"
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Grade"
                          value={newCourse.grade}
                          onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Year"
                          value={newCourse.year}
                          onChange={(e) => setNewCourse({ ...newCourse, year: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddCourse('honorsCourses')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.honorsCourses.map((course) => (
                        <ListGroup.Item key={course.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{course.name}</strong>
                            {course.grade && <Badge bg="success" className="ms-2">{course.grade}</Badge>}
                            {course.year && <span className="text-muted ms-2">({course.year})</span>}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeCourse('honorsCourses', course.id)}
                          >
                            Remove
                          </Button>
                        </ListGroup.Item>
                      ))}
                      {profile.honorsCourses.length === 0 && (
                        <ListGroup.Item className="text-muted">No honors courses added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm">
                  <Card.Body>
                    <h5>IB Courses</h5>
                    <Row className="mb-3">
                      <Col md={5}>
                        <Form.Control
                          placeholder="Course name"
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Grade"
                          value={newCourse.grade}
                          onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Year"
                          value={newCourse.year}
                          onChange={(e) => setNewCourse({ ...newCourse, year: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddCourse('ibCourses')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.ibCourses.map((course) => (
                        <ListGroup.Item key={course.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{course.name}</strong>
                            {course.grade && <Badge bg="success" className="ms-2">{course.grade}</Badge>}
                            {course.year && <span className="text-muted ms-2">({course.year})</span>}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeCourse('ibCourses', course.id)}
                          >
                            Remove
                          </Button>
                        </ListGroup.Item>
                      ))}
                      {profile.ibCourses.length === 0 && (
                        <ListGroup.Item className="text-muted">No IB courses added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Achievements Tab */}
              <Tab eventKey="achievements" title="🏆 Achievements">
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Honors & Achievements</h5>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleClearSectionClick('achievements')}
                      >
                        🗑️ Clear Section
                      </Button>
                    </div>
                    <Row className="mb-3">
                      <Col md={4}>
                        <Form.Control
                          placeholder="Achievement title"
                          value={newAchievement.title}
                          onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          placeholder="Description"
                          value={newAchievement.description}
                          onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Date"
                          value={newAchievement.date}
                          onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={handleAddAchievement} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.achievements.map((achievement) => (
                        <ListGroup.Item key={achievement.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{achievement.title}</h6>
                              {achievement.description && <p className="mb-1 text-muted small">{achievement.description}</p>}
                              {achievement.date && <small className="text-muted">{achievement.date}</small>}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeItem('achievements', achievement.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {profile.achievements.length === 0 && (
                        <ListGroup.Item className="text-muted">No achievements added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Activities Tab */}
              <Tab eventKey="activities" title="🎭 Activities">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Activities & Leadership</h5>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleClearSectionClick('activities')}
                  >
                    🗑️ Clear All Activities
                  </Button>
                </div>
                <Card className="shadow-sm mb-3">
                  <Card.Body>
                    <h5>Extracurricular Activities</h5>
                    <Row className="mb-3">
                      <Col md={3}>
                        <Form.Control
                          placeholder="Activity name"
                          value={newActivity.name}
                          onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Role"
                          value={newActivity.role}
                          onChange={(e) => setNewActivity({ ...newActivity, role: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Description"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        />
                      </Col>
                      <Col md={1}>
                        <Form.Control
                          placeholder="Years"
                          value={newActivity.years}
                          onChange={(e) => setNewActivity({ ...newActivity, years: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddActivity('extracurriculars')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.extracurriculars.map((activity) => (
                        <ListGroup.Item key={activity.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{activity.name}</h6>
                              {activity.role && <Badge bg="info" className="me-2">{activity.role}</Badge>}
                              {activity.years && <Badge bg="secondary">{activity.years} years</Badge>}
                              {activity.description && <p className="mb-0 mt-2 text-muted small">{activity.description}</p>}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeItem('extracurriculars', activity.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {profile.extracurriculars.length === 0 && (
                        <ListGroup.Item className="text-muted">No activities added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm mb-3">
                  <Card.Body>
                    <h5>Leadership Positions</h5>
                    <Row className="mb-3">
                      <Col md={3}>
                        <Form.Control
                          placeholder="Organization"
                          value={newActivity.name}
                          onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Position"
                          value={newActivity.role}
                          onChange={(e) => setNewActivity({ ...newActivity, role: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Description"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        />
                      </Col>
                      <Col md={1}>
                        <Form.Control
                          placeholder="Years"
                          value={newActivity.years}
                          onChange={(e) => setNewActivity({ ...newActivity, years: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddActivity('leadership')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.leadership.map((activity) => (
                        <ListGroup.Item key={activity.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{activity.name}</h6>
                              {activity.role && <Badge bg="warning" className="me-2">{activity.role}</Badge>}
                              {activity.years && <Badge bg="secondary">{activity.years} years</Badge>}
                              {activity.description && <p className="mb-0 mt-2 text-muted small">{activity.description}</p>}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeItem('leadership', activity.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {profile.leadership.length === 0 && (
                        <ListGroup.Item className="text-muted">No leadership positions added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm">
                  <Card.Body>
                    <h5>Volunteering & Community Service</h5>
                    <Row className="mb-3">
                      <Col md={3}>
                        <Form.Control
                          placeholder="Organization"
                          value={newActivity.name}
                          onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Role"
                          value={newActivity.role}
                          onChange={(e) => setNewActivity({ ...newActivity, role: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Description"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        />
                      </Col>
                      <Col md={1}>
                        <Form.Control
                          placeholder="Hours"
                          value={newActivity.years}
                          onChange={(e) => setNewActivity({ ...newActivity, years: e.target.value })}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="primary" onClick={() => handleAddActivity('volunteering')} className="w-100">
                          Add
                        </Button>
                      </Col>
                    </Row>
                    <ListGroup>
                      {profile.volunteering.map((activity) => (
                        <ListGroup.Item key={activity.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{activity.name}</h6>
                              {activity.role && <Badge bg="success" className="me-2">{activity.role}</Badge>}
                              {activity.years && <Badge bg="secondary">{activity.years} hours</Badge>}
                              {activity.description && <p className="mb-0 mt-2 text-muted small">{activity.description}</p>}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeItem('volunteering', activity.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {profile.volunteering.length === 0 && (
                        <ListGroup.Item className="text-muted">No volunteering added yet</ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      {/* Clear All Confirmation Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Clear All Profile Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Are you sure you want to clear <strong>all sections</strong> of your profile? This will permanently delete:
          </p>
          <ul className="mb-3">
            <li>All academic information (GPA, test scores, class rank)</li>
            <li>All courses (AP, Honors, IB)</li>
            <li>All achievements and honors</li>
            <li>All extracurricular activities</li>
            <li>All leadership positions</li>
            <li>All volunteering records</li>
            <li>Intended major and other details</li>
          </ul>
          <Alert variant="warning" className="mb-0">
            <strong>Warning:</strong> This action cannot be undone!
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAll}>
            Yes, Clear Everything
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Clear Section Confirmation Modal */}
      <Modal show={showClearSectionModal} onHide={() => setShowClearSectionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Clear {getSectionName(sectionToClear)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Are you sure you want to clear the <strong>{getSectionName(sectionToClear)}</strong> section?
          </p>
          {sectionToClear === 'academic' && (
            <p className="text-muted small">
              This will clear: GPA, class rank, test scores (SAT/ACT), and intended major.
            </p>
          )}
          {sectionToClear === 'courses' && (
            <p className="text-muted small">
              This will clear all AP, Honors, and IB courses.
            </p>
          )}
          {sectionToClear === 'achievements' && (
            <p className="text-muted small">
              This will clear all honors and achievements.
            </p>
          )}
          {sectionToClear === 'activities' && (
            <p className="text-muted small">
              This will clear all extracurricular activities, leadership positions, and volunteering records.
            </p>
          )}
          <Alert variant="warning" className="mb-0">
            <strong>Warning:</strong> This action cannot be undone!
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearSectionModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearSectionConfirm}>
            Yes, Clear Section
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// Made with Bob
