import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  // Get user initials for the profile circle
  const getInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  // Custom toggle component for the profile circle
  const ProfileToggle = React.forwardRef(({ onClick }, ref) => (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: user?.picture ? 'transparent' : '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        backgroundImage: user?.picture ? `url(${user.picture})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
      title={user?.name || 'User Profile'}
    >
      {!user?.picture && getInitials()}
    </div>
  ));

  ProfileToggle.displayName = 'ProfileToggle';

  return (
    <Dropdown show={showDropdown} onToggle={setShowDropdown} align="end">
      <Dropdown.Toggle as={ProfileToggle} id="profile-dropdown" />

      <Dropdown.Menu
        style={{
          minWidth: '200px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          marginTop: '8px'
        }}
      >
        <div className="px-3 py-2 border-bottom">
          <div className="fw-bold text-dark">{user?.name || 'User'}</div>
          <div className="small text-muted">{user?.email}</div>
        </div>
        
        <Dropdown.Item 
          onClick={handleEditProfile}
          className="d-flex align-items-center py-2"
        >
          <i className="bi bi-person-circle me-2"></i>
          Edit Profile
        </Dropdown.Item>
        
        <Dropdown.Divider />
        
        <Dropdown.Item 
          onClick={handleLogout}
          className="d-flex align-items-center py-2 text-danger"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

// Made with Bob