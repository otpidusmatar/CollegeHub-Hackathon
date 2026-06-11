import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const { user, isAuthenticated } = useAuth();

  // Load favorites from localStorage when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const storageKey = `collegeFavorites_${user.id}`;
      const storedFavorites = localStorage.getItem(storageKey);
      if (storedFavorites) {
        try {
          setFavorites(JSON.parse(storedFavorites));
        } catch (error) {
          console.error('Error loading favorites:', error);
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    } else {
      // Clear favorites when logged out
      setFavorites([]);
    }
  }, [user?.id, isAuthenticated]);

  // Save favorites to localStorage whenever they change (user-specific)
  useEffect(() => {
    if (isAuthenticated && user?.id && favorites.length >= 0) {
      const storageKey = `collegeFavorites_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    }
  }, [favorites, user?.id, isAuthenticated]);

  const addFavorite = (college) => {
    setFavorites(prev => {
      // Check if already exists
      const exists = prev.some(fav => fav.id === college.id);
      if (exists) {
        return prev;
      }
      // Add college with applied status set to false
      return [...prev, { ...college, applied: false }];
    });
  };

  const removeFavorite = (collegeId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== collegeId));
  };

  const isFavorite = (collegeId) => {
    return favorites.some(fav => fav.id === collegeId);
  };

  const toggleFavorite = (college) => {
    if (isFavorite(college.id)) {
      removeFavorite(college.id);
    } else {
      addFavorite(college);
    }
  };

  const toggleApplied = (collegeId) => {
    setFavorites(prev =>
      prev.map(fav =>
        fav.id === collegeId
          ? { ...fav, applied: !fav.applied }
          : fav
      )
    );
  };

  const getAppliedCount = () => {
    return favorites.filter(fav => fav.applied).length;
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      toggleApplied,
      getAppliedCount
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

// Made with Bob