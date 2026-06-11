import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {
  Navbar,
  Nav,
  Container,
  Button,
  Form,
  Row,
  Col,
  Card,
  Modal,
  Accordion,
  Badge,
  Spinner,
  Alert,
  ProgressBar,
  ListGroup,
  InputGroup
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import aiService from '../services/aiService';

// Helper function to format Gemini's markdown-style text
const formatGeminiText = (text) => {
  if (!text) return null;
  
  // Split text into parts while preserving formatting markers
  const parts = [];
  let currentIndex = 0;
  
  // Regular expressions for different formatting
  const patterns = [
    { regex: /\*\*\*(.+?)\*\*\*/g, tag: 'bold-italic' },  // ***text*** -> bold + italic
    { regex: /\*\*(.+?)\*\*/g, tag: 'bold' },              // **text** -> bold
    { regex: /\*(.+?)\*/g, tag: 'italic' },                // *text* -> italic
    { regex: /`(.+?)`/g, tag: 'code' },                    // `text` -> code
    { regex: /^#{1,6}\s+(.+)$/gm, tag: 'heading' },        // # text -> heading
    { regex: /^\*\s+(.+)$/gm, tag: 'bullet' },             // * text -> bullet point
    { regex: /^\d+\.\s+(.+)$/gm, tag: 'numbered' },        // 1. text -> numbered list
  ];
  
  // Process the text line by line to handle block elements
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const HeadingTag = `h${Math.min(level + 3, 6)}`; // h4-h6 for markdown h1-h3
      return (
        <HeadingTag key={lineIndex} style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
          {formatInlineText(headingMatch[2])}
        </HeadingTag>
      );
    }
    
    // Check for bullet points
    const bulletMatch = line.match(/^\*\s+(.+)$/);
    if (bulletMatch) {
      return (
        <div key={lineIndex} style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
          • {formatInlineText(bulletMatch[1])}
        </div>
      );
    }
    
    // Check for numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      return (
        <div key={lineIndex} style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
          {numberedMatch[1]}. {formatInlineText(numberedMatch[2])}
        </div>
      );
    }
    
    // Regular line with inline formatting
    return (
      <div key={lineIndex} style={{ marginTop: lineIndex > 0 ? '0.25rem' : 0 }}>
        {formatInlineText(line)}
      </div>
    );
  });
};

// Helper function to format inline text (bold, italic, code)
const formatInlineText = (text) => {
  if (!text) return null;
  
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;
  
  // Combined regex to match all inline patterns
  const combinedRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add formatted text
    if (match[2]) {
      // ***text*** -> bold + italic
      parts.push(
        <strong key={keyCounter++} style={{ fontStyle: 'italic' }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // **text** -> bold
      parts.push(<strong key={keyCounter++}>{match[3]}</strong>);
    } else if (match[4]) {
      // *text* -> italic
      parts.push(<em key={keyCounter++}>{match[4]}</em>);
    } else if (match[5]) {
      // `text` -> code
      parts.push(
        <code
          key={keyCounter++}
          style={{
            backgroundColor: '#f0f0f0',
            padding: '0.125rem 0.25rem',
            borderRadius: '0.25rem',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}
        >
          {match[5]}
        </code>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

export default function Matchmaker() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // State management
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedQuestionnaires, setSavedQuestionnaires] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // LLM Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [mentionedColleges, setMentionedColleges] = useState([]); // Store full college data with IDs and names
  const chatEndRef = useRef(null);
  
  // Questionnaire responses
  const [responses, setResponses] = useState({
    // Location preferences
    preferredStates: [],
    preferredRegion: '',
    locationImportance: 'medium',
    
    // Cost preferences
    maxTuition: '',
    tuitionImportance: 'high',
    
    // Size preferences
    preferredSize: '',
    sizeImportance: 'medium',
    
    // Academic preferences
    desiredPrograms: '',
    academicRigor: 'medium',
    
    // Additional preferences
    campusSetting: '',
    acceptanceRatePreference: '',
    
    // Metadata
    questionnaireName: '',
    dateCompleted: ''
  });

  // College Scorecard API configuration
  const API_KEY = 'uZqhM5FIsMThqsWvIviu2aL8AR2EC0Hpc214b6KN';
  const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

  // AI Service (with Gemini/Groq fallback)
  const isAIConfigured = aiService.isConfigured();

  // Load saved questionnaires from localStorage (user-specific)
  useEffect(() => {
    if (user?.id) {
      const storageKey = `collegeQuestionnaires_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSavedQuestionnaires(JSON.parse(saved));
      } else {
        setSavedQuestionnaires([]);
      }
      
      // Load saved chats
      const chatStorageKey = `collegeChats_${user.id}`;
      const savedChatsData = localStorage.getItem(chatStorageKey);
      if (savedChatsData) {
        setSavedChats(JSON.parse(savedChatsData));
      } else {
        setSavedChats([]);
      }
    }
  }, [user?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save questionnaires to localStorage (user-specific)
  const saveToLocalStorage = (questionnaires) => {
    if (user?.id) {
      const storageKey = `collegeQuestionnaires_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(questionnaires));
    }
  };

  // Save chats to localStorage (user-specific)
  const saveChatsToLocalStorage = (chats) => {
    if (user?.id) {
      const storageKey = `collegeChats_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(chats));
    }
  };

  // Extract college names from text
  // Validate and normalize college names using College Scorecard API
  const validateCollegeName = async (potentialName) => {
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        'school.name': potentialName,
        'fields': 'id,school.name',
        per_page: 5
      });

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Return the official College Scorecard name
        return data.results[0]['school.name'];
      }
      return null;
    } catch (error) {
      console.error('Error validating college name:', error);
      return null;
    }
  };

  const extractCollegeNames = async (text) => {
    try {
      // Step 1: Pre-process text with regex to clean and normalize formatting
      const cleanedText = text
        // Remove markdown formatting
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove extra punctuation around college names
        .replace(/([,;:])\s*([A-Z])/g, '$1 $2')
        // Normalize parentheses spacing
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        // Remove bullet points and list markers
        .replace(/^[\s]*[-•*]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .trim();
      
      // Step 2: Use AI service to extract college names from the cleaned text
      const extractionPrompt = `Analyze the following text and extract ALL college and university names mentioned.
Return ONLY a valid JSON array of college names in the exact order they appear in the text.
Include the full official name of each institution (e.g., "California Institute of Technology" not just "Caltech").
If a college has a common abbreviation in parentheses like "California Institute of Technology (Caltech)", use the full name.

Text to analyze:
"""
${cleanedText}
"""

Return format (JSON array only, no other text):
["College Name 1", "College Name 2", ...]

If no colleges are mentioned, return an empty array: []`;

      const extractedText = await aiService.generateContent(extractionPrompt, { model: 'lite' });
      
      // Parse the JSON response
      let collegeNames = [];
      try {
        // Remove markdown code blocks if present
        const cleanedJsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        collegeNames = JSON.parse(cleanedJsonText);
        
        // Ensure it's an array
        if (!Array.isArray(collegeNames)) {
          console.warn('Gemini did not return an array, attempting to extract from object');
          collegeNames = [];
        }
      } catch (parseError) {
        console.error('Error parsing Gemini extraction response:', parseError);
        console.log('Raw response:', extractedText);
        collegeNames = [];
      }
      
      // Remove duplicates while preserving order
      const uniqueCollegeNames = [...new Set(collegeNames)];
      
      // Validate and fetch full college data for each extracted college name
      const collegeDataResults = await Promise.all(
        uniqueCollegeNames.map(async (name) => {
          if (!name || typeof name !== 'string' || name.length < 3) {
            return null;
          }
          
          const validName = await validateCollegeName(name);
          if (validName) {
            // Fetch full college data immediately
            return await searchCollege(validName);
          }
          return null;
        })
      );
      
      // Filter out null results while preserving order
      return collegeDataResults.filter(college => college !== null);
      
    } catch (error) {
      console.error('Error in AI-based college extraction:', error);
      // Fallback: return empty array rather than crashing
      return [];
    }
  };

  // Start new chat
  const startNewChat = () => {
    if (!isAIConfigured) {
      alert('AI service is not configured. Please add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');
      return;
    }
    setChatMessages([{
      role: 'assistant',
      content: "Hi! I'm your college advisor assistant. Tell me about your college preferences, interests, and goals, and I'll help you find the perfect colleges for you. What are you looking for in a college?"
    }]);
    setMentionedColleges([]);
    setShowChat(true);
  };

  // Send message to AI service
  const sendMessage = async () => {
    if (!currentMessage.trim() || chatLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    
    // Add user message to chat
    const updatedMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      // Build conversation history for context
      const history = updatedMessages.slice(0, -1);
      
      // Add system context to help with college recommendations
      const prompt = `You are a helpful college advisor. The user is asking: "${userMessage}".
      Please provide specific college recommendations when appropriate, mentioning college names clearly.
      Focus on helping them find colleges that match their preferences, interests, and goals.`;
      
      const text = await aiService.chat(history, prompt);

      // Extract college data from response BEFORE displaying the message
      let collegeDataArray = [];
      try {
        collegeDataArray = await extractCollegeNames(text);

        if (collegeDataArray.length > 0) {
          setMentionedColleges(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newColleges = collegeDataArray.filter(college => !existingIds.has(college.id));
            return [...prev, ...newColleges];
          });
        }
      } catch (error) {
        console.error('Error extracting college data:', error);
      }

      // Add assistant response to chat AFTER college extraction completes
      const finalMessages = [...updatedMessages, { role: 'assistant', content: text }];
      setChatMessages(finalMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check for specific API errors
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      // Check if it's a rate limit error
      if (aiService.isRateLimitError(error)) {
        const currentProvider = aiService.getCurrentProvider();
        if (currentProvider === 'groq') {
          errorContent = '⚠️ **API Rate Limit Reached**\n\n' +
            'Both Gemini and Groq AI services have reached their rate limits.\n\n' +
            '**What you can do:**\n' +
            '• Wait a few minutes and try again\n' +
            '• The system will automatically retry with available services\n\n' +
            'We apologize for the inconvenience.';
        } else {
          errorContent = '🔄 **Switching to backup AI service...**\n\n' +
            'The primary AI service encountered a rate limit. The system has automatically switched to a backup service.\n\n' +
            'Please try sending your message again.';
        }
      }
      // Check if it's a 503 error (high demand/overload)
      else if (error.message && (
        error.message.includes('503') ||
        error.message.includes('high demand') ||
        error.message.includes('currently experiencing')
      )) {
        errorContent = '🌐 The AI service is currently experiencing high demand and is temporarily overloaded. This is usually temporary during peak usage times. Please try again in a few moments.';
      }
      
      const errorMessage = [...updatedMessages, {
        role: 'assistant',
        content: errorContent
      }];
      setChatMessages(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  // Save current chat
  const saveCurrentChat = () => {
    if (chatMessages.length === 0) {
      alert('No messages to save');
      return;
    }

    const chatName = prompt('Enter a name for this chat:');
    if (!chatName || !chatName.trim()) return;

    const newChat = {
      id: Date.now(),
      name: chatName.trim(),
      date: new Date().toISOString(),
      messages: chatMessages,
      colleges: mentionedColleges // Now stores full college data objects
    };

    const updated = [newChat, ...savedChats];
    setSavedChats(updated);
    saveChatsToLocalStorage(updated);
    
    alert('Chat saved successfully!');
  };

  // Load saved chat
  const loadChat = async (chat) => {
    setChatMessages(chat.messages);
    setShowChat(true);
    
    // If chat has stored colleges, use them
    if (chat.colleges && chat.colleges.length > 0) {
      setMentionedColleges(chat.colleges);
    } else {
      // For older chats without stored colleges, re-extract from all assistant messages
      setMentionedColleges([]);
      
      // Extract colleges from all assistant messages
      const allColleges = [];
      for (const message of chat.messages) {
        if (message.role === 'assistant') {
          try {
            const collegeDataArray = await extractCollegeNames(message.content);
            if (collegeDataArray.length > 0) {
              // Add new colleges, avoiding duplicates
              collegeDataArray.forEach(college => {
                if (!allColleges.find(c => c.id === college.id)) {
                  allColleges.push(college);
                }
              });
            }
          } catch (error) {
            console.error('Error extracting colleges from message:', error);
          }
        }
      }
      
      setMentionedColleges(allColleges);
      
      // Update the saved chat with extracted colleges for future loads
      if (allColleges.length > 0) {
        const updatedChat = { ...chat, colleges: allColleges };
        const updatedChats = savedChats.map(c => c.id === chat.id ? updatedChat : c);
        setSavedChats(updatedChats);
        saveChatsToLocalStorage(updatedChats);
      }
    }
  };

  // Delete chat
  const deleteChat = (id) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      const updated = savedChats.filter(c => c.id !== id);
      setSavedChats(updated);
      saveChatsToLocalStorage(updated);
    }
  };

  // Search for college in College Scorecard API
  const searchCollege = async (collegeName) => {
    try {
      // Since mentionedColleges now contains exact College Scorecard names,
      // we can search with exact match for better results
      const params = new URLSearchParams({
        api_key: API_KEY,
        'school.name': collegeName,
        'fields': 'id,school.name,school.city,school.state,school.school_url,latest.cost.tuition.in_state,latest.student.size,latest.admissions.admission_rate.overall,school.ownership',
        per_page: 5 // Get top 5 to find exact match
      });

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Try to find exact match first
        const exactMatch = data.results.find(
          college => college['school.name'].toLowerCase() === collegeName.toLowerCase()
        );
        return exactMatch || data.results[0];
      }
      return null;
    } catch (error) {
      console.error('Error searching college:', error);
      return null;
    }
  };

  // Handle college favorite from sidebar
  const handleCollegeFavorite = (collegeData) => {
    if (collegeData) {
      toggleFavorite(collegeData);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Start new questionnaire
  const startNewQuestionnaire = () => {
    setResponses({
      preferredStates: [],
      preferredRegion: '',
      locationImportance: 'medium',
      maxTuition: '',
      tuitionImportance: 'high',
      preferredSize: '',
      sizeImportance: 'medium',
      desiredPrograms: '',
      academicRigor: 'medium',
      campusSetting: '',
      acceptanceRatePreference: '',
      questionnaireName: '',
      dateCompleted: ''
    });
    setCurrentStep(1);
    setShowQuestionnaire(true);
    setShowResults(false);
    setRecommendations([]);
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  // Handle state selection
  const handleStateToggle = (state) => {
    setResponses(prev => {
      const states = prev.preferredStates.includes(state)
        ? prev.preferredStates.filter(s => s !== state)
        : [...prev.preferredStates, state];
      return { ...prev, preferredStates: states };
    });
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Fetch college recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        per_page: 20,
        'fields': 'id,school.name,school.city,school.state,school.school_url,school.zip,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.student.size,latest.admissions.admission_rate.overall,latest.academics.program_percentage,school.locale,school.region_id'
      });

      // Apply filters based on responses
      if (responses.preferredStates.length > 0) {
        // API doesn't support multiple states directly, so we'll fetch for first state
        params.append('school.state', responses.preferredStates[0]);
      }
      
      if (responses.preferredRegion) {
        params.append('school.region_id', responses.preferredRegion);
      }
      
      if (responses.maxTuition) {
        params.append('latest.cost.tuition.in_state__range', `..${responses.maxTuition}`);
      }
      
      if (responses.preferredSize) {
        params.append('latest.student.size__range', responses.preferredSize);
      }

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();

      if (data.results) {
        // Score and sort colleges based on preferences
        const scoredColleges = data.results.map(college => ({
          ...college,
          matchScore: calculateMatchScore(college)
        })).sort((a, b) => b.matchScore - a.matchScore);

        setRecommendations(scoredColleges.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate match score based on preferences
  const calculateMatchScore = (college) => {
    let score = 0;
    let maxScore = 0;

    // Location scoring
    if (responses.locationImportance !== 'low') {
      maxScore += responses.locationImportance === 'high' ? 30 : 20;
      if (responses.preferredStates.includes(college['school.state'])) {
        score += responses.locationImportance === 'high' ? 30 : 20;
      }
    }

    // Tuition scoring
    if (responses.tuitionImportance !== 'low' && responses.maxTuition) {
      maxScore += responses.tuitionImportance === 'high' ? 40 : 25;
      const tuition = college['latest.cost.tuition.in_state'];
      if (tuition && tuition <= responses.maxTuition) {
        const tuitionRatio = 1 - (tuition / responses.maxTuition);
        score += (responses.tuitionImportance === 'high' ? 40 : 25) * tuitionRatio;
      }
    }

    // Size scoring
    if (responses.sizeImportance !== 'low' && responses.preferredSize) {
      maxScore += responses.sizeImportance === 'high' ? 30 : 20;
      const size = college['latest.student.size'];
      if (size) {
        const [min, max] = responses.preferredSize.split('..').map(s => s ? parseInt(s) : null);
        if ((min === null || size >= min) && (max === null || size <= max)) {
          score += responses.sizeImportance === 'high' ? 30 : 20;
        }
      }
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 50;
  };

  // Submit questionnaire
  const submitQuestionnaire = async () => {
    if (!responses.questionnaireName.trim()) {
      alert('Please provide a name for this questionnaire');
      return;
    }

    await fetchRecommendations();

    const newQuestionnaire = {
      id: Date.now(),
      name: responses.questionnaireName,
      date: new Date().toISOString(),
      responses: { ...responses },
      recommendations: []
    };

    const updated = [newQuestionnaire, ...savedQuestionnaires];
    setSavedQuestionnaires(updated);
    saveToLocalStorage(updated);
    
    setShowQuestionnaire(false);
    setShowResults(true);
  };

  // Delete questionnaire
  const deleteQuestionnaire = (id) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      const updated = savedQuestionnaires.filter(q => q.id !== id);
      setSavedQuestionnaires(updated);
      saveToLocalStorage(updated);
    }
  };

  // View saved questionnaire
  const viewQuestionnaire = async (questionnaire) => {
    setResponses(questionnaire.responses);
    setLoading(true);
    await fetchRecommendations();
    setShowResults(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Get region name
  const getRegionName = (regionId) => {
    const regions = {
      0: 'U.S. Service Schools',
      1: 'New England',
      2: 'Mid East',
      3: 'Great Lakes',
      4: 'Plains',
      5: 'Southeast',
      6: 'Southwest',
      7: 'Rocky Mountains',
      8: 'Far West',
      9: 'Outlying Areas'
    };
    return regions[regionId] || 'Unknown';
  };

  // Render questionnaire step
  const renderQuestionnaireStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h4 className="mb-4">Step 1: Location Preferences</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Preferred States (Select all that apply)</Form.Label>
              <Row>
                {[
                  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE',
                  'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
                  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
                  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
                  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
                  'WI', 'WY'
                ].map(state => (
                  <Col md={3} key={state} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label={state}
                      checked={responses.preferredStates.includes(state)}
                      onChange={() => handleStateToggle(state)}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Preferred Region</Form.Label>
              <Form.Select
                value={responses.preferredRegion}
                onChange={(e) => handleInputChange('preferredRegion', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="1">New England</option>
                <option value="2">Mid East</option>
                <option value="3">Great Lakes</option>
                <option value="4">Plains</option>
                <option value="5">Southeast</option>
                <option value="6">Southwest</option>
                <option value="7">Rocky Mountains</option>
                <option value="8">Far West</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is location to you?</Form.Label>
              <Form.Select
                value={responses.locationImportance}
                onChange={(e) => handleInputChange('locationImportance', e.target.value)}
              >
                <option value="low">Low - I'm flexible</option>
                <option value="medium">Medium - Somewhat important</option>
                <option value="high">High - Very important</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 className="mb-4">Step 2: Cost & Financial Considerations</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Maximum Annual Tuition (In-State)</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 50000"
                value={responses.maxTuition}
                onChange={(e) => handleInputChange('maxTuition', e.target.value)}
              />
              <Form.Text className="text-muted">
                Leave blank if cost is not a limiting factor
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is tuition cost to you?</Form.Label>
              <Form.Select
                value={responses.tuitionImportance}
                onChange={(e) => handleInputChange('tuitionImportance', e.target.value)}
              >
                <option value="low">Low - Cost is not a major concern</option>
                <option value="medium">Medium - I'd like to keep costs reasonable</option>
                <option value="high">High - Cost is a critical factor</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 3:
        return (
          <div>
            <h4 className="mb-4">Step 3: School Size & Environment</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Preferred School Size</Form.Label>
              <Form.Select
                value={responses.preferredSize}
                onChange={(e) => handleInputChange('preferredSize', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="0..2000">Small {'(<'} 2,000 students)</option>
                <option value="2000..10000">Medium (2,000-10,000 students)</option>
                <option value="10000..">Large {'(>'} 10,000 students)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>How important is school size to you?</Form.Label>
              <Form.Select
                value={responses.sizeImportance}
                onChange={(e) => handleInputChange('sizeImportance', e.target.value)}
              >
                <option value="low">Low - Size doesn't matter much</option>
                <option value="medium">Medium - I have some preferences</option>
                <option value="high">High - Size is very important</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Campus Setting Preference</Form.Label>
              <Form.Select
                value={responses.campusSetting}
                onChange={(e) => handleInputChange('campusSetting', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="city">City - Urban environment</option>
                <option value="suburban">Suburban - Mix of urban and rural</option>
                <option value="rural">Rural - Countryside setting</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 4:
        return (
          <div>
            <h4 className="mb-4">Step 4: Academic Preferences</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Desired Programs/Majors</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g., Computer Science, Business, Engineering"
                value={responses.desiredPrograms}
                onChange={(e) => handleInputChange('desiredPrograms', e.target.value)}
              />
              <Form.Text className="text-muted">
                List any specific programs or fields of study you're interested in
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Academic Rigor Preference</Form.Label>
              <Form.Select
                value={responses.academicRigor}
                onChange={(e) => handleInputChange('academicRigor', e.target.value)}
              >
                <option value="low">Relaxed - More balanced approach</option>
                <option value="medium">Moderate - Standard academic challenge</option>
                <option value="high">Rigorous - Highly competitive academics</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Acceptance Rate Preference</Form.Label>
              <Form.Select
                value={responses.acceptanceRatePreference}
                onChange={(e) => handleInputChange('acceptanceRatePreference', e.target.value)}
              >
                <option value="">No Preference</option>
                <option value="high">Higher acceptance rate {'(>'} 50%)</option>
                <option value="medium">Moderate acceptance rate (25-50%)</option>
                <option value="low">Selective {'(<'} 25%)</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      case 5:
        return (
          <div>
            <h4 className="mb-4">Step 5: Name Your Questionnaire</h4>
            
            <Form.Group className="mb-4">
              <Form.Label>Questionnaire Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., My Dream College Search - June 2026"
                value={responses.questionnaireName}
                onChange={(e) => handleInputChange('questionnaireName', e.target.value)}
              />
              <Form.Text className="text-muted">
                Give this questionnaire a memorable name so you can find it later
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <Alert.Heading>Review Your Preferences</Alert.Heading>
              <ul className="mb-0">
                <li><strong>Location:</strong> {responses.preferredStates.length > 0 ? responses.preferredStates.join(', ') : 'No preference'}</li>
                <li><strong>Max Tuition:</strong> {responses.maxTuition ? formatCurrency(responses.maxTuition) : 'No limit'}</li>
                <li><strong>School Size:</strong> {responses.preferredSize ? responses.preferredSize.replace('..', ' to ').replace('0', 'Under 2,000').replace('10000', 'Over 10,000') : 'No preference'}</li>
                <li><strong>Programs:</strong> {responses.desiredPrograms || 'Not specified'}</li>
              </ul>
            </Alert>
          </div>
        );

      default:
        return null;
    }
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
      
      <Container className="mt-4 mb-5">
        <h1 className="mb-4">College Matchmaker</h1>
        <p className="lead mb-4">
          Find your perfect college match by answering a few questions about your preferences.
        </p>

        {/* Start New Questionnaire and Chat Buttons */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="text-center py-4">
            <h4 className="mb-3">Ready to find your perfect college?</h4>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button
                variant="primary"
                size="lg"
                onClick={startNewQuestionnaire}
                disabled={showQuestionnaire}
              >
                <i className="bi bi-list-check me-2"></i>
                Start Questionnaire
              </Button>
              <Button
                variant="success"
                size="lg"
                onClick={startNewChat}
                disabled={showChat}
              >
                <i className="bi bi-chat-dots me-2"></i>
                Chat with AI Advisor
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Questionnaire Modal */}
        <Modal 
          show={showQuestionnaire} 
          onHide={() => setShowQuestionnaire(false)} 
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>College Matchmaker Questionnaire</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ProgressBar 
              now={(currentStep / 5) * 100} 
              label={`Step ${currentStep} of 5`}
              className="mb-4"
            />
            {renderQuestionnaireStep()}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 5 ? (
              <Button variant="primary" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={submitQuestionnaire}
                disabled={!responses.questionnaireName.trim()}
              >
                Submit & Get Recommendations
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Results Modal */}
        <Modal 
          show={showResults} 
          onHide={() => setShowResults(false)} 
          size="xl"
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>Your College Recommendations</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Finding your perfect matches...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <Alert variant="success">
                  <strong>Great news!</strong> We found {recommendations.length} colleges that match your preferences.
                </Alert>
                <Row>
                  {recommendations.map((college, index) => (
                    <Col key={college.id} md={6} className="mb-4">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0" style={{ flex: 1 }}>
                              {index + 1}. {college['school.name']}
                            </Card.Title>
                            <div className="d-flex align-items-center gap-2">
                              <Button
                                variant={isFavorite(college.id) ? "danger" : "outline-danger"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(college);
                                }}
                                title={isFavorite(college.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <i className={`bi bi-heart${isFavorite(college.id) ? '-fill' : ''}`}></i>
                              </Button>
                              <Badge bg="success">
                                {college.matchScore.toFixed(0)}% Match
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <strong>📍 Location:</strong><br />
                            {college['school.city']}, {college['school.state']}
                          </div>
                          
                          <div className="mb-2">
                            <strong>💰 In-State Tuition:</strong><br />
                            {formatCurrency(college['latest.cost.tuition.in_state'])}
                          </div>
                          
                          <div className="mb-2">
                            <strong>👥 Student Size:</strong><br />
                            {formatNumber(college['latest.student.size'])}
                          </div>
                          
                          {college['latest.admissions.admission_rate.overall'] && (
                            <div className="mb-2">
                              <strong>📊 Acceptance Rate:</strong><br />
                              {(college['latest.admissions.admission_rate.overall'] * 100).toFixed(1)}%
                            </div>
                          )}

                          {college['school.school_url'] && (
                            <a
                              href={college['school.school_url'].startsWith('http')
                                ? college['school.school_url']
                                : `https://${college['school.school_url']}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary mt-2"
                            >
                              Visit Website
                            </a>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <Alert variant="warning">
                No colleges found matching your criteria. Try adjusting your preferences.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResults(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Chat Modal */}
        <Modal
          show={showChat}
          onHide={() => setShowChat(false)}
          size="xl"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>AI College Advisor Chat</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ height: '70vh', display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#f8f9fa'
              }}>
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-3 ${message.role === 'user' ? 'text-end' : ''}`}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        maxWidth: '80%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        backgroundColor: message.role === 'user' ? '#0d6efd' : '#ffffff',
                        color: message.role === 'user' ? '#ffffff' : '#000000',
                        textAlign: 'left',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <strong>{message.role === 'user' ? 'You' : 'AI Advisor'}:</strong>
                      <div style={{ marginTop: '0.5rem' }}>
                        {message.role === 'user' ? (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                        ) : (
                          formatGeminiText(message.content)
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-center">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">AI is thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <InputGroup>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Ask about colleges, programs, locations, or any preferences..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={chatLoading}
                />
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={chatLoading || !currentMessage.trim()}
                >
                  <i className="bi bi-send"></i> Send
                </Button>
              </InputGroup>
            </div>

            {/* College Sidebar */}
            {mentionedColleges.length > 0 && (
              <div
                style={{
                  width: '300px',
                  borderLeft: '1px solid #dee2e6',
                  paddingLeft: '1rem',
                  overflowY: 'auto'
                }}
              >
                <h5 className="mb-3">
                  <i className="bi bi-building me-2"></i>
                  Mentioned Colleges
                </h5>

                <ListGroup>
                  {mentionedColleges.map((collegeData, index) => {
                    const isCollegeFavorited = isFavorite(collegeData.id);

                    return (
                      <ListGroup.Item
                        key={collegeData.id || index}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {collegeData['school.name']}
                          </div>
                          <small className="text-muted">
                            {collegeData['school.city']}, {collegeData['school.state']}
                          </small>
                        </div>

                        <Button
                          variant={isCollegeFavorited ? "danger" : "outline-danger"}
                          size="sm"
                          onClick={() => handleCollegeFavorite(collegeData)}
                          title={isCollegeFavorited ? "Remove from favorites" : "Add to favorites"}
                        >
                          <i
                            className={
                              isCollegeFavorited
                                ? "bi bi-heart-fill"
                                : "bi bi-heart"
                            }
                          />
                        </Button>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="info" onClick={saveCurrentChat}>
              <i className="bi bi-save me-2"></i>
              Save Chat
            </Button>
            <Button variant="secondary" onClick={() => setShowChat(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Saved Questionnaires and Chats */}
        <div className="mt-5">
          <h3 className="mb-3">Your History</h3>
          
          {/* Saved Chats Section */}
          {savedChats.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-3">
                <i className="bi bi-chat-dots me-2"></i>
                Saved AI Chats
              </h4>
              <Accordion>
                {savedChats.map((chat, index) => (
                  <Accordion.Item eventKey={`chat-${index}`} key={chat.id}>
                    <Accordion.Header>
                      <div className="d-flex justify-content-between align-items-center w-100 me-3">
                        <div>
                          <Badge bg="success" className="me-2">Chat</Badge>
                          <strong>{chat.name}</strong>
                          <br />
                          <small className="text-muted">
                            {new Date(chat.date).toLocaleDateString()} • {chat.messages.length} messages
                            {chat.colleges && chat.colleges.length > 0 && ` • ${chat.colleges.length} colleges mentioned`}
                          </small>
                        </div>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={8}>
                          <h5>Chat Preview:</h5>
                          <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '0.375rem'
                          }}>
                            {chat.messages.slice(0, 4).map((msg, idx) => (
                              <div key={idx} className="mb-2">
                                <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                                <div style={{ fontSize: '0.9rem' }}>
                                  {msg.content.substring(0, 150)}
                                  {msg.content.length > 150 ? '...' : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                          {chat.colleges && chat.colleges.length > 0 && (
                            <div className="mt-3">
                              <strong>Colleges Mentioned:</strong>
                              <div className="mt-2">
                                {chat.colleges.map((college, idx) => (
                                  <Badge key={idx} bg="secondary" className="me-2 mb-2">
                                    {typeof college === 'string' ? college : college['school.name']}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </Col>
                        <Col md={4} className="text-end">
                          <Button
                            variant="success"
                            className="mb-2 w-100"
                            onClick={() => loadChat(chat)}
                          >
                            <i className="bi bi-chat-dots me-2"></i>
                            Open Chat
                          </Button>
                          <Button
                            variant="danger"
                            className="w-100"
                            onClick={() => deleteChat(chat.id)}
                          >
                            <i className="bi bi-trash me-2"></i>
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}

          {/* Saved Questionnaires Section */}
          <h4 className="mb-3">
            <i className="bi bi-list-check me-2"></i>
            Saved Questionnaires
          </h4>
          {savedQuestionnaires.length === 0 ? (
            <Alert variant="info">
              You haven't completed any questionnaires yet. Start one above to get personalized college recommendations!
            </Alert>
          ) : (
            <Accordion>
              {savedQuestionnaires.map((questionnaire, index) => (
                <Accordion.Item eventKey={index.toString()} key={questionnaire.id}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <div>
                        <strong>{questionnaire.name}</strong>
                        <br />
                        <small className="text-muted">
                          Completed: {new Date(questionnaire.date).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={8}>
                        <h5>Your Preferences:</h5>
                        <ul>
                          <li>
                            <strong>Preferred States:</strong>{' '}
                            {questionnaire.responses.preferredStates.length > 0
                              ? questionnaire.responses.preferredStates.join(', ')
                              : 'No preference'}
                          </li>
                          <li>
                            <strong>Preferred Region:</strong>{' '}
                            {questionnaire.responses.preferredRegion
                              ? getRegionName(parseInt(questionnaire.responses.preferredRegion))
                              : 'No preference'}
                          </li>
                          <li>
                            <strong>Max Tuition:</strong>{' '}
                            {questionnaire.responses.maxTuition
                              ? formatCurrency(questionnaire.responses.maxTuition)
                              : 'No limit'}
                          </li>
                          <li>
                            <strong>School Size:</strong>{' '}
                            {questionnaire.responses.preferredSize || 'No preference'}
                          </li>
                          <li>
                            <strong>Desired Programs:</strong>{' '}
                            {questionnaire.responses.desiredPrograms || 'Not specified'}
                          </li>
                        </ul>
                      </Col>
                      <Col md={4} className="text-end">
                        <Button
                          variant="primary"
                          className="mb-2 w-100"
                          onClick={() => viewQuestionnaire(questionnaire)}
                        >
                          View Recommendations
                        </Button>
                        <Button
                          variant="danger"
                          className="w-100"
                          onClick={() => deleteQuestionnaire(questionnaire.id)}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      </Container>
    </>
  );
}

// Made with Bob
