import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { MessageCircle, X, Send, Sparkles, ClipboardList, Clock, Users, Loader2, ChevronRight, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ParsedContent {
  text: string;
  links: { type: 'navigate' | 'supplier'; id: string; name: string; fullMatch: string }[];
}

// Local response generator for when edge function is unavailable
const getLocalResponse = (
  message: string, 
  requestType: 'general' | 'checklist' | 'timeline' | 'suppliers'
): string => {
  const text = message.toLowerCase();
  
  // Checklist request
  if (requestType === 'checklist' || text.includes('checklist') || text.includes('to do') || text.includes('tasks')) {
    return `## Your Event Planning Checklist

Here's a personalized checklist to help you plan your event:

### 12+ Months Before
- Set your budget and create a tracking spreadsheet
- Choose your event date and time
- Start researching [venues](navigate:browse)
- Create your guest list

### 6-12 Months Before
- Book your venue
- Hire key vendors (photographer, caterer, entertainment)
- Send save-the-dates
- Plan your theme and color scheme

### 3-6 Months Before
- Send formal invitations
- Book accommodations for out-of-town guests
- Plan your menu with your caterer
- Arrange transportation

### 1-3 Months Before
- Confirm all vendor bookings
- Create a day-of timeline
- Finalize seating arrangements
- Plan rehearsal details

### Final Weeks
- Confirm final headcount
- Create a detailed timeline for the day
- Prepare vendor payments
- Pack an emergency kit

Would you like me to help you with any specific part of your planning? You can also visit our [Planning Checklist](navigate:checklist) tool to track your progress!`;
  }
  
  // Timeline request
  if (requestType === 'timeline' || text.includes('timeline') || text.includes('schedule') || text.includes('day of')) {
    return `## Sample Event Day Timeline

Here's a suggested timeline for your special day:

### Morning Preparations
- **8:00 AM** - Venue setup begins
- **9:00 AM** - Florist arrives with arrangements
- **10:00 AM** - Hair and makeup begins
- **11:00 AM** - Photographer arrives for getting-ready shots

### Early Afternoon
- **12:00 PM** - Light lunch for the event party
- **1:00 PM** - Final touches and preparations
- **2:00 PM** - Guests begin arriving
- **2:30 PM** - Ceremony begins

### Late Afternoon
- **3:00 PM** - Ceremony concludes
- **3:30 PM** - Cocktail hour begins
- **4:00 PM** - Couple photos and family portraits
- **4:30 PM** - Guests move to reception area

### Evening Celebration
- **5:00 PM** - Reception begins, first dance
- **5:30 PM** - Dinner service
- **7:00 PM** - Toasts and speeches
- **7:30 PM** - Cake cutting
- **8:00 PM** - Dancing and celebration
- **10:00 PM** - Last dance and farewell

You can customize this timeline based on your specific event. Visit our [Planning Tools](navigate:dashboard) for more help!`;
  }
  
  // Supplier request
  if (requestType === 'suppliers' || text.includes('supplier') || text.includes('vendor') || text.includes('find') || text.includes('recommend')) {
    return `## Finding the Perfect Suppliers

I'd love to help you find the best suppliers for your event! Here are some recommendations:

### Top Categories to Consider
- **Venues** - The foundation of your event
- **Catering** - Delicious food for your guests
- **Photography** - Capturing precious moments
- **Florals** - Beautiful arrangements and decor
- **Entertainment** - Music and entertainment

### How to Choose
1. Start by browsing our [curated supplier directory](navigate:browse)
2. Filter by your location and event type
3. Read reviews from other clients
4. Request quotes from your favorites
5. Schedule consultations

### Quick Tips
- Book popular vendors 6-12 months in advance
- Always read contracts carefully
- Ask for references from past clients
- Confirm all details in writing

Would you like me to help you find specific types of suppliers? Just let me know what you're looking for!`;
  }
  
  // Venue related
  if (text.includes('venue') || text.includes('location') || text.includes('place')) {
    return `Great question about venues! Finding the perfect venue is one of the most important decisions for your event.

Here are some tips:
- Consider your guest count and ensure the venue can accommodate everyone comfortably
- Think about the atmosphere you want to create
- Check availability for your preferred dates
- Ask about catering options and restrictions
- Visit in person before booking

Would you like to [browse our venue listings](navigate:browse)? We have beautiful options for every style and budget!`;
  }
  
  // Budget related
  if (text.includes('budget') || text.includes('cost') || text.includes('price') || text.includes('money')) {
    return `Managing your event budget is crucial for a stress-free planning experience!

### Budget Tips
- Allocate 40-50% for venue and catering
- Set aside 10-15% for photography/videography
- Reserve 10% for unexpected expenses
- Track every expense as you go

You can use our [Budget Tracker](navigate:budget) to:
- Set your total budget
- Track expenses by category
- Monitor spending in real-time
- Stay on track with visual progress bars

Would you like help creating a budget breakdown for your specific event?`;
  }
  
  // Guest list related
  if (text.includes('guest') || text.includes('invite') || text.includes('rsvp')) {
    return `Managing your guest list effectively is key to a successful event!

### Guest List Tips
- Start with a master list of everyone you'd like to invite
- Categorize guests (family, friends, colleagues)
- Set a deadline for RSVPs
- Plan for plus-ones and children
- Keep track of dietary restrictions

Our [Guest List Manager](navigate:guest-list) helps you:
- Add and organize guests easily
- Track RSVP responses
- Manage dietary requirements
- Export your list for vendors

Would you like to start building your guest list?`;
  }
  
  // Weather related
  if (text.includes('weather') || text.includes('outdoor') || text.includes('rain')) {
    return `Planning for weather is essential, especially for outdoor events!

### Weather Planning Tips
- Check historical weather data for your event date
- Always have a backup indoor plan
- Consider tent rentals for outdoor events
- Provide shade or heating as needed
- Communicate weather plans to guests

You can check the [Weather Forecast](navigate:weather) for your event location to help with planning.

Would you like tips on creating a weather contingency plan?`;
  }
  
  // Seating related
  if (text.includes('seating') || text.includes('table') || text.includes('arrangement')) {
    return `Creating the perfect seating arrangement can make your event more enjoyable for everyone!

### Seating Tips
- Group guests with common interests
- Keep family dynamics in mind
- Place elderly guests away from speakers
- Consider sight lines to key areas
- Create a mix of personalities at each table

Our [Seating Chart Tool](navigate:seating) lets you:
- Drag and drop guests to tables
- Visualize your layout
- Make adjustments easily
- Print charts for your venue

Would you like help planning your seating arrangement?`;
  }
  
  // Default helpful response
  return `Thank you for your question! I'm here to help with all aspects of event planning.

Here are some things I can assist you with:
- **Finding Suppliers** - Browse our [curated directory](navigate:browse)
- **Planning Checklist** - Stay organized with our [checklist tool](navigate:checklist)
- **Budget Management** - Track expenses with our [budget tracker](navigate:budget)
- **Guest Management** - Organize with our [guest list manager](navigate:guest-list)
- **Seating Charts** - Plan layouts with our [seating tool](navigate:seating)
- **Weather Planning** - Check forecasts for your [event date](navigate:weather)

What specific aspect of your event would you like help with?`;
};

const ChatAssistant: React.FC = () => {
  const { setCurrentView, setSelectedSupplier, currentView } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your personal event planning assistant. I can help you find the perfect suppliers, create personalized checklists, generate event timelines, and answer any questions about planning your special occasion. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const parseContent = (content: string): ParsedContent => {
    const links: ParsedContent['links'] = [];
    
    // Find all navigation links
    const navRegex = /\[([^\]]+)\]\(navigate:([^)]+)\)/g;
    let match;
    while ((match = navRegex.exec(content)) !== null) {
      links.push({
        type: 'navigate',
        name: match[1],
        id: match[2],
        fullMatch: match[0]
      });
    }
    
    // Find all supplier links
    const supplierRegex = /\[([^\]]+)\]\(supplier:([^)]+)\)/g;
    while ((match = supplierRegex.exec(content)) !== null) {
      links.push({
        type: 'supplier',
        name: match[1],
        id: match[2],
        fullMatch: match[0]
      });
    }
    
    return { text: content, links };
  };

  const handleLinkClick = (link: ParsedContent['links'][0]) => {
    if (link.type === 'navigate') {
      setCurrentView(link.id as any);
      setIsOpen(false);
    } else if (link.type === 'supplier') {
      setSelectedSupplier(link.id);
      setCurrentView('supplier');
      setIsOpen(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const { links } = parseContent(content);
    
    // Replace links with clickable elements
    let processedContent = content;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Sort links by their position in the string
    const allMatches: { index: number; length: number; link: ParsedContent['links'][0] }[] = [];
    
    links.forEach(link => {
      const index = content.indexOf(link.fullMatch, lastIndex);
      if (index !== -1) {
        allMatches.push({ index, length: link.fullMatch.length, link });
      }
    });
    
    allMatches.sort((a, b) => a.index - b.index);
    
    allMatches.forEach((match, i) => {
      // Add text before this link
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${i}`} dangerouslySetInnerHTML={{ 
            __html: formatMarkdown(content.slice(lastIndex, match.index)) 
          }} />
        );
      }
      
      // Add the clickable link
      elements.push(
        <button
          key={`link-${i}`}
          onClick={() => handleLinkClick(match.link)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.2), rgba(139, 105, 20, 0.2))',
            color: '#D4AF37',
            border: '1px solid rgba(184, 149, 106, 0.3)'
          }}
        >
          {match.link.name}
          <ChevronRight className="w-3 h-3" />
        </button>
      );
      
      lastIndex = match.index + match.length;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end" dangerouslySetInnerHTML={{ 
          __html: formatMarkdown(content.slice(lastIndex)) 
        }} />
      );
    }
    
    if (elements.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />;
    }
    
    return <>{elements}</>;
  };

  const formatMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-2" style="color: #D4AF37">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2" style="color: #D4AF37">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-3" style="color: #D4AF37">$1</h1>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n/g, '<br />');
  };

  const sendMessage = async (content: string, requestType?: 'general' | 'checklist' | 'timeline' | 'suppliers') => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Use local response handler (no edge function dependency)
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking
    
    const response = getLocalResponse(content.trim(), requestType || 'general');
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const quickActions = [
    {
      icon: ClipboardList,
      label: 'Create Checklist',
      prompt: 'Create a personalized planning checklist for my event',
      type: 'checklist' as const
    },
    {
      icon: Clock,
      label: 'Generate Timeline',
      prompt: 'Generate a detailed day-of timeline for my event',
      type: 'timeline' as const
    },
    {
      icon: Users,
      label: 'Find Suppliers',
      prompt: 'Recommend suppliers that would be perfect for my event',
      type: 'suppliers' as const
    }
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          background: 'linear-gradient(135deg, #1a365d, #0B1426)',
          border: '2px solid rgba(184, 149, 106, 0.5)'
        }}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" style={{ color: '#D4AF37' }} />
      </button>

      {/* Chat Panel Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: '#0B1426' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'rgba(184, 149, 106, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.2), rgba(139, 105, 20, 0.2))',
                border: '1px solid rgba(184, 149, 106, 0.3)'
              }}
            >
              <Bot className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold" style={{ color: '#FFFFFF' }}>
                Event Assistant
              </h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Powered by AI
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>

        {/* Quick Actions */}
        <div 
          className="p-3 border-b flex gap-2 overflow-x-auto"
          style={{ borderColor: 'rgba(184, 149, 106, 0.2)' }}
        >
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => sendMessage(action.prompt, action.type)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.15), rgba(139, 105, 20, 0.15))',
                border: '1px solid rgba(184, 149, 106, 0.3)',
                color: '#D4AF37'
              }}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ height: 'calc(100% - 180px)' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'rounded-br-sm' 
                    : 'rounded-bl-sm'
                }`}
                style={{
                  backgroundColor: message.role === 'user' 
                    ? 'rgba(184, 149, 106, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: message.role === 'user'
                    ? '1px solid rgba(184, 149, 106, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: '#D4AF37' }} />
                    <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>
                      The One Assistant
                    </span>
                  </div>
                )}
                <div 
                  className="text-sm leading-relaxed"
                  style={{ color: message.role === 'user' ? '#FFFFFF' : 'rgba(255,255,255,0.9)' }}
                >
                  {renderMessageContent(message.content)}
                </div>
                <div 
                  className="text-xs mt-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 p-4 border-t"
          style={{ 
            borderColor: 'rgba(184, 149, 106, 0.2)',
            backgroundColor: '#0B1426'
          }}
        >
          <div 
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(184, 149, 106, 0.3)'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about event planning..."
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40"
              style={{ color: '#FFFFFF' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: inputValue.trim() 
                  ? 'linear-gradient(135deg, #B8956A, #8B6914)' 
                  : 'rgba(255,255,255,0.1)'
              }}
            >
              <Send className="w-4 h-4" style={{ color: inputValue.trim() ? '#0B1426' : 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI-powered assistance for your perfect event
          </p>
        </form>
      </div>
    </>
  );
};

export default ChatAssistant;
