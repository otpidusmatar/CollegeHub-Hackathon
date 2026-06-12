import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Container, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import background from '../assets/oxford.jpg';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Landing() {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // IBM Bob usage data - you can update these values
  const [tokenUsage, setTokenUsage] = useState({
    labels: [
  'Matchmaker Questionnaires with AI Evaluation',
  'AI Advisor System',
  'Account System',
  'Web Design and Formatting',
  'College Data API System'
],
datasets: [{
  label: 'Token Usage (%)',
  data: [42.02, 32.89, 12.50, 11.21, 1.38],
  backgroundColor: [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
  ],
  borderColor: [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
  ],
  borderWidth: 2,
}]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    }
  };

  const scrollToJudges = () => {
    document.getElementById('judges-section').scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const result = loginWithGoogle(credentialResponse);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to sign in with Google');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign in failed. Please try again.');
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Login Section with Background */}
      <div className="min-vh-100 d-flex align-items-center" style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5 text-center">
                <h1 className="display-4 fw-bold mb-3" style={{ color: '#667eea' }}>
                  CollegeHub
                </h1>
                <p className="lead text-muted mb-4">
                  Your all-in-one platform for college life management
                </p>
                <p className="text-muted mb-4">
                  Connect, organize, and succeed in your academic journey
                </p>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <div className="d-grid gap-3">
                  <Button
                    as={Link}
                    to="/login"
                    variant="primary"
                    size="lg"
                    className="fw-semibold"
                    style={{ background: '#667eea', border: 'none' }}
                  >
                    Log In with Email
                  </Button>
                  
                  <Button
                    as={Link}
                    to="/signup"
                    variant="outline-primary"
                    size="lg"
                    className="fw-semibold"
                    style={{ borderColor: '#667eea', color: '#667eea' }}
                  >
                    Sign Up with Email
                  </Button>
                </div>

                <div className="position-relative my-4">
                  <hr />
                  <span
                    className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted"
                    style={{ fontSize: '0.9rem' }}
                  >
                    OR
                  </span>
                </div>
                
                <div className="d-flex justify-content-center mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_blue"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="280"
                  />
                </div>
                
                <div className="mt-4">
                  <small className="text-muted">
                    Organize all things college with CollegeHub
                  </small>
                </div>
              </Card.Body>
            </Card>
            
            {/* Scroll Down Indicator */}
            <div className="text-center mt-4">
              <Button
                variant="link"
                onClick={scrollToJudges}
                className="text-white text-decoration-none"
                style={{
                  fontSize: '0.9rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <span className="mb-2">For Judges</span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="animate-bounce"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
      </div>

      {/* Judges Section */}
      <div id="judges-section" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 0'
      }}>
        <Container>
          <Row className="justify-content-center mb-5">
            <Col lg={10}>
              <h2 className="display-4 fw-bold text-white text-center mb-4">
                IBM Bob Integration
              </h2>
              <p className="lead text-white text-center mb-5">
                Accelerating CollegeHub's development for the IBM Bob Hackathon at the University of Houston CodeCougars event
              </p>
            </Col>
          </Row>

          <Row className="justify-content-center align-items-start g-4">
            {/* Pie Chart Section */}
            <Col lg={5} md={6}>
              <Card className="shadow-lg border-0 h-100">
                <Card.Body className="p-4">
                  <h3 className="h4 fw-bold mb-4 text-center" style={{ color: '#667eea' }}>
                    IBM Bob Token Usage Distribution
                  </h3>
                  <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <Pie data={tokenUsage} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-muted mb-2">
                      <strong>Total Bobcoins Used:</strong> <span className="text-primary">21.68</span>
                    </p>
                    <p className="text-muted mb-2">
                      <strong>Monetary Equivalent:</strong> <span className="text-primary">$10.84, 54% of allocated resources</span>
                    </p>
                    <p className="text-muted mb-1">
                      <strong>IBM Bob Prompts Sent:</strong> <span className="text-primary">38</span>
                    </p>
                  </div>
                  <div className="mb-5">
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Description Section */}
            <Col lg={5} md={6}>
              <Card className="shadow-lg border-0 h-100">
                <Card.Body className="p-4">
                  <h3 className="h4 fw-bold mb-4" style={{ color: '#667eea' }}>
                    How I Used IBM Bob
                  </h3>
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-1" style={{ color: '#764ba2' }}>
                      Code Structurer
                    </h5>
                    <p className="text-muted">
                      As someone with experience developing websites, instead of prompting IBM Bob with general feature requests, I designed my prompts to mention specific React JSX elements to use for targeted development that used less resources. I provided IBM Bob with my own personal web template and allowed it to build off of my work.
                    </p>
                  </div>
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-1" style={{ color: '#764ba2' }}>
                      📚 AI Matchmaker
                    </h5>
                    <p className="text-muted">
                      With IBM Bob, I created an LLM-based college recommendation system that uses convenient questionnaires and a chatbot to allow prospective American college applicants to identify suitable colleges for them, raising awareness beyond the known Ivies. This was done using an assembly of the Gemini API and Groq API.
                    </p>
                  </div>
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-1" style={{ color: '#764ba2' }}>
                      📅 Application Organization
                    </h5>
                    <p className="text-muted mb-0">
                      CollegeHub allows users to manage their favorite colleges and their applications, keeping track of typical admission rates and fees, and working on their applications accordingly. In future, this could be integrated with Common App's API to directly integrate with application statuses, as well as Common Data Sets to analyze typical student body admissions to desired colleges.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Back to Top Button */}
          <Row className="justify-content-center mt-5">
            <Col className="text-center">
              <Button
                variant="light"
                size="lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fw-semibold shadow"
              >
                Back to Top ↑
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

// Made with Bob
