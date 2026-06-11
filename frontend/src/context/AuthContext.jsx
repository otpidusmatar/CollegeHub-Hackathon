import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get all registered users
  const getRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  };

  // Helper function to save registered users
  const saveRegisteredUsers = (users) => {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  // Handle Google OAuth login - unified with email-based accounts
  const loginWithGoogle = (credentialResponse) => {
    try {
      // Decode the JWT token to get user info
      const token = credentialResponse.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      const registeredUsers = getRegisteredUsers();
      
      // Check if an account with this email already exists
      const existingUserIndex = registeredUsers.findIndex(u => u.email === payload.email);
      
      if (existingUserIndex !== -1) {
        // Merge with existing account - update with Google info but keep existing data
        const existingUser = registeredUsers[existingUserIndex];
        registeredUsers[existingUserIndex] = {
          ...existingUser,
          googleId: payload.sub,
          picture: payload.picture,
          emailVerified: payload.email_verified,
          lastLoginProvider: 'google',
          lastLoginAt: new Date().toISOString()
        };
        saveRegisteredUsers(registeredUsers);
        
        const userData = {
          id: payload.email, // Use email as consistent ID
          email: payload.email,
          name: existingUser.name, // Keep original name
          picture: payload.picture,
          authProvider: 'unified', // Indicate this account supports both methods
          emailVerified: payload.email_verified
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        return { success: true, user: userData };
      } else {
        // Create new account for this Google user
        const newUser = {
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          picture: payload.picture,
          emailVerified: payload.email_verified,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
          lastLoginProvider: 'google',
          lastLoginAt: new Date().toISOString()
        };
        
        registeredUsers.push(newUser);
        saveRegisteredUsers(registeredUsers);
        
        const userData = {
          id: payload.email, // Use email as consistent ID
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          authProvider: 'google',
          emailVerified: payload.email_verified
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error('Error processing Google login:', error);
      return { success: false, error: 'Failed to process Google login' };
    }
  };

  // Traditional email/password login with validation - unified with Google accounts
  const login = (email, password) => {
    const registeredUsers = getRegisteredUsers();
    
    // Find user by email
    const userIndex = registeredUsers.findIndex(u => u.email === email);
    
    // Check if user exists
    if (userIndex === -1) {
      return { success: false, error: 'No account found with this email address' };
    }
    
    const user = registeredUsers[userIndex];
    
    // Check if user has a password set (not Google-only account)
    if (!user.password) {
      return { success: false, error: 'This account was created with Google. Please sign in with Google.' };
    }
    
    // Check if password matches
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }
    
    // Update last login info
    registeredUsers[userIndex] = {
      ...user,
      lastLoginProvider: 'email',
      lastLoginAt: new Date().toISOString()
    };
    saveRegisteredUsers(registeredUsers);
    
    // Login successful
    const userWithProvider = {
      name: user.name,
      email: user.email,
      picture: user.picture, // Include picture if available from previous Google login
      authProvider: user.googleId ? 'unified' : 'email', // Indicate if account supports both methods
      id: user.email
    };
    
    setUser(userWithProvider);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userWithProvider));
    localStorage.setItem('authToken', 'email_auth_' + Date.now());
    
    return { success: true, user: userWithProvider };
  };

  // Traditional signup with credential storage - unified with Google accounts
  const signup = (userData) => {
    const registeredUsers = getRegisteredUsers();
    
    // Check if email already exists
    const existingUserIndex = registeredUsers.findIndex(u => u.email === userData.email);
    
    if (existingUserIndex !== -1) {
      const existingUser = registeredUsers[existingUserIndex];
      
      // If account exists but was created via Google (no password), allow adding password
      if (!existingUser.password && existingUser.googleId) {
        registeredUsers[existingUserIndex] = {
          ...existingUser,
          password: userData.password, // In production, this should be hashed
          name: userData.name, // Update name if provided
          lastLoginProvider: 'email',
          lastLoginAt: new Date().toISOString()
        };
        saveRegisteredUsers(registeredUsers);
        
        // Create user session
        const userWithProvider = {
          name: userData.name,
          email: userData.email,
          picture: existingUser.picture, // Keep Google profile picture
          authProvider: 'unified', // Now supports both methods
          id: userData.email
        };
        
        setUser(userWithProvider);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userWithProvider));
        localStorage.setItem('authToken', 'email_auth_' + Date.now());
        
        return { success: true, user: userWithProvider };
      } else {
        return { success: false, error: 'An account with this email already exists. Please log in instead.' };
      }
    }
    
    // Store user credentials for new account
    const newUser = {
      name: userData.name,
      email: userData.email,
      password: userData.password, // In production, this should be hashed
      authProvider: 'email',
      createdAt: new Date().toISOString(),
      lastLoginProvider: 'email',
      lastLoginAt: new Date().toISOString()
    };
    
    registeredUsers.push(newUser);
    saveRegisteredUsers(registeredUsers);
    
    // Create user session
    const userWithProvider = {
      name: userData.name,
      email: userData.email,
      authProvider: 'email',
      id: userData.email
    };
    
    setUser(userWithProvider);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userWithProvider));
    localStorage.setItem('authToken', 'email_auth_' + Date.now());
    
    return { success: true, user: userWithProvider };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('favorites'); // Clear favorites on logout
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      loginWithGoogle,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Made with Bob
