import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Container, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
          </Col>
        </Row>
      </Container>
    </div>
  );
}

// Made with Bob
