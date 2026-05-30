import React from 'react';
import { Search, Heart, MessageSquare, Calendar } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Search,
      title: 'Discover',
      description: 'Browse our curated collection of premium suppliers from around the world.',
    },
    {
      icon: Heart,
      title: 'Shortlist',
      description: 'Save your favorites and compare options to find the perfect match.',
    },
    {
      icon: MessageSquare,
      title: 'Connect',
      description: 'Send inquiries and communicate directly with suppliers.',
    },
    {
      icon: Calendar,
      title: 'Book',
      description: 'Confirm your booking and bring your vision to life.',
    },
  ];

  return (
    <section className="py-32 relative" style={{ backgroundColor: '#0B1426' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-24">
          <span 
            className="text-xs uppercase tracking-[0.2em] text-gold"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Simple Process
          </span>
          <h2 
            className="text-4xl md:text-5xl font-light mt-6 mb-8 tracking-[0.06em]"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            How It Works
          </h2>
          <div className="flex items-center justify-center gap-5">
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
                <linearGradient id="howItWorksGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B8956A" />
                  <stop offset="50%" stopColor="#8B6914" />
                  <stop offset="100%" stopColor="#6B5210" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#howItWorksGold)" strokeWidth="2" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="url(#howItWorksGold)" strokeWidth="1.5" />
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
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-1/2 w-full h-px bg-gradient-to-r from-gold/25 to-gold/[0.05]" />
              )}
              
              {/* Step Icon */}
              <div className="relative z-10 w-28 h-28 mx-auto mb-10 rounded-full bg-gradient-to-br from-gold/12 to-gold/[0.04] border border-gold/20 flex items-center justify-center group-hover:from-gold/20 group-hover:to-gold/[0.08] group-hover:border-gold/35 transition-all duration-500">
                <step.icon className="w-12 h-12 text-gold" strokeWidth={1} />
                <span 
                  className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-gold-light to-gold font-light rounded-full flex items-center justify-center text-lg shadow-lg" 
                  style={{ 
                    color: '#0B1426',
                    fontFamily: '"Playfair Display", Georgia, serif',
                  }}
                >
                  {index + 1}
                </span>
              </div>

              <h3 
                className="text-2xl font-light mb-5 tracking-[0.06em]"
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {step.title}
              </h3>
              <p 
                className="text-sm leading-relaxed"
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  opacity: 0.75,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
