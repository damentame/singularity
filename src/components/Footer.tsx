import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { MapPin, Mail, Phone, Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const { setCurrentView } = useAppContext();

  const footerLinks = {
    forHosts: [
      { label: 'Browse Suppliers', action: () => setCurrentView('browse') },
      { label: 'Guest List', action: () => setCurrentView('guests') },
      { label: 'Seating Chart', action: () => setCurrentView('seating') },
      { label: 'Budget Tracker', action: () => setCurrentView('budget') },
    ],
    planning: [
      { label: 'Planning Checklist', action: () => setCurrentView('checklist') },
      { label: 'Weather Forecast', action: () => setCurrentView('weather') },
      { label: 'Accommodation', action: () => setCurrentView('accommodation') },
      { label: 'Messages', action: () => setCurrentView('messages') },
    ],
    forSuppliers: [
      { label: 'List Your Business', action: () => setCurrentView('service-provider-registration') },
      { label: 'Supplier Dashboard', action: () => setCurrentView('dashboard') },
      { label: 'Success Stories', action: () => {} },
      { label: 'Partner Program', action: () => {} },
    ],

    company: [
      { label: 'About Us', action: () => {} },
      { label: 'Careers', action: () => {} },
      { label: 'Press', action: () => {} },
      { label: 'Contact', action: () => {} },
    ],
    legal: [
      { label: 'Privacy Policy', action: () => {} },
      { label: 'Terms of Service', action: () => {} },
      { label: 'Cookie Policy', action: () => {} },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer style={{ backgroundColor: '#0B1426' }}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            {/* Logo - Aligned */}
            <div className="flex items-center space-x-4 mb-8">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                <defs>
                  <linearGradient id="footerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#footerGold)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#footerGold)" strokeWidth="1" />
              </svg>
              <span 
                className="text-2xl tracking-[0.08em] font-light" 
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                The One
              </span>
            </div>

            {/* Tagline - Aligned */}
            <div className="flex items-center gap-3 mb-10">
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
                  <linearGradient id="footerTaglineGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#footerTaglineGold)" strokeWidth="3" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#footerTaglineGold)" strokeWidth="2" />
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
              className="text-lg mb-10 max-w-xs leading-relaxed italic font-light" 
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Playfair Display", Georgia, serif',
                opacity: 0.7,
              }}
            >
              The world's premier marketplace for luxury event planning. 
              Connect with exceptional suppliers across the globe.
            </p>

            {/* Contact Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-4 text-sm" style={{ color: '#FFFFFF', opacity: 0.7 }}>
                <Mail className="w-5 h-5 text-gold" />
                <span>hello@theone.events</span>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#FFFFFF', opacity: 0.7 }}>
                <Phone className="w-5 h-5 text-gold" />
                <span>+27 21 123 4567</span>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#FFFFFF', opacity: 0.7 }}>
                <MapPin className="w-5 h-5 text-gold" />
                <span>Cape Town, South Africa</span>
              </div>
            </div>
          </div>

          {/* For Hosts */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-gold">For Hosts</h4>
            <ul className="space-y-5">
              {footerLinks.forHosts.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="hover:text-white text-sm transition-colors duration-300"
                    style={{ color: '#FFFFFF', opacity: 0.7 }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Planning Tools */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-gold">Planning</h4>
            <ul className="space-y-5">
              {footerLinks.planning.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="hover:text-white text-sm transition-colors duration-300"
                    style={{ color: '#FFFFFF', opacity: 0.7 }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Service Providers */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-gold">For Service Providers</h4>

            <ul className="space-y-5">
              {footerLinks.forSuppliers.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="hover:text-white text-sm transition-colors duration-300"
                    style={{ color: '#FFFFFF', opacity: 0.7 }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-gold">Company</h4>
            <ul className="space-y-5 mb-10">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="hover:text-white text-sm transition-colors duration-300"
                    style={{ color: '#FFFFFF', opacity: 0.7 }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-6 text-gold">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="hover:text-white text-sm transition-colors duration-300"
                    style={{ color: '#FFFFFF', opacity: 0.7 }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Copyright */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.15em]" style={{ color: '#FFFFFF', opacity: 0.6 }}>
              <span>&copy; {new Date().getFullYear()} The One</span>
              <svg viewBox="0 0 100 100" className="w-3 h-3">
                <defs>
                  <linearGradient id="footerCopyrightGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#footerCopyrightGold)" strokeWidth="4" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#footerCopyrightGold)" strokeWidth="3" />
              </svg>
              <span>All rights reserved.</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-11 h-11 rounded-full border border-white/[0.15] flex items-center justify-center hover:bg-gradient-to-br hover:from-gold-light hover:to-gold hover:border-transparent transition-all duration-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFFFFF' }}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
