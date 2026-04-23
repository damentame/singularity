import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Image, Smile, Check, CheckCheck } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { suppliers } from '@/data/suppliers';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'quote' | 'image';
  quoteDetails?: {
    service: string;
    amount: number;
    currency: string;
    status: 'pending' | 'accepted' | 'declined';
  };
}

interface Conversation {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierImage: string;
  supplierCategory: string;
  messages: Message[];
  lastActivity: Date;
  unreadCount: number;
}

const MessagesCenter: React.FC = () => {
  const { user, bookingRequests } = useAppContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize conversations from booking requests
    const saved = localStorage.getItem('theone_conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed.map((c: any) => ({
        ...c,
        lastActivity: new Date(c.lastActivity),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      })));
    } else {
      // Create sample conversations from suppliers
      const sampleConversations: Conversation[] = suppliers.slice(0, 3).map(supplier => ({
        id: `conv-${supplier.id}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierImage: supplier.image,
        supplierCategory: supplier.category,
        messages: [
          {
            id: `msg-${Date.now()}-1`,
            senderId: supplier.id,
            content: `Hello! Thank you for your interest in ${supplier.name}. How can I help you with your event?`,
            timestamp: new Date(Date.now() - 86400000),
            read: true,
            type: 'text',
          },
        ],
        lastActivity: new Date(Date.now() - 86400000),
        unreadCount: 0,
      }));
      setConversations(sampleConversations);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theone_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, conversations]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'user',
      content: newMessage,
      timestamp: new Date(),
      read: false,
      type: 'text',
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastActivity: new Date(),
        };
      }
      return conv;
    }));

    setNewMessage('');

    // Simulate supplier response after 2 seconds
    setTimeout(() => {
      const responses = [
        "Thank you for your message! I'll get back to you shortly with more details.",
        "Great question! Let me check our availability and I'll send you a quote.",
        "I'd be happy to help with that. Could you tell me more about your event date and guest count?",
        "Absolutely! We offer various packages to suit different budgets. I'll send you our brochure.",
      ];
      
      const response: Message = {
        id: `msg-${Date.now()}`,
        senderId: conversations.find(c => c.id === selectedConversation)?.supplierId || '',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        read: false,
        type: 'text',
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation) {
          return {
            ...conv,
            messages: [...conv.messages, response],
            lastActivity: new Date(),
            unreadCount: conv.unreadCount + 1,
          };
        }
        return conv;
      }));
    }, 2000);
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(c => 
    c.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em] mb-4" style={{ color: '#FFFFFF' }}>
            Messages
          </h1>
          <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Communicate directly with your suppliers
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-full md:w-96 border-r border-white/[0.08] flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-white/[0.08]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>No conversations yet</p>
                    <p className="font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Start by requesting a quote from a supplier
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        setConversations(prev => prev.map(c => 
                          c.id === conv.id ? { ...c, unreadCount: 0 } : c
                        ));
                      }}
                      className={`w-full p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.05] ${
                        selectedConversation === conv.id ? 'bg-white/[0.05]' : ''
                      }`}
                    >
                      <img
                        src={conv.supplierImage}
                        alt={conv.supplierName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-body font-medium" style={{ color: '#FFFFFF' }}>{conv.supplierName}</span>
                          <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {formatTime(conv.lastActivity)}
                          </span>
                        </div>
                        <p className="font-body text-sm truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {conv.messages[conv.messages.length - 1]?.content}
                        </p>
                        <span className="font-body text-xs text-gold">{conv.supplierCategory}</span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-gold text-navy text-xs font-medium rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedConv.supplierImage}
                        alt={selectedConv.supplierName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-body font-medium" style={{ color: '#FFFFFF' }}>{selectedConv.supplierName}</p>
                        <p className="font-body text-xs text-gold">{selectedConv.supplierCategory}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <Phone className="w-5 h-5 text-white/60" />
                      </button>
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <Video className="w-5 h-5 text-white/60" />
                      </button>
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {selectedConv.messages.map(message => {
                      const isOwn = message.senderId === user?.id || message.senderId === 'user';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                              isOwn
                                ? 'bg-gold text-navy rounded-br-sm'
                                : 'bg-white/[0.05] text-white rounded-bl-sm'
                            }`}
                          >
                            <p className="font-body text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-navy/60' : 'text-white/40'}`}>
                              <span className="text-xs">{formatTime(message.timestamp)}</span>
                              {isOwn && (
                                message.read ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5 text-white/60" />
                      </button>
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <Image className="w-5 h-5 text-white/60" />
                      </button>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                      />
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <Smile className="w-5 h-5 text-white/60" />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="p-3 bg-gold rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50"
                      >
                        <Send className="w-5 h-5 text-navy" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-10 h-10 text-gold" />
                    </div>
                    <p className="font-display text-xl mb-2" style={{ color: '#FFFFFF' }}>Select a conversation</p>
                    <p className="font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Choose a supplier to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesCenter;
