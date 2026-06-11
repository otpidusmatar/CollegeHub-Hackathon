import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { 
  Navbar, 
  Nav, 
  Container, 
  Button, 
  Form, 
  Row, 
  Col, 
  Card, 
  Modal, 
  Spinner,
  Badge,
  InputGroup
} from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Explore() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // State management
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    minTuition: '',
    maxTuition: '',
    size: '',
    region: ''
  });
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // College Scorecard API configuration
  const API_KEY = 'uZqhM5FIsMThqsWvIviu2aL8AR2EC0Hpc214b6KN'; // Replace with actual API key
  const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

  // Fetch colleges from API
  const fetchColleges = async (isNewSearch = false) => {
    setLoading(true);
    try {
      const currentPage = isNewSearch ? 0 : page;
      
      // Build query parameters
      const params = new URLSearchParams({
        api_key: API_KEY,
        per_page: 20,
        page: currentPage,
        'fields': 'id,school.name,school.city,school.state,school.school_url,school.zip,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.student.size,latest.admissions.admission_rate.overall,latest.academics.program_percentage,school.locale,school.region_id'
      });

      // Add search term
      if (searchTerm) {
        params.append('school.name', searchTerm);
      }

      // Add filters
      if (filters.state) {
        params.append('school.state', filters.state);
      }
      if (filters.minTuition) {
        params.append('latest.cost.tuition.in_state__range', `${filters.minTuition}..`);
      }
      if (filters.maxTuition) {
        params.append('latest.cost.tuition.in_state__range', `..${filters.maxTuition}`);
      }
      if (filters.size) {
        params.append('latest.student.size__range', filters.size);
      }
      if (filters.region) {
        params.append('school.region_id', filters.region);
      }

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();

      if (data.results) {
        if (isNewSearch) {
          setColleges(data.results);
          setPage(1);
        } else {
          setColleges(prev => [...prev, ...data.results]);
          setPage(prev => prev + 1);
        }
        setHasMore(data.results.length === 20);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      alert('Failed to fetch colleges. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchColleges(true);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchColleges(true);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchColleges(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      state: '',
      minTuition: '',
      maxTuition: '',
      size: '',
      region: ''
    });
    setSearchTerm('');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Open college detail modal
  const openCollegeDetail = (college) => {
    setSelectedCollege(college);
    setShowModal(true);
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

  // Get region name
  const getRegionName = (regionId) => {
    const regions = {
      0: 'U.S. Service Schools',
      1: 'New England',
      2: 'Mid East',
      3: 'Great Lakes',
      4: 'Plains',
      5: 'Southeast',
      6: 'Southwest',
      7: 'Rocky Mountains',
      8: 'Far West',
      9: 'Outlying Areas'
    };
    return regions[regionId] || 'Unknown';
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">CollegeHub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
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
      
      <Container className="mt-4 mb-5">
        <h1 className="mb-4">Explore Colleges</h1>
        
        {/* Search Bar */}
        <Form onSubmit={handleSearch} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search colleges by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="primary" type="submit">
              Search
            </Button>
          </InputGroup>
        </Form>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Filters</h5>
            <Row>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    as="select"
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                  >
                    <option value="">All States</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    as="select"
                    name="region"
                    value={filters.region}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Regions</option>
                    <option value="1">New England</option>
                    <option value="2">Mid East</option>
                    <option value="3">Great Lakes</option>
                    <option value="4">Plains</option>
                    <option value="5">Southeast</option>
                    <option value="6">Southwest</option>
                    <option value="7">Rocky Mountains</option>
                    <option value="8">Far West</option>
                  </Form.Control>
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Max Tuition</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxTuition"
                    placeholder="$100,000"
                    value={filters.maxTuition}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>School Size</Form.Label>
                  <Form.Control
                    as="select"
                    name="size"
                    value={filters.size}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Sizes</option>
                    <option value="0..2000">Small {'(<'} 2,000)</option>
                    <option value="2000..10000">Medium (2,000-10,000)</option>
                    <option value="10000..">Large {'(>'} 10,000)</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Results Count */}
        <div className="mb-3">
          <p className="text-muted">
            {colleges.length > 0 ? `Showing ${colleges.length} colleges` : 'No colleges found'}
          </p>
        </div>

        {/* College Grid */}
        {loading && colleges.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <Row>
              {colleges.map((college, index) => (
                <Col key={`${college.id}-${index}`} md={6} lg={4} className="mb-4">
                  <Card
                    className="h-100 shadow-sm"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => openCollegeDetail(college)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Card.Title className="mb-0" style={{ minHeight: '60px', flex: 1 }}>
                          {college['school.name'] || 'Unknown College'}
                        </Card.Title>
                        <Button
                          variant={isFavorite(college.id) ? "danger" : "outline-danger"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(college);
                          }}
                          title={isFavorite(college.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <i className={`bi bi-heart${isFavorite(college.id) ? '-fill' : ''}`}></i>
                        </Button>
                      </div>
                      
                      <div className="mb-2">
                        <strong>📍 Location:</strong>
                        <br />
                        {college['school.city']}, {college['school.state']}
                      </div>
                      
                      <div className="mb-2">
                        <strong>💰 In-State Tuition:</strong>
                        <br />
                        {formatCurrency(college['latest.cost.tuition.in_state'])}
                      </div>
                      
                      <div className="mb-2">
                        <strong>💵 Out-of-State Tuition:</strong>
                        <br />
                        {formatCurrency(college['latest.cost.tuition.out_of_state'])}
                      </div>
                      
                      <div className="mb-2">
                        <strong>👥 Student Size:</strong>
                        <br />
                        {formatNumber(college['latest.student.size'])}
                      </div>
                      
                      {college['latest.admissions.admission_rate.overall'] && (
                        <div className="mt-3">
                          <Badge bg="info">
                            Acceptance Rate: {(college['latest.admissions.admission_rate.overall'] * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <small className="text-muted">Click for more details</small>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Load More Button */}
            {hasMore && colleges.length > 0 && (
              <div className="text-center mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => fetchColleges(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Loading...
                    </>
                  ) : (
                    'Load More Colleges'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>

      {/* College Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedCollege?.['school.name']}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCollege && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">College Details</h4>
                <Button
                variant="link"
                className="p-0 border-0"
                onClick={() => toggleFavorite(selectedCollege)}
                title={isFavorite(selectedCollege.id)
                  ? "Remove from favorites"
                  : "Add to favorites"}
              >
                <i
                  className={`bi bi-heart${isFavorite(selectedCollege.id) ? '-fill' : ''}`}
                  style={{
                    fontSize: '1.8rem',
                    color: isFavorite(selectedCollege.id) ? 'red' : '#666'
                  }}
                />
              </Button>
              </div>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Location Information</h5>
                  <p>
                    <strong>City:</strong> {selectedCollege['school.city']}<br />
                    <strong>State:</strong> {selectedCollege['school.state']}<br />
                    <strong>ZIP:</strong> {selectedCollege['school.zip']}<br />
                    <strong>Region:</strong> {getRegionName(selectedCollege['school.region_id'])}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Cost Information</h5>
                  <p>
                    <strong>In-State Tuition:</strong><br />
                    {formatCurrency(selectedCollege['latest.cost.tuition.in_state'])}<br />
                    <strong>Out-of-State Tuition:</strong><br />
                    {formatCurrency(selectedCollege['latest.cost.tuition.out_of_state'])}
                  </p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <h5>Student Body</h5>
                  <p>
                    <strong>Total Students:</strong><br />
                    {formatNumber(selectedCollege['latest.student.size'])}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Admissions</h5>
                  <p>
                    <strong>Acceptance Rate:</strong><br />
                    {selectedCollege['latest.admissions.admission_rate.overall']
                      ? `${(selectedCollege['latest.admissions.admission_rate.overall'] * 100).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </Col>
              </Row>

              {selectedCollege['school.school_url'] && (
                <div className="mb-3">
                  <h5>Website</h5>
                  <a
                    href={selectedCollege['school.school_url'].startsWith('http')
                      ? selectedCollege['school.school_url']
                      : `https://${selectedCollege['school.school_url']}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Visit College Website
                  </a>
                </div>
              )}

              {selectedCollege['latest.academics.program_percentage'] && (
                <div>
                  <h5>Top Programs</h5>
                  <Row>
                    {Object.entries(selectedCollege['latest.academics.program_percentage'])
                      .filter(([key, value]) => value > 0.05)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([program, percentage]) => (
                        <Col md={6} key={program} className="mb-2">
                          <Badge bg="secondary" className="w-100 text-start p-2">
                            {program.replace(/_/g, ' ').toUpperCase()}: {(percentage * 100).toFixed(1)}%
                          </Badge>
                        </Col>
                      ))}
                  </Row>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// Made with Bob
