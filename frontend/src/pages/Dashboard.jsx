import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Navbar, Nav, Container, Button, Card, Row, Col, Badge, ListGroup, Alert, Form, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProfile } from '../context/ProfileContext';
import ProfileDropdown from '../components/ProfileDropdown';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, removeFavorite, toggleApplied, getAppliedCount } = useFavorites();
  const { getProfileCompleteness } = useProfile();
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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

  // Sort favorites based on selected criteria
  const getSortedFavorites = () => {
    if (!favorites || favorites.length === 0) return [];
    
    const sorted = [...favorites].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a['school.name'] || '';
          bValue = b['school.name'] || '';
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'price':
          aValue = a['latest.cost.tuition.in_state'] || 0;
          bValue = b['latest.cost.tuition.in_state'] || 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        
        case 'acceptance':
          aValue = a['latest.admissions.admission_rate.overall'] || 0;
          bValue = b['latest.admissions.admission_rate.overall'] || 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        
        case 'size':
          aValue = a['latest.student.size'] || 0;
          bValue = b['latest.student.size'] || 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        
        case 'location':
          aValue = `${a['school.state'] || ''} ${a['school.city'] || ''}`;
          bValue = `${b['school.state'] || ''} ${b['school.city'] || ''}`;
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'timeAdded':
          // Assuming favorites are stored in order added (newer at end)
          // We'll use the array index as a proxy for time added
          aValue = favorites.indexOf(a);
          bValue = favorites.indexOf(b);
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const displayedFavorites = getSortedFavorites();
  const profileCompleteness = getProfileCompleteness();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">CollegeHub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/dashboard" style={{ color: '#ffffff' }}>Dashboard</Nav.Link>
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">
                  ❤️ My Favorite Colleges
                  <Badge bg="secondary" className="ms-2">{favorites.length}</Badge>
                </h3>
              </div>
              
              {/* Sorting Controls - Always Available */}
              {favorites.length > 0 && (
                <Card className="shadow-sm mb-3 bg-light">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold mb-1">Sort By</Form.Label>
                          <Form.Select
                            size="sm"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="name">College Name</option>
                            <option value="price">Tuition Price</option>
                            <option value="acceptance">Acceptance Rate</option>
                            <option value="size">Class Size</option>
                            <option value="location">Location</option>
                            <option value="timeAdded">Time Added</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold mb-1">Order</Form.Label>
                          <Form.Select
                            size="sm"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                          >
                            <option value="asc">
                              {sortBy === 'name' || sortBy === 'location' ? 'A to Z' : sortBy === 'timeAdded' ? 'Oldest First' : 'Low to High'}
                            </option>
                            <option value="desc">
                              {sortBy === 'name' || sortBy === 'location' ? 'Z to A' : sortBy === 'timeAdded' ? 'Newest First' : 'High to Low'}
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
              
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
                    {displayedFavorites.map((college) => (
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

          <Col md={4} className="mb-5 pb-4">
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
                <Card.Title>🎓 Personal Analytics</Card.Title>
                <Card.Text className="small text-muted">
                  Build your academic portfolio and evaluate your competitiveness at your favorite colleges with AI-powered analysis.
                </Card.Text>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold">Profile Completeness</span>
                    <span className="small text-muted">{profileCompleteness}%</span>
                  </div>
                  <ProgressBar
                    now={profileCompleteness}
                    variant={profileCompleteness === 100 ? 'success' : profileCompleteness >= 50 ? 'info' : 'warning'}
                    style={{ height: '8px' }}
                  />
                </div>

                <div className="d-grid gap-2">
                  <Link to="/profile" className="btn btn-outline-primary btn-sm">
                    📚 Build Portfolio
                  </Link>
                  <Link
                    to="/analyzer"
                    className="btn btn-primary btn-sm"
                    style={{
                      opacity: profileCompleteness < 50 ? 0.6 : 1,
                      pointerEvents: profileCompleteness < 50 ? 'none' : 'auto'
                    }}
                  >
                    🎯 Analyze Competitiveness
                  </Link>
                </div>

                {profileCompleteness < 50 && (
                  <Alert variant="light" className="small mt-3 mb-0">
                    Complete at least 50% of your profile to use the competitiveness analyzer.
                  </Alert>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm mt-3">
              <Card.Body>
                <Card.Title>💡 Quick Tips</Card.Title>
                <ul className="small mb-0">
                  <li>Use the Matchmaker to find colleges that fit your preferences</li>
                  <li>Save colleges to your favorites for easy access</li>
                  <li>Build your academic portfolio to track achievements</li>
                  <li>Analyze your competitiveness with AI insights</li>
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
