import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge, ProgressBar, ListGroup } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useFavorites } from '../context/FavoritesContext';
import { analyzeCompetitiveness } from '../services/aiService';
import ProfileDropdown from '../components/ProfileDropdown';

export default function CompetitivenessAnalyzer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, getProfileCompleteness } = useProfile();
  const { favorites } = useFavorites();

  const [selectedCollege, setSelectedCollege] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!selectedCollege) {
      setError('Please select a college to analyze');
      return;
    }

    const completeness = getProfileCompleteness();
    if (completeness < 50) {
      setError('Please complete at least 50% of your profile before analyzing competitiveness');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const college = favorites.find(c => c.id === parseInt(selectedCollege));
      const result = await analyzeCompetitiveness(profile, college);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze competitiveness. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  const getChanceLabel = (score) => {
    if (score >= 80) return 'Strong Candidate';
    if (score >= 60) return 'Competitive';
    if (score >= 40) return 'Reach';
    return 'High Reach';
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
              <Nav.Link as={Link} to="/analyzer" style={{ color: '#ffffff' }}>Analysis</Nav.Link>
              <div className="ms-2">
                <ProfileDropdown />
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4 mb-5">
        <Row>
          <Col lg={4}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">🎯 Competitiveness Analyzer</h5>
                <p className="text-muted small">
                  Evaluate your competitiveness at your favorite colleges using AI-powered analysis based on your academic profile.
                </p>

                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold">Profile Completeness</span>
                    <span className="small text-muted">{completeness}%</span>
                  </div>
                  <ProgressBar 
                    now={completeness} 
                    variant={completeness >= 50 ? 'success' : 'warning'}
                    style={{ height: '8px' }}
                  />
                  {completeness < 50 && (
                    <Alert variant="warning" className="mt-3 small mb-0">
                      Complete at least 50% of your profile to use the analyzer.
                      <Link to="/profile" className="alert-link d-block mt-2">
                        Complete Profile →
                      </Link>
                    </Alert>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="mb-3">Select College</h6>
                {favorites.length === 0 ? (
                  <Alert variant="info" className="small mb-0">
                    Add colleges to your favorites first.
                    <Link to="/explore" className="alert-link d-block mt-2">
                      Explore Colleges →
                    </Link>
                  </Alert>
                ) : (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Select
                        value={selectedCollege}
                        onChange={(e) => setSelectedCollege(e.target.value)}
                        disabled={completeness < 50}
                      >
                        <option value="">Choose a college...</option>
                        {favorites.map((college) => (
                          <option key={college.id} value={college.id}>
                            {college['school.name']}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleAnalyze}
                      disabled={!selectedCollege || analyzing || completeness < 50}
                    >
                      {analyzing ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Analyzing...
                        </>
                      ) : (
                        '🔍 Analyze Competitiveness'
                      )}
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <h2 className="mb-4">📊 Analysis Results</h2>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {!analysis && !analyzing && (
              <Card className="shadow-sm">
                <Card.Body className="text-center py-5">
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎓</div>
                  <h4>Ready to Analyze</h4>
                  <p className="text-muted">
                    Select a college from your favorites and click "Analyze Competitiveness" to get AI-powered insights about your chances.
                  </p>
                </Card.Body>
              </Card>
            )}

            {analyzing && (
              <Card className="shadow-sm">
                <Card.Body className="text-center py-5">
                  <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                  <h4 className="mt-4">Analyzing Your Profile...</h4>
                  <p className="text-muted">This may take a few moments</p>
                </Card.Body>
              </Card>
            )}

            {analysis && (
              <>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <div className="text-center mb-4">
                      <h3>{analysis.collegeName}</h3>
                      <p className="text-muted mb-0">{analysis.location}</p>
                    </div>

                    <Row className="text-center mb-4">
                      <Col md={6}>
                        <div className="mb-3">
                          <h1 className={`text-${getScoreColor(analysis.competitivenessScore)} mb-2`}>
                            {analysis.competitivenessScore}%
                          </h1>
                          <h5 className="text-muted">Competitiveness Score</h5>
                          <Badge bg={getScoreColor(analysis.competitivenessScore)} className="mt-2">
                            {getChanceLabel(analysis.competitivenessScore)}
                          </Badge>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <h1 className="text-info mb-2">
                            {analysis.acceptanceRate}%
                          </h1>
                          <h5 className="text-muted">College Acceptance Rate</h5>
                        </div>
                      </Col>
                    </Row>

                    <ProgressBar className="mb-2" style={{ height: '30px' }}>
                      <ProgressBar 
                        variant={getScoreColor(analysis.competitivenessScore)} 
                        now={analysis.competitivenessScore} 
                        label={`${analysis.competitivenessScore}%`}
                      />
                    </ProgressBar>
                    <p className="text-center text-muted small mb-0">
                      Your competitiveness relative to typical admitted students
                    </p>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">📈 Academic Profile Comparison</h5>
                    <ListGroup variant="flush">
                      {analysis.strengths && analysis.strengths.length > 0 && (
                        <ListGroup.Item>
                          <h6 className="text-success mb-2">✓ Strengths</h6>
                          <ul className="mb-0">
                            {analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="text-muted">{strength}</li>
                            ))}
                          </ul>
                        </ListGroup.Item>
                      )}
                      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                        <ListGroup.Item>
                          <h6 className="text-warning mb-2">⚠ Areas for Improvement</h6>
                          <ul className="mb-0">
                            {analysis.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-muted">{weakness}</li>
                            ))}
                          </ul>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">💡 Recommendations</h5>
                    {analysis.recommendations && analysis.recommendations.length > 0 ? (
                      <ListGroup variant="flush">
                        {analysis.recommendations.map((rec, idx) => (
                          <ListGroup.Item key={idx}>
                            <div className="d-flex align-items-start">
                              <Badge bg="info" className="me-2 mt-1">{idx + 1}</Badge>
                              <span>{rec}</span>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p className="text-muted mb-0">No specific recommendations at this time.</p>
                    )}
                  </Card.Body>
                </Card>

                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3">📝 Overall Assessment</h5>
                    <p className="mb-0">{analysis.summary}</p>
                  </Card.Body>
                </Card>

                <div className="mt-4 text-center">
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setAnalysis(null);
                      setSelectedCollege('');
                    }}
                  >
                    Analyze Another College
                  </Button>
                </div>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

// Made with Bob
