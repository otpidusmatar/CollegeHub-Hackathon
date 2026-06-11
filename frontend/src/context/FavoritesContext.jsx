import React, { createContext, useState, useContext, useEffect } from 'react';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('collegeFavorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('collegeFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (college) => {
    setFavorites(prev => {
      // Check if already exists
      const exists = prev.some(fav => fav.id === college.id);
      if (exists) {
        return prev;
      }
      return [...prev, college];
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

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addFavorite, 
      removeFavorite, 
      isFavorite, 
      toggleFavorite 
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