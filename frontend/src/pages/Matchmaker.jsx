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
  Accordion,
  Badge,
  Spinner,
  Alert,
  ProgressBar
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Matchmaker() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // State management
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedQuestionnaires, setSavedQuestionnaires] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Questionnaire responses
  const [responses, setResponses] = useState({
    // Location preferences
    preferredStates: [],
    preferredRegion: '',
    locationImportance: 'medium',
    
    // Cost preferences
    maxTuition: '',
    tuitionImportance: 'high',
    
    // Size preferences
    preferredSize: '',
    sizeImportance: 'medium',
    
    // Academic preferences
    desiredPrograms: '',
    academicRigor: 'medium',
    
    // Additional preferences
    campusSetting: '',
    acceptanceRatePreference: '',
    
    // Metadata
    questionnaireName: '',
    dateCompleted: ''
  });

  // College Scorecard API configuration
  const API_KEY = 'uZqhM5FIsMThqsWvIviu2aL8AR2EC0Hpc214b6KN';
  const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

  // Load saved questionnaires from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collegeQuestionnaires');
    if (saved) {
      setSavedQuestionnaires(JSON.parse(saved));
    }
  }, []);

  // Save questionnaires to localStorage
  const saveToLocalStorage = (questionnaires) => {
    localStorage.setItem('collegeQuestionnaires', JSON.stringify(questionnaires));
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Start new questionnaire
  const startNewQuestionnaire = () => {
    setResponses({
      preferredStates: [],
      preferredRegion: '',
      locationImportance: 'medium',
      maxTuition: '',
      tuitionImportance: 'high',
      preferredSize: '',
      sizeImportance: 'medium',
      desiredPrograms: '',
      academicRigor: 'medium',
      campusSetting: '',
      acceptanceRatePreference: '',
      questionnaireName: '',
      dateCompleted: ''
    });
    setCurrentStep(1);
    setShowQuestionnaire(true);
    setShowResults(false);
    setRecommendations([]);
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  // Handle state selection
  const handleStateToggle = (state) => {
    setResponses(prev => {
      const states = prev.preferredStates.includes(state)
        ? prev.preferredStates.filter(s => s !== state)
        : [...prev.preferredStates, state];
      return { ...prev, preferredStates: states };
    });
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Fetch college recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        per_page: 20,
        'fields': 'id,school.name,school.city,school.state,school.school_url,school.zip,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.student.size,latest.admissions.admission_rate.overall,latest.academics.program_percentage,school.locale,school.region_id'
      });

      // Apply filters based on responses
      if (responses.preferredStates.length > 0) {
        // API doesn't support multiple states directly, so we'll fetch for first state
        params.append('school.state', responses.preferredStates[0]);
      }
      
      if (responses.preferredRegion) {
        params.append('school.region_id', responses.preferredRegion);
      }
      
      if (responses.maxTuition) {
        params.append('latest.cost.tuition.in_state__range', `..${responses.maxTuition}`);
      }
      
      if (responses.preferredSize) {
        params.append('latest.student.size__range', responses.preferredSize);
      }

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();

      if (data.results) {
        // Score and sort colleges based on preferences
        const scoredColleges = data.results.map(college => ({
          ...college,
          matchScore: calculateMatchScore(college)
        })).sort((a, b) => b.matchScore - a.matchScore);

        setRecommendations(scoredColleges.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate match score based on preferences
  const calculateMatchScore = (college) => {
    let score = 0;
    let maxScore = 0;

    // Location scoring
    if (responses.locationImportance !== 'low') {
      maxScore += responses.locationImportance === 'high' ? 30 : 20;
      if (responses.preferredStates.includes(college['school.state'])) {
        score += responses.locationImportance === 'high' ? 30 : 20;
      }
    }

    // Tuition scoring
    if (responses.tuitionImportance !== 'low' && responses.maxTuition) {
      maxScore += responses.tuitionImportance === 'high' ? 40 : 25;
      const tuition = college['latest.cost.tuition.in_state'];
      if (tuition && tuition <= responses.maxTuition) {
        const tuitionRatio = 1 - (tuition / responses.maxTuition);
        score += (responses.tuitionImportance === 'high' ? 40 : 25) * tuitionRatio;
      }
    }

    // Size scoring
    if (responses.sizeImportance !== 'low' && responses.preferredSize) {
      maxScore += responses.sizeImportance === 'high' ? 30 : 20;
      const size = college['latest.student.size'];
      if (size) {
        const [min, max] = responses.preferredSize.split('..').map(s => s ? parseInt(s) : null);
        if ((min === null || size >= min) && (max === null || size <= max)) {
          score += responses.sizeImportance === 'high' ? 30 : 20;
        }
      }
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 50;
  };

  // Submit questionnaire
  const submitQuestionnaire = async () => {
    if (!responses.questionnaireName.trim()) {
      alert('Please provide a name for this questionnaire');
      return;
    }

    await fetchRecommendations();

    const newQuestionnaire = {
      id: Date.now(),
      name: responses.questionnaireName,
      date: new Date().toISOString(),
      responses: { ...responses },
      recommendations: []
    };

    const updated = [newQuestionnaire, ...savedQuestionnaires];
    setSavedQuestionnaires(updated);
    saveToLocalStorage(updated);
    
    setShowQuestionnaire(false);
    setShowResults(true);
  };

  // Delete questionnaire
  const deleteQuestionnaire = (id) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      const updated = savedQuestionnaires.filter(q => q.id !== id);
      setSavedQuestionnaires(updated);
      saveToLocalStorage(updated);
    }
  };

  // View saved questionnaire
  const viewQuestionnaire = async (questionnaire) => {
    setResponses(questionnaire.responses);
    setLoading(true);
    await fetchRecommendations();
    setShowResults(true);
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

  // Render questionnaire step
  const renderQuestionnaireStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h4 className="mb-4">Step 1: Location Preferences</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Preferred States (Select all that apply)</Form.Label>
              <Row>
                {['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MA', 'NC', 'GA', 'VA', 'MI'].map(state => (
                  <Col md={3} key={state} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label={state}
                      checked={responses.preferredStates.includes(state)}
                      onChange={() => handleStateToggle(state)}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Preferred Region</Form.Label>
              <Form.Select
                value={responses.preferredRegion}
                onChange={(e) => handleInputChange('preferredRegion', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="1">New England</option>
                <option value="2">Mid East</option>
                <option value="3">Great Lakes</option>
                <option value="4">Plains</option>
                <option value="5">Southeast</option>
                <option value="6">Southwest</option>
                <option value="7">Rocky Mountains</option>
                <option value="8">Far West</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is location to you?</Form.Label>
              <Form.Select
                value={responses.locationImportance}
                onChange={(e) => handleInputChange('locationImportance', e.target.value)}
              >
                <option value="low">Low - I'm flexible</option>
                <option value="medium">Medium - Somewhat important</option>
                <option value="high">High - Very important</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 className="mb-4">Step 2: Cost & Financial Considerations</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Maximum Annual Tuition (In-State)</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 50000"
                value={responses.maxTuition}
                onChange={(e) => handleInputChange('maxTuition', e.target.value)}
              />
              <Form.Text className="text-muted">
                Leave blank if cost is not a limiting factor
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is tuition cost to you?</Form.Label>
              <Form.Select
                value={responses.tuitionImportance}
                onChange={(e) => handleInputChange('tuitionImportance', e.target.value)}
              >
                <option value="low">Low - Cost is not a major concern</option>
                <option value="medium">Medium - I'd like to keep costs reasonable</option>
                <option value="high">High - Cost is a critical factor</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 3:
        return (
          <div>
            <h4 className="mb-4">Step 3: School Size & Environment</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Preferred School Size</Form.Label>
              <Form.Select
                value={responses.preferredSize}
                onChange={(e) => handleInputChange('preferredSize', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="0..2000">Small {'(<'} 2,000 students)</option>
                <option value="2000..10000">Medium (2,000-10,000 students)</option>
                <option value="10000..">Large {'(>'} 10,000 students)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is school size to you?</Form.Label>
              <Form.Select
                value={responses.sizeImportance}
                onChange={(e) => handleInputChange('sizeImportance', e.target.value)}
              >
                <option value="low">Low - Size doesn't matter much</option>
                <option value="medium">Medium - I have some preferences</option>
                <option value="high">High - Size is very important</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Campus Setting Preference</Form.Label>
              <Form.Select
                value={responses.campusSetting}
                onChange={(e) => handleInputChange('campusSetting', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="city">City - Urban environment</option>
                <option value="suburban">Suburban - Mix of urban and rural</option>
                <option value="rural">Rural - Countryside setting</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 4:
        return (
          <div>
            <h4 className="mb-4">Step 4: Academic Preferences</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Desired Programs/Majors</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g., Computer Science, Business, Engineering"
                value={responses.desiredPrograms}
                onChange={(e) => handleInputChange('desiredPrograms', e.target.value)}
              />
              <Form.Text className="text-muted">
                List any specific programs or fields of study you're interested in
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Academic Rigor Preference</Form.Label>
              <Form.Select
                value={responses.academicRigor}
                onChange={(e) => handleInputChange('academicRigor', e.target.value)}
              >
                <option value="low">Relaxed - More balanced approach</option>
                <option value="medium">Moderate - Standard academic challenge</option>
                <option value="high">Rigorous - Highly competitive academics</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Acceptance Rate Preference</Form.Label>
              <Form.Select
                value={responses.acceptanceRatePreference}
                onChange={(e) => handleInputChange('acceptanceRatePreference', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="high">Higher acceptance rate {'(>'} 50%)</option>
                <option value="medium">Moderate acceptance rate (25-50%)</option>
                <option value="low">Selective {'(<'} 25%)</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 5:
        return (
          <div>
            <h4 className="mb-4">Step 5: Name Your Questionnaire</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Questionnaire Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., My Dream College Search - June 2026"
                value={responses.questionnaireName}
                onChange={(e) => handleInputChange('questionnaireName', e.target.value)}
              />
              <Form.Text className="text-muted">
                Give this questionnaire a memorable name so you can find it later
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <Alert.Heading>Review Your Preferences</Alert.Heading>
              <ul className="mb-0">
                <li><strong>Location:</strong> {responses.preferredStates.length > 0 ? responses.preferredStates.join(', ') : 'No preference'}</li>
                <li><strong>Max Tuition:</strong> {responses.maxTuition ? formatCurrency(responses.maxTuition) : 'No limit'}</li>
                <li><strong>School Size:</strong> {responses.preferredSize ? responses.preferredSize.replace('..', ' to ').replace('0', 'Under 2,000').replace('10000', 'Over 10,000') : 'No preference'}</li>
                <li><strong>Programs:</strong> {responses.desiredPrograms || 'Not specified'}</li>
              </ul>
            </Alert>
          </div>
        );

      default:
        return null;
    }
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
        <h1 className="mb-4">College Matchmaker</h1>
        <p className="lead mb-4">
          Find your perfect college match by answering a few questions about your preferences.
        </p>

        {/* Start New Questionnaire Button */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="text-center py-4">
            <h4 className="mb-3">Ready to find your perfect college?</h4>
            <Button 
              variant="primary" 
              size="lg"
              onClick={startNewQuestionnaire}
              disabled={showQuestionnaire}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Start New Questionnaire
            </Button>
          </Card.Body>
        </Card>

        {/* Questionnaire Modal */}
        <Modal 
          show={showQuestionnaire} 
          onHide={() => setShowQuestionnaire(false)} 
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>College Matchmaker Questionnaire</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ProgressBar 
              now={(currentStep / 5) * 100} 
              label={`Step ${currentStep} of 5`}
              className="mb-4"
            />
            {renderQuestionnaireStep()}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 5 ? (
              <Button variant="primary" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={submitQuestionnaire}
                disabled={!responses.questionnaireName.trim()}
              >
                Submit & Get Recommendations
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Results Modal */}
        <Modal 
          show={showResults} 
          onHide={() => setShowResults(false)} 
          size="xl"
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>Your College Recommendations</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Finding your perfect matches...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <Alert variant="success">
                  <strong>Great news!</strong> We found {recommendations.length} colleges that match your preferences.
                </Alert>
                <Row>
                  {recommendations.map((college, index) => (
                    <Col key={college.id} md={6} className="mb-4">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0" style={{ flex: 1 }}>
                              {index + 1}. {college['school.name']}
                            </Card.Title>
                            <div className="d-flex align-items-center gap-2">
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
                              <Badge bg="success">
                                {college.matchScore.toFixed(0)}% Match
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <strong>📍 Location:</strong><br />
                            {college['school.city']}, {college['school.state']}
                          </div>
                          
                          <div className="mb-2">
                            <strong>💰 In-State Tuition:</strong><br />
                            {formatCurrency(college['latest.cost.tuition.in_state'])}
                          </div>
                          
                          <div className="mb-2">
                            <strong>👥 Student Size:</strong><br />
                            {formatNumber(college['latest.student.size'])}
                          </div>
                          
                          {college['latest.admissions.admission_rate.overall'] && (
                            <div className="mb-2">
                              <strong>📊 Acceptance Rate:</strong><br />
                              {(college['latest.admissions.admission_rate.overall'] * 100).toFixed(1)}%
                            </div>
                          )}

                          {college['school.school_url'] && (
                            <a
                              href={college['school.school_url'].startsWith('http')
                                ? college['school.school_url']
                                : `https://${college['school.school_url']}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary mt-2"
                            >
                              Visit Website
                            </a>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <Alert variant="warning">
                No colleges found matching your criteria. Try adjusting your preferences.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResults(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Saved Questionnaires */}
        <div className="mt-5">
          <h3 className="mb-3">Your Saved Questionnaires</h3>
          {savedQuestionnaires.length === 0 ? (
            <Alert variant="info">
              You haven't completed any questionnaires yet. Start one above to get personalized college recommendations!
            </Alert>
          ) : (
            <Accordion>
              {savedQuestionnaires.map((questionnaire, index) => (
                <Accordion.Item eventKey={index.toString()} key={questionnaire.id}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <div>
                        <strong>{questionnaire.name}</strong>
                        <br />
                        <small className="text-muted">
                          Completed: {new Date(questionnaire.date).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={8}>
                        <h5>Your Preferences:</h5>
                        <ul>
                          <li>
                            <strong>Preferred States:</strong>{' '}
                            {questionnaire.responses.preferredStates.length > 0
                              ? questionnaire.responses.preferredStates.join(', ')
                              : 'No preference'}
                          </li>
                          <li>
                            <strong>Preferred Region:</strong>{' '}
                            {questionnaire.responses.preferredRegion
                              ? getRegionName(parseInt(questionnaire.responses.preferredRegion))
                              : 'No preference'}
                          </li>
                          <li>
                            <strong>Max Tuition:</strong>{' '}
                            {questionnaire.responses.maxTuition
                              ? formatCurrency(questionnaire.responses.maxTuition)
                              : 'No limit'}
                          </li>
                          <li>
                            <strong>School Size:</strong>{' '}
                            {questionnaire.responses.preferredSize || 'No preference'}
                          </li>
                          <li>
                            <strong>Desired Programs:</strong>{' '}
                            {questionnaire.responses.desiredPrograms || 'Not specified'}
                          </li>
                        </ul>
                      </Col>
                      <Col md={4} className="text-end">
                        <Button
                          variant="primary"
                          className="mb-2 w-100"
                          onClick={() => viewQuestionnaire(questionnaire)}
                        >
                          View Recommendations
                        </Button>
                        <Button
                          variant="danger"
                          className="w-100"
                          onClick={() => deleteQuestionnaire(questionnaire.id)}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      </Container>
    </>
  );
}

// Made with Bob
