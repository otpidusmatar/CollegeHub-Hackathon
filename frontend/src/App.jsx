import React from 'react';
import { useLocation, HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function RouteContainer() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.key}>
      {/* Public routes */}
      <Route path="/" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/page1" element={
        <ProtectedRoute>
          <Page1 />
        </ProtectedRoute>
      } />
      <Route path="/page2" element={
        <ProtectedRoute>
          <Page2 />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

// Made with Bob
