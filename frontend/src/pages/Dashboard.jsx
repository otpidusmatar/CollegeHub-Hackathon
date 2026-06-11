import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
      
      <Container className="mt-5">
        <div className="mb-4">
          <h1>Welcome to CollegeHub, {user?.name || 'User'}!</h1>
          <p className="text-muted">Email: {user?.email}</p>
        </div>
        
        <div className="row mt-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Quick Access</h5>
                <p className="card-text">Navigate to different sections of CollegeHub using the navigation bar above.</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Page 1</h5>
                <p className="card-text">Explore Page 1 features and functionality.</p>
                <Link to="/matchmaker" className="btn btn-primary btn-sm">Go to Page 1</Link>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Page 2</h5>
                <p className="card-text">Discover what Page 2 has to offer.</p>
                <Link to="/explore" className="btn btn-primary btn-sm">Go to Page 2</Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

// Made with Bob
