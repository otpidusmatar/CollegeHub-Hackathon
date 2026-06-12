import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      // Academic Information
      gpa: '',
      gpaScale: '4.0',
      classRank: '',
      classSize: '',
      
      // Test Scores
      satScore: '',
      satMath: '',
      satReading: '',
      actScore: '',
      
      // Courses
      apCourses: [],
      honorsCourses: [],
      ibCourses: [],
      
      // Achievements & Activities
      achievements: [],
      extracurriculars: [],
      leadership: [],
      volunteering: [],
      
      // Additional Info
      intendedMajor: '',
      careerGoals: '',
      personalStatement: '',
    };
  });

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addCourse = (type, course) => {
    setProfile(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), ...course }]
    }));
  };

  const removeCourse = (type, courseId) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c.id !== courseId)
    }));
  };

  const addItem = (type, item) => {
    setProfile(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), ...item }]
    }));
  };

  const removeItem = (type, itemId) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i.id !== itemId)
    }));
  };

  const clearProfile = () => {
    setProfile({
      gpa: '',
      gpaScale: '4.0',
      classRank: '',
      classSize: '',
      satScore: '',
      satMath: '',
      satReading: '',
      actScore: '',
      apCourses: [],
      honorsCourses: [],
      ibCourses: [],
      achievements: [],
      extracurriculars: [],
      leadership: [],
      volunteering: [],
      intendedMajor: '',
      careerGoals: '',
      personalStatement: '',
    });
  };

  const clearSection = (section) => {
    switch (section) {
      case 'academic':
        setProfile(prev => ({
          ...prev,
          gpa: '',
          gpaScale: '4.0',
          classRank: '',
          classSize: '',
          satScore: '',
          satMath: '',
          satReading: '',
          actScore: '',
          intendedMajor: '',
        }));
        break;
      case 'courses':
        setProfile(prev => ({
          ...prev,
          apCourses: [],
          honorsCourses: [],
          ibCourses: [],
        }));
        break;
      case 'achievements':
        setProfile(prev => ({
          ...prev,
          achievements: [],
        }));
        break;
      case 'activities':
        setProfile(prev => ({
          ...prev,
          extracurriculars: [],
          leadership: [],
          volunteering: [],
        }));
        break;
      default:
        break;
    }
  };

  const getProfileCompleteness = () => {
    let completed = 0;
    let total = 0;

    // Check basic academic info (4 fields)
    total += 4;
    if (profile.gpa) completed++;
    if (profile.classRank) completed++;
    if (profile.classSize) completed++;
    if (profile.intendedMajor) completed++;

    // Check test scores (at least one)
    total += 1;
    if (profile.satScore || profile.actScore) completed++;

    // Check courses (at least one type)
    total += 1;
    if (profile.apCourses.length > 0 || profile.honorsCourses.length > 0 || profile.ibCourses.length > 0) completed++;

    // Check activities (at least one type)
    total += 1;
    if (profile.achievements.length > 0 || profile.extracurriculars.length > 0 || 
        profile.leadership.length > 0 || profile.volunteering.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      addCourse,
      removeCourse,
      addItem,
      removeItem,
      clearProfile,
      clearSection,
      getProfileCompleteness,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Made with Bob
