import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, MessageCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Declare SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Local response handler for common queries
const getLocalResponse = (
  transcript: string, 
  setCurrentView: (view: string) => void,
  setShowAuthModal: (show: boolean) => void,
  setAuthMode: (mode: 'login' | 'signup') => void
): { response: string; action?: () => void } => {
  const text = transcript.toLowerCase().trim();
  
  // Navigation commands
  if (text.includes('venue') || text.includes('venues') || text.includes('find venue')) {
    return {
      response: "I'll help you find the perfect venue! Let me take you to our venue listings where you can browse beautiful locations for your event.",
      action: () => setTimeout(() => setCurrentView('browse'), 1000)
    };
  }
  
  if (text.includes('supplier') || text.includes('browse') || text.includes('find supplier')) {
    return {
      response: "Let me show you our curated selection of premium event suppliers. You'll find venues, caterers, photographers, and more!",
      action: () => setTimeout(() => setCurrentView('browse'), 1000)
    };
  }
  
  if (text.includes('guest') || text.includes('guest list')) {
    return {
      response: "I'll take you to the guest list manager where you can add, organize, and track RSVPs for your event.",
      action: () => setTimeout(() => setCurrentView('guest-list'), 1000)
    };
  }
  
  if (text.includes('budget') || text.includes('budget tracker') || text.includes('money') || text.includes('cost')) {
    return {
      response: "Let's manage your event budget! I'll open the budget tracker where you can set your budget, track expenses, and stay on top of your spending.",
      action: () => setTimeout(() => setCurrentView('budget'), 1000)
    };
  }
  
  if (text.includes('weather') || text.includes('forecast')) {
    return {
      response: "I'll show you the weather forecast for your event. This will help you plan for any outdoor activities!",
      action: () => setTimeout(() => setCurrentView('weather'), 1000)
    };
  }
  
  if (text.includes('checklist') || text.includes('planning') || text.includes('tasks') || text.includes('to do')) {
    return {
      response: "Let me open your planning checklist. This will help you stay organized and ensure nothing is forgotten for your big day!",
      action: () => setTimeout(() => setCurrentView('checklist'), 1000)
    };
  }
  
  if (text.includes('seating') || text.includes('seating chart') || text.includes('table')) {
    return {
      response: "I'll take you to the seating chart tool where you can arrange your guests at tables and plan the perfect layout.",
      action: () => setTimeout(() => setCurrentView('seating'), 1000)
    };
  }
  
  if (text.includes('message') || text.includes('inbox') || text.includes('chat')) {
    return {
      response: "Opening your messages center where you can communicate with suppliers and manage all your event conversations.",
      action: () => setTimeout(() => setCurrentView('messages'), 1000)
    };
  }
  
  if (text.includes('dashboard') || text.includes('home') || text.includes('main')) {
    return {
      response: "Taking you to your dashboard where you can see an overview of your event planning progress.",
      action: () => setTimeout(() => setCurrentView('dashboard'), 1000)
    };
  }
  
  if (text.includes('accommodation') || text.includes('hotel') || text.includes('stay') || text.includes('lodging')) {
    return {
      response: "Let me show you accommodation options for your guests. I'll open the accommodation finder!",
      action: () => setTimeout(() => setCurrentView('accommodation'), 1000)
    };
  }
  
  if (text.includes('music') || text.includes('playlist') || text.includes('song')) {
    return {
      response: "I'll open the music player where you can create and manage playlists for your event.",
      action: () => setTimeout(() => setCurrentView('music'), 1000)
    };
  }
  
  // Authentication commands
  if (text.includes('sign up') || text.includes('register') || text.includes('create account')) {
    return {
      response: "I'll help you create an account! Let me open the sign up form for you.",
      action: () => {
        setTimeout(() => {
          setAuthMode('signup');
          setShowAuthModal(true);
        }, 1000);
      }
    };
  }
  
  if (text.includes('sign in') || text.includes('log in') || text.includes('login')) {
    return {
      response: "Let me open the sign in form for you.",
      action: () => {
        setTimeout(() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }, 1000);
      }
    };
  }
  
  // General help
  if (text.includes('help') || text.includes('what can you do') || text.includes('how do i')) {
    return {
      response: "I can help you navigate The One platform! Try saying things like 'Find venues', 'Open budget tracker', 'Show guest list', 'Weather forecast', 'Planning checklist', or 'Browse suppliers'. I can also help you sign in or create an account."
    };
  }
  
  // Greetings
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return {
      response: "Hello! I'm your event planning assistant. How can I help you today? You can ask me to navigate to different sections, find suppliers, or help with your event planning."
    };
  }
  
  if (text.includes('thank')) {
    return {
      response: "You're welcome! Is there anything else I can help you with for your event?"
    };
  }
  
  // Wedding specific
  if (text.includes('wedding')) {
    return {
      response: "Congratulations on your upcoming wedding! I can help you find venues, caterers, photographers, florists, and more. Would you like me to show you our wedding suppliers?",
      action: () => setTimeout(() => setCurrentView('browse'), 1500)
    };
  }
  
  // Celebration specific
  if (text.includes('birthday') || text.includes('party') || text.includes('celebration')) {
    return {
      response: "Planning a celebration? Wonderful! We have suppliers for all types of events - from intimate gatherings to grand parties. Let me show you our options!",
      action: () => setTimeout(() => setCurrentView('browse'), 1500)
    };
  }
  
  // Corporate events
  if (text.includes('corporate') || text.includes('conference') || text.includes('meeting')) {
    return {
      response: "For corporate events, we have professional venues, catering services, and AV equipment suppliers. Let me show you what's available!",
      action: () => setTimeout(() => setCurrentView('browse'), 1500)
    };
  }
  
  // Default response
  return {
    response: "I'd be happy to help with that! You can ask me to navigate to different sections like 'Find venues', 'Budget tracker', 'Guest list', 'Weather forecast', or 'Planning checklist'. What would you like to explore?"
  };
};

const VoiceAssistant: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    user, 
    setShowAuthModal, 
    setAuthMode,
    filters 
  } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your personal event planning assistant. How can I help you today? You can ask me about finding suppliers, planning your event, or navigating the platform.",
      timestamp: new Date()
    }
  ]);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;
      
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        handleVoiceInput(transcriptText);
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Only log non-aborted errors
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
      setIsListening(false);
      if (event.error === 'not-allowed') {
        addMessage('assistant', "I need microphone permission to hear you. Please allow microphone access in your browser settings.");
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }]);
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    
    // Try to find a nice voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira') ||
      v.lang === 'en-GB'
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [isMuted]);

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setTranscript('');
    addMessage('user', text);
    setIsProcessing(true);
    
    // Use local response handler (no edge function dependency)
    const { response, action } = getLocalResponse(
      text, 
      setCurrentView, 
      setShowAuthModal, 
      setAuthMode
    );
    
    // Small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addMessage('assistant', response);
    speak(response);
    
    // Execute any navigation action
    if (action) {
      action();
    }
    
    setIsProcessing(false);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleMute = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <>
      {/* Floating Voice Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        style={{ 
          background: 'linear-gradient(135deg, #B8956A 0%, #8B6914 50%, #6B5210 100%)',
          boxShadow: '0 8px 32px rgba(139, 105, 20, 0.4)'
        }}
        aria-label="Open voice assistant"
      >
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#B8956A' }} />
        <Mic className="w-7 h-7 text-white" />
        <span className="absolute -top-10 right-0 bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
          Voice Assistant
        </span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            style={{ backgroundColor: '#0B1426' }}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 flex items-center justify-between"
              style={{ 
                background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.2) 0%, rgba(139, 105, 20, 0.2) 100%)',
                borderBottom: '1px solid rgba(184, 149, 106, 0.2)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #B8956A 0%, #8B6914 100%)' }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">Voice Assistant</h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  ) : (
                    <Volume2 className="w-5 h-5" style={{ color: '#B8956A' }} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'rounded-br-md' 
                        : 'rounded-bl-md'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' 
                        ? 'rgba(139, 105, 20, 0.3)' 
                        : 'rgba(255,255,255,0.1)',
                      border: message.role === 'user' 
                        ? '1px solid rgba(184, 149, 106, 0.3)' 
                        : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <p className="text-sm text-white leading-relaxed">{message.content}</p>
                    <p 
                      className="text-xs mt-1"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div 
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#B8956A' }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Live transcript */}
              {transcript && isListening && (
                <div className="flex justify-end">
                  <div 
                    className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 opacity-70"
                    style={{ 
                      backgroundColor: 'rgba(139, 105, 20, 0.2)',
                      border: '1px dashed rgba(184, 149, 106, 0.3)'
                    }}
                  >
                    <p className="text-sm text-white italic">{transcript}</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Input Area */}
            <div 
              className="px-6 py-5"
              style={{ 
                background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.1) 0%, rgba(139, 105, 20, 0.1) 100%)',
                borderTop: '1px solid rgba(184, 149, 106, 0.2)'
              }}
            >
              {/* Voice visualization */}
              {isListening && (
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full animate-pulse"
                      style={{
                        backgroundColor: '#B8956A',
                        height: `${Math.random() * 24 + 8}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening ? 'scale-110' : 'hover:scale-105'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    background: isListening 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #B8956A 0%, #8B6914 50%, #6B5210 100%)',
                    boxShadow: isListening 
                      ? '0 0 30px rgba(239, 68, 68, 0.5)'
                      : '0 8px 32px rgba(139, 105, 20, 0.4)'
                  }}
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7 text-white" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </button>
              </div>
              
              <p 
                className="text-center text-sm mt-4"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {isListening 
                  ? 'Listening... Tap to stop' 
                  : isProcessing 
                    ? 'Processing your request...'
                    : 'Tap the microphone to speak'}
              </p>
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['Find venues', 'Guest list', 'Budget tracker', 'Weather'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleVoiceInput(suggestion)}
                    disabled={isProcessing || isListening}
                    className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'rgba(184, 149, 106, 0.2)',
                      color: '#B8956A',
                      border: '1px solid rgba(184, 149, 106, 0.3)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
