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
  InputGroup,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import aiService from '../services/aiService';
import ProfileDropdown from '../components/ProfileDropdown';

// US States for multiselect dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // State management
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedQuestionnaires, setSavedQuestionnaires] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
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
    
    // Cost preferences
    maxTuition: '',
    
    // Size preferences
    preferredSize: '',
    
    // Academic preferences
    desiredPrograms: '',
    academicRigor: 'medium',
    
    // Additional preferences
    campusSetting: '',
    acceptanceRatePreference: '',
    
    // AI preferences
    useAI: true, // Default to true for enhanced recommendations
    
    // Metadata
    questionnaireName: '',
    dateCompleted: ''
  });

  // State for multiselect dropdown
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const stateDropdownRef = useRef(null);

  // College Scorecard API configuration
  const API_KEY = import.meta.env.VITE_COLLEGE_API_KEY;
  const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

  // AI Service (with Gemini/Groq fallback)
  const isAIConfigured = aiService.isConfigured();

  // Handle clicks outside state dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
This processed text will be used to import college data from the College Scorecard API, which accepts exact names only. 
Be careful, when names like California Institute of Technology are mentioned, recommend the correct school, not a similar name like California Institute of Arts and Technology.

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
      useAI: true, // Default to true for enhanced recommendations
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
      let allColleges = [];
      
      // If multiple states are selected, fetch for each state
      const statesToFetch = responses.preferredStates.length > 0
        ? responses.preferredStates
        : ['']; // Empty string to fetch all states if none selected
      
      // Fetch colleges for each state
      for (const state of statesToFetch) {
        let page = 0;
        let hasMorePages = true;
        
        while (hasMorePages) {
          const params = new URLSearchParams({
            api_key: API_KEY,
            per_page: 100, // Maximum allowed by API
            page: page,
            'fields': 'id,school.name,school.city,school.state,school.school_url,school.zip,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.student.size,latest.admissions.admission_rate.overall,latest.academics.program_percentage,school.locale,school.region_id'
          });

          // Apply state filter if specified
          if (state) {
            params.append('school.state', state);
          }
          
          // Apply region filter if specified
          if (responses.preferredRegion) {
            params.append('school.region_id', responses.preferredRegion);
          }
          
          // Apply tuition filter if specified
          if (responses.maxTuition) {
            params.append('latest.cost.tuition.in_state__range', `..${responses.maxTuition}`);
          }
          
          // Apply size filter if specified
          if (responses.preferredSize) {
            params.append('latest.student.size__range', responses.preferredSize);
          }

          const response = await fetch(`${BASE_URL}?${params}`);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            allColleges = [...allColleges, ...data.results];
            
            // Check if there are more pages
            if (data.metadata && data.metadata.page < data.metadata.total - 1) {
              page++;
            } else {
              hasMorePages = false;
            }
          } else {
            hasMorePages = false;
          }
        }
      }

      // Remove duplicates (in case of overlapping results)
      const uniqueColleges = Array.from(
        new Map(allColleges.map(college => [college.id, college])).values()
      );

      // Apply client-side filtering for criteria not supported by API
      let filteredColleges = uniqueColleges.filter(college => {
        // Filter by acceptance rate preference
        if (responses.acceptanceRatePreference && college['latest.admissions.admission_rate.overall']) {
          const rate = college['latest.admissions.admission_rate.overall'];
          if (responses.acceptanceRatePreference === 'high' && rate <= 0.5) return false;
          if (responses.acceptanceRatePreference === 'medium' && (rate < 0.25 || rate > 0.5)) return false;
          if (responses.acceptanceRatePreference === 'low' && rate >= 0.25) return false;
        }
        
        // Filter by campus setting if specified
        if (responses.campusSetting && college['school.locale']) {
          const locale = college['school.locale'];
          // Locale codes: 11-13 = City, 21-23 = Suburban, 31-33 = Town, 41-43 = Rural
          if (responses.campusSetting === 'city' && (locale < 11 || locale > 13)) return false;
          if (responses.campusSetting === 'suburban' && (locale < 21 || locale > 23)) return false;
          if (responses.campusSetting === 'rural' && (locale < 41 || locale > 43)) return false;
        }
        
        return true;
      });

      // Score and sort colleges based on all preferences
      let scoredColleges = filteredColleges.map(college => ({
        ...college,
        matchScore: calculateMatchScore(college)
      })).sort((a, b) => b.matchScore - a.matchScore);

      // Enhance with AI-based program rigor scoring if programs are specified and AI is enabled
      if (responses.desiredPrograms && responses.desiredPrograms.trim() && responses.useAI && isAIConfigured) {
        scoredColleges = await enhanceRecommendationsWithAI(scoredColleges);
      }

      // Update state and return the results
      setRecommendations(scoredColleges);
      return scoredColleges;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert('Failed to fetch recommendations. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Calculate match score based on preferences
  const calculateMatchScore = (college) => {
    let score = 0;
    let maxScore = 0;

    // Location scoring (states) - 25 points
    if (responses.preferredStates.length > 0) {
      maxScore += 25;
      if (responses.preferredStates.includes(college['school.state'])) {
        score += 25;
      }
    }

    // Region scoring - 10 points
    if (responses.preferredRegion && college['school.region_id']) {
      maxScore += 10;
      if (college['school.region_id'].toString() === responses.preferredRegion) {
        score += 10;
      }
    }

    // Tuition scoring - 25 points
    if (responses.maxTuition) {
      maxScore += 25;
      const tuition = college['latest.cost.tuition.in_state'];
      if (tuition && tuition <= responses.maxTuition) {
        const tuitionRatio = 1 - (tuition / responses.maxTuition);
        score += 25 * tuitionRatio;
      }
    }

    // Size scoring - 15 points
    if (responses.preferredSize) {
      maxScore += 15;
      const size = college['latest.student.size'];
      if (size) {
        const [min, max] = responses.preferredSize.split('..').map(s => s ? parseInt(s) : null);
        if ((min === null || size >= min) && (max === null || size <= max)) {
          score += 15;
        }
      }
    }

    // Campus setting scoring
    if (responses.campusSetting && college['school.locale']) {
      maxScore += 10;
      const locale = college['school.locale'];
      let matches = false;
      
      if (responses.campusSetting === 'city' && locale >= 11 && locale <= 13) matches = true;
      if (responses.campusSetting === 'suburban' && locale >= 21 && locale <= 23) matches = true;
      if (responses.campusSetting === 'rural' && locale >= 41 && locale <= 43) matches = true;
      
      if (matches) score += 10;
    }

    // Academic rigor scoring (based on acceptance rate as proxy)
    if (responses.academicRigor && college['latest.admissions.admission_rate.overall']) {
      maxScore += 15;
      const admissionRate = college['latest.admissions.admission_rate.overall'];
      
      if (responses.academicRigor === 'high' && admissionRate < 0.25) {
        score += 15; // Highly selective schools
      } else if (responses.academicRigor === 'medium' && admissionRate >= 0.25 && admissionRate <= 0.6) {
        score += 15; // Moderately selective schools
      } else if (responses.academicRigor === 'low' && admissionRate > 0.6) {
        score += 15; // Less selective schools
      }
    }

    // Acceptance rate preference scoring
    if (responses.acceptanceRatePreference && college['latest.admissions.admission_rate.overall']) {
      maxScore += 10;
      const rate = college['latest.admissions.admission_rate.overall'];
      
      if (responses.acceptanceRatePreference === 'high' && rate > 0.5) {
        score += 10;
      } else if (responses.acceptanceRatePreference === 'medium' && rate >= 0.25 && rate <= 0.5) {
        score += 10;
      } else if (responses.acceptanceRatePreference === 'low' && rate < 0.25) {
        score += 10;
      }
    }

    // Programs/majors scoring (basic keyword matching if programs are specified)
    if (responses.desiredPrograms && responses.desiredPrograms.trim()) {
      maxScore += 10;
      // This is a simplified scoring - in a real implementation, you'd want to
      // match against actual program data from the API
      // For now, we give partial credit to all schools
      score += 5;
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 50;
  };

  // AI-enhanced program rigor scoring
  const enhanceRecommendationsWithAI = async (colleges) => {
    if (!responses.desiredPrograms || !responses.desiredPrograms.trim() || !isAIConfigured) {
      return colleges;
    }

    try {
      setLoading(true);
      const prompt = `You are a college admissions expert. Given the following list of colleges and a student's desired programs/majors: "${responses.desiredPrograms}", analyze each college's strength and rigor in those specific programs.

For each college, provide a program strength score from 0-20 based on:
1. Reputation and ranking in the specified fields
2. Research opportunities and facilities
3. Faculty expertise
4. Career outcomes for graduates in those programs

Return ONLY a valid JSON array with this exact format:
[
  {"name": "College Name", "programScore": 15},
  {"name": "Another College", "programScore": 18}
]

Colleges to analyze:
${colleges.slice(0, 50).map(c => c['school.name']).join('\n')}`;

      const response = await aiService.generateContent(prompt, { temperature: 0.3, maxTokens: 2000 });
      
      // Parse AI response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('AI response did not contain valid JSON array');
        return colleges;
      }

      const programScores = JSON.parse(jsonMatch[0]);
      
      // Create a map of college names to scores
      const scoreMap = new Map();
      programScores.forEach(item => {
        scoreMap.set(item.name.toLowerCase().trim(), item.programScore);
      });

      // Enhance colleges with program scores
      const enhanced = colleges.map(college => {
        const collegeName = college['school.name'].toLowerCase().trim();
        const programScore = scoreMap.get(collegeName) || 0;
        
        // Recalculate match score with program component
        const baseScore = college.matchScore;
        const maxPossibleBase = 100;
        const maxWithProgram = 120; // 100 base + 20 program
        
        const enhancedScore = ((baseScore + programScore) / maxWithProgram) * 100;
        
        return {
          ...college,
          matchScore: enhancedScore,
          programScore: programScore
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      return enhanced;
    } catch (error) {
      console.error('Error enhancing recommendations with AI:', error);
      return colleges;
    } finally {
      setLoading(false);
    }
  };

  // Submit questionnaire
  const submitQuestionnaire = async () => {
    if (!responses.questionnaireName.trim()) {
      alert('Please provide a name for this questionnaire');
      return;
    }

    setLoadingMessage('Processing your preferences with AI Matchmaker...');
    const fetchedRecommendations = await fetchRecommendations();

    // Save the AI-enhanced recommendations to avoid re-fetching
    const newQuestionnaire = {
      id: Date.now(),
      name: responses.questionnaireName,
      date: new Date().toISOString(),
      responses: { ...responses },
      recommendations: fetchedRecommendations, // Cache the AI-enhanced results
      cachedAt: new Date().toISOString() // Track when results were cached
    };

    const updated = [newQuestionnaire, ...savedQuestionnaires];
    setSavedQuestionnaires(updated);
    saveToLocalStorage(updated);
    
    setShowQuestionnaire(false);
    setShowResults(true);
    setLoadingMessage('');
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
    
    // Check if we have cached recommendations
    if (questionnaire.recommendations && questionnaire.recommendations.length > 0) {
      // Use cached results to avoid rate limiting
      console.log('Using cached recommendations from:', questionnaire.cachedAt);
      setRecommendations(questionnaire.recommendations);
      setShowResults(true);
    } else {
      // No cache available, fetch fresh recommendations
      setLoadingMessage('Loading your recommendations with AI Matchmaker...');
      setLoading(true);
      const fetchedRecommendations = await fetchRecommendations();
      
      // Update the questionnaire with the new recommendations
      const updated = savedQuestionnaires.map(q =>
        q.id === questionnaire.id
          ? { ...q, recommendations: fetchedRecommendations, cachedAt: new Date().toISOString() }
          : q
      );
      setSavedQuestionnaires(updated);
      saveToLocalStorage(updated);
      
      setShowResults(true);
      setLoadingMessage('');
    }
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
            
            <Form.Group className="mb-4" ref={stateDropdownRef}>
              <Form.Label>Preferred States (Select multiple)</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Click to select states..."
                  value={responses.preferredStates.length > 0
                    ? `${responses.preferredStates.length} state${responses.preferredStates.length > 1 ? 's' : ''} selected`
                    : 'No states selected'}
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                  readOnly
                  style={{ cursor: 'pointer' }}
                />
                {showStateDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '0.25rem',
                      zIndex: 1000,
                      marginTop: '2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ padding: '0.5rem' }}>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setResponses(prev => ({ ...prev, preferredStates: [] }))}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setResponses(prev => ({ ...prev, preferredStates: US_STATES.map(s => s.code) }))}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Select All
                      </Button>
                    </div>
                    {US_STATES.map(state => (
                      <div
                        key={state.code}
                        style={{
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          backgroundColor: responses.preferredStates.includes(state.code) ? '#e7f3ff' : 'white',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onClick={() => handleStateToggle(state.code)}
                      >
                        <Form.Check
                          type="checkbox"
                          label={`${state.name} (${state.code})`}
                          checked={responses.preferredStates.includes(state.code)}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Form.Text className="text-muted">
                {responses.preferredStates.length > 0 && (
                  <div className="mt-2">
                    Selected: {responses.preferredStates.join(', ')}
                  </div>
                )}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Preferred Region (Optional)</Form.Label>
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
                Leave blank if cost is not a limiting factor. Schools within your budget will be prioritized in recommendations.
              </Form.Text>
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

            {/* AI Enhancement Toggle */}
            {isAIConfigured && responses.desiredPrograms && responses.desiredPrograms.trim() && (
              <Form.Group className="mb-4">
                <Card bg="light" className="border-primary">
                  <Card.Body>
                    <div className="d-flex align-items-start">
                      <Form.Check
                        type="switch"
                        id="ai-toggle"
                        checked={responses.useAI}
                        onChange={(e) => handleInputChange('useAI', e.target.checked)}
                        className="me-3"
                        style={{ fontSize: '1.2rem' }}
                      />
                      <div className="flex-grow-1">
                        <Form.Label htmlFor="ai-toggle" className="mb-2" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                          Use AI-Enhanced Recommendations
                        </Form.Label>
                        <div className="text-muted small">
                          <p className="mb-2">
                            <strong>✨ AI Enhancement:</strong> Uses advanced AI to analyze program quality and match your academic interests more precisely.
                          </p>
                          <p className="mb-2">
                            <strong>⚡ Performance:</strong> AI analysis is more thorough but takes longer to process (15-30 seconds).
                          </p>
                          <p className="mb-0">
                            <strong>⚠️ Rate Limits:</strong> AI services may have usage limits. If you encounter rate limiting, try again later or disable this option.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Form.Group>
            )}

            <Alert variant="info">
              <Alert.Heading>Review Your Preferences</Alert.Heading>
              <ul className="mb-0">
                <li><strong>Location:</strong> {responses.preferredStates.length > 0 ? responses.preferredStates.join(', ') : 'No preference'}</li>
                <li><strong>Max Tuition:</strong> {responses.maxTuition ? formatCurrency(responses.maxTuition) : 'No limit'}</li>
                <li><strong>School Size:</strong> {responses.preferredSize ? responses.preferredSize.replace('..', ' to ').replace('0', 'Under 2,000').replace('10000', 'Over 10,000') : 'No preference'}</li>
                <li><strong>Programs:</strong> {responses.desiredPrograms || 'Not specified'}</li>
                {isAIConfigured && responses.desiredPrograms && responses.desiredPrograms.trim() && (
                  <li><strong>AI Enhancement:</strong> {responses.useAI ? 'Enabled ✨' : 'Disabled'}</li>
                )}
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
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">CollegeHub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/matchmaker" style={{ color: '#ffffff' }}>Matchmaker</Nav.Link>
              <Nav.Link as={Link} to="/explore">Explore</Nav.Link>
              <Nav.Link as={Link} to="/analyzer">Analysis</Nav.Link>
              <div className="ms-2">
                <ProfileDropdown />
              </div>
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

        {/* Loading Overlay Modal */}
        <Modal
          show={loading && loadingMessage}
          backdrop="static"
          keyboard={false}
          centered
        >
          <Modal.Body className="text-center py-5">
            <div className="mb-4">
              <Spinner
                animation="border"
                role="status"
                style={{
                  width: '4rem',
                  height: '4rem',
                  borderWidth: '0.3rem',
                  color: '#0d6efd'
                }}
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
            <h4 className="mb-3">
              <i className="bi bi-stars me-2"></i>
              AI Matchmaker at Work
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
              {loadingMessage}
            </p>
            <div className="mt-4">
              <div className="d-flex justify-content-center gap-2">
                <div
                  className="spinner-grow spinner-grow-sm text-primary"
                  role="status"
                  style={{ animationDelay: '0s' }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div
                  className="spinner-grow spinner-grow-sm text-primary"
                  role="status"
                  style={{ animationDelay: '0.2s' }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div
                  className="spinner-grow spinner-grow-sm text-primary"
                  role="status"
                  style={{ animationDelay: '0.4s' }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </Modal.Body>
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
                <div className="mb-4">
                  <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
                <h5 className="mb-3">Finding your perfect matches...</h5>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <Spinner animation="grow" size="sm" variant="primary" />
                  <Spinner animation="grow" size="sm" variant="primary" style={{ animationDelay: '0.2s' }} />
                  <Spinner animation="grow" size="sm" variant="primary" style={{ animationDelay: '0.4s' }} />
                </div>
                <p className="text-muted">
                  {responses.desiredPrograms && responses.desiredPrograms.trim() && isAIConfigured
                    ? 'Analyzing colleges and evaluating program strengths with AI...'
                    : 'Analyzing colleges based on your preferences...'}
                </p>
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <Alert variant="info" className="mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Alert.Heading as="h6">
                        <i className="bi bi-info-circle me-2"></i>
                        How Match % is Calculated
                      </Alert.Heading>
                      <small>
                        Your match percentage is based on how well each college aligns with your preferences:
                        <ul className="mb-0 mt-2" style={{ fontSize: '0.9em' }}>
                          <li><strong>Location (25 pts):</strong> Preferred states match</li>
                          <li><strong>Cost (25 pts):</strong> Within budget, with bonus for lower tuition</li>
                          <li><strong>Size (15 pts):</strong> Matches your preferred student body size</li>
                          <li><strong>Academic Rigor (15 pts):</strong> Selectivity aligns with your preference</li>
                          <li><strong>Setting (10 pts):</strong> Urban, suburban, or rural preference</li>
                          <li><strong>Region (10 pts):</strong> Geographic region preference</li>
                          {responses.desiredPrograms && responses.desiredPrograms.trim() && isAIConfigured && (
                            <li><strong>Program Strength (20 pts):</strong> AI-evaluated strength in your desired programs</li>
                          )}
                        </ul>
                      </small>
                    </div>
                  </div>
                </Alert>
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
                          
                          {college.programScore !== undefined && college.programScore > 0 && (
                            <Alert variant="info" className="py-2 mb-2">
                              <small>
                                <strong>🎓 Program Strength:</strong> {college.programScore}/20 points
                                <br />
                                <em>AI-evaluated for your desired programs</em>
                              </small>
                            </Alert>
                          )}
                          
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
                        {questionnaire.recommendations && questionnaire.recommendations.length > 0 && (
                          <Badge bg="success" className="ms-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Cached
                          </Badge>
                        )}
                        <br />
                        <small className="text-muted">
                          Completed: {new Date(questionnaire.date).toLocaleDateString()}
                          {questionnaire.cachedAt && (
                            <> • Results cached: {new Date(questionnaire.cachedAt).toLocaleDateString()}</>
                          )}
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
