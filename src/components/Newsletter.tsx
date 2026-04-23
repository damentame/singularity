import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setEmail('');
  };

  return (
    <section className="py-28" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-12 md:p-24 text-center relative overflow-hidden" style={{ backgroundColor: '#152238' }}>
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gold/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/[0.04] rounded-full translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-10">
              <svg viewBox="0 0 100 100" className="w-16 h-16 animate-float">
                <defs>
                  <linearGradient id="newsletterGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#newsletterGold)" strokeWidth="1" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#newsletterGold)" strokeWidth="0.75" />
              </svg>
            </div>

            <h2 
              className="text-4xl md:text-5xl font-light mb-6 tracking-[0.06em]"
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              Stay Inspired
            </h2>
            
            {/* Tagline */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <span 
                className="text-xs uppercase tracking-[0.2em]" 
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  opacity: 0.7,
                }}
              >
                Your Event
              </span>
              <svg viewBox="0 0 100 100" className="w-4 h-4">
                <defs>
                  <linearGradient id="newsletterTaglineGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#newsletterTaglineGold)" strokeWidth="3" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#newsletterTaglineGold)" strokeWidth="2" />
              </svg>
              <span 
                className="text-xs uppercase tracking-[0.2em]" 
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  opacity: 0.7,
                }}
              >
                Your Way
              </span>
            </div>

            <p 
              className="text-xl max-w-xl mx-auto mb-12 leading-relaxed italic font-light"
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Playfair Display", Georgia, serif',
                opacity: 0.8,
              }}
            >
              Subscribe to receive exclusive event inspiration, new supplier announcements, 
              and special offers delivered to your inbox.
            </p>

            {isSubmitted ? (
              <div className="flex items-center justify-center gap-5 text-gold">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <span 
                  className="text-xl tracking-[0.06em] font-light"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  Thank You for Subscribing
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 rounded-xl border border-white/[0.15] focus:outline-none focus:border-gold/30 transition-all duration-300 text-sm placeholder-white/50"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)', 
                      color: '#FFFFFF',
                      fontFamily: '"Inter", sans-serif',
                    }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-10 py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark font-medium text-xs uppercase tracking-[0.15em] rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                    style={{ color: '#0B1426' }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-[#0B1426]/30 border-t-[#0B1426] rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <p 
              className="text-xs uppercase tracking-[0.15em] mt-8"
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Inter", sans-serif',
                opacity: 0.5,
              }}
            >
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
