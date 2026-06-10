import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Landing() {
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
                <p className="text-muted mb-5">
                  Connect, organize, and succeed in your academic journey
                </p>
                
                <div className="d-grid gap-3">
                  <Button 
                    as={Link} 
                    to="/login" 
                    variant="primary" 
                    size="lg"
                    className="fw-semibold"
                    style={{ background: '#667eea', border: 'none' }}
                  >
                    Log In
                  </Button>
                  
                  <Button 
                    as={Link} 
                    to="/signup" 
                    variant="outline-primary" 
                    size="lg"
                    className="fw-semibold"
                    style={{ borderColor: '#667eea', color: '#667eea' }}
                  >
                    Sign Up
                  </Button>
                </div>
                
                <div className="mt-4">
                  <small className="text-muted">
                    Join thousands of students already using CollegeHub
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
