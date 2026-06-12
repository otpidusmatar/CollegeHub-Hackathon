import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Navbar, Nav, Container, Button, Card, Row, Col, Badge, ListGroup, Alert, Form, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { favorites, removeFavorite, toggleApplied, getAppliedCount } = useFavorites();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Calculate application progress
  const appliedCount = getAppliedCount();
  const totalFavorites = favorites.length;
  // Prevent divide by zero error
  const applicationProgress = totalFavorites > 0 ? (appliedCount / totalFavorites) * 100 : 0;
  // Show red sliver if no colleges applied
  const showRedSliver = totalFavorites > 0 && appliedCount === 0;

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">CollegeHub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/dashboard" style={{ color: '#ffffff' }}>Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/matchmaker">Matchmaker</Nav.Link>
              <Nav.Link as={Link} to="/explore">Explore</Nav.Link>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={handleLogout}
                className="ms-2"
              >
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="mt-5">
        <div className="mb-4">
          <h1>Welcome to CollegeHub, {user?.name || 'User'}!</h1>
          <p className="text-muted">Email: {user?.email}</p>
        </div>
        
        <Row className="mt-4">
          <Col md={8}>
            <h3 className="mb-3">Quick Actions</h3>
            <Row>
              <Col md={6} className="mb-3">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>🎯 Matchmaker</Card.Title>
                    <Card.Text>Find your perfect college match by answering a few questions about your preferences.</Card.Text>
                    <Link to="/matchmaker" className="btn btn-primary btn-sm">Start Matchmaker</Link>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} className="mb-3">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>🔍 Explore Colleges</Card.Title>
                    <Card.Text>Browse and search through thousands of colleges with advanced filters.</Card.Text>
                    <Link to="/explore" className="btn btn-primary btn-sm">Explore Now</Link>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Favorites Section */}
            <div className="mt-4 pb-4">
              <h3 className="mb-3">
                ❤️ My Favorite Colleges
                <Badge bg="secondary" className="ms-2">{favorites.length}</Badge>
              </h3>
              
              {favorites.length === 0 ? (
                <Alert variant="info">
                  <Alert.Heading>No favorites yet!</Alert.Heading>
                  <p className="mb-0">
                    Start adding colleges to your favorites from the Matchmaker or Explore pages by clicking the heart icon on any college card.
                  </p>
                </Alert>
              ) : (
                <Card className="shadow-sm">
                  <ListGroup variant="flush">
                    {favorites.map((college) => (
                      <ListGroup.Item key={college.id} className="py-3">
                        <Row className="align-items-center">
                          <Col md={8}>
                            <div className="d-flex align-items-start mb-2">
                              <div className="flex-grow-1">
                                <h5 className="mb-2">
                                  {college['school.name']}
                                  {college.applied && (
                                    <Badge bg="success" className="ms-2">Applied ✓</Badge>
                                  )}
                                </h5>
                                <div className="text-muted small">
                                  <div>📍 {college['school.city']}, {college['school.state']}</div>
                                  <div>💰 In-State Tuition: {formatCurrency(college['latest.cost.tuition.in_state'])}</div>
                                  <div>👥 Students: {formatNumber(college['latest.student.size'])}</div>
                                  {college['latest.admissions.admission_rate.overall'] && (
                                    <div>
                                      📊 Acceptance Rate: {(college['latest.admissions.admission_rate.overall'] * 100).toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Col>
                          <Col md={4} className="text-end">
                            <div className="d-flex flex-column align-items-end gap-2">
                              {college['school.school_url'] && (
                                <a
                                  href={college['school.school_url'].startsWith('http')
                                    ? college['school.school_url']
                                    : `https://${college['school.school_url']}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Visit Website
                                </a>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeFavorite(college.id)}
                                title="Remove from favorites"
                              >
                                <i className="bi bi-trash"></i> Remove
                              </Button>
                              <div
                                onClick={() => toggleApplied(college.id)}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  border: '2px solid #28a745',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: college.applied ? '#28a745' : 'transparent',
                                  transition: 'all 0.2s ease',
                                }}
                                title={college.applied ? "Mark as not applied" : "Mark as applied"}
                              >
                                {college.applied && (
                                  <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>✓</span>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card>
              )}
            </div>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>📊 Your Stats</Card.Title>
                
                {/* Application Progress Gauge */}
                {totalFavorites > 0 && (
                  <div className="mt-3 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Application Progress</span>
                      <span className="text-muted small">
                        {appliedCount} of {totalFavorites} applied
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      {showRedSliver && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '5%',
                            height: '25px',
                            backgroundColor: '#dc3545',
                            borderRadius: '4px 0 0 4px',
                            zIndex: 3,
                          }}
                        />
                      )}
                      <ProgressBar
                        now={applicationProgress}
                        label={`${Math.round(applicationProgress)}%`}
                        variant={applicationProgress === 100 ? 'success' : applicationProgress >= 50 ? 'info' : 'warning'}
                        style={{ height: '25px', position: 'relative', zIndex: 2 }}
                      />
                    </div>
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        {applicationProgress === 100
                          ? '🎉 All applications complete!'
                          : applicationProgress >= 50
                          ? '👍 Great progress!'
                          : showRedSliver
                          ? '🚀 Start applying!'
                          : '📝 Keep going!'}
                      </small>
                    </div>
                  </div>
                )}
                
                <ListGroup variant="flush" className="mt-3">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Favorite Colleges</span>
                    <Badge bg="primary" pill>{favorites.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Account Status</span>
                    <Badge bg="success" pill>Active</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mt-3">
              <Card.Body>
                <Card.Title>💡 Quick Tips</Card.Title>
                <ul className="small mb-0">
                  <li>Use the Matchmaker to find colleges that fit your preferences</li>
                  <li>Save colleges to your favorites for easy access</li>
                  <li>Explore colleges with advanced search filters</li>
                  <li>Visit college websites to learn more</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

// Made with Bob
