import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { X, Eye, EyeOff, User, Building2, Briefcase, Check, ArrowLeft, Mail, Loader2 } from 'lucide-react';

type ModalView = 'login' | 'signup' | 'forgot-password';

const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authMode, 
    setAuthMode, 
    login, 
    signup,
    preselectedRole,
    setPreselectedRole,
    setPreselectedEventType,
    isAuthenticated,
  } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'host' | 'supplier' | 'coordinator'>('host');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot password state
  const [modalView, setModalView] = useState<ModalView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Sync modalView with authMode
  useEffect(() => {
    if (showAuthModal) {
      setModalView(authMode);
    }
  }, [showAuthModal, authMode]);

  // Apply preselected role when modal opens
  useEffect(() => {
    if (showAuthModal && preselectedRole) {
      setRole(preselectedRole);
    }
  }, [showAuthModal, preselectedRole]);

  // Focus first input when modal opens
  useEffect(() => {
    if (showAuthModal) {
      setTimeout(() => {
        if (modalView === 'signup' && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 100);
    }
  }, [showAuthModal, modalView]);

  // Close modal automatically when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
      resetForm();
    }
  }, [isAuthenticated]);

  if (!showAuthModal) return null;

  // If somehow the modal is open while authenticated, close it
  if (isAuthenticated) {
    setShowAuthModal(false);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (modalView === 'login') {
        const result = await login(email, password);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Invalid email or password. Please try again.');
        }
      } else if (modalView === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        const finalRole = preselectedRole || role;
        const result = await signup(email, password, name, finalRole);
        if (result.success) {
          resetForm();
        } else {
          setError(result.error || 'Could not create account. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin,
      });

      if (resetError) throw resetError;

      setResetSent(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Check your inbox for a password reset link.',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('host');
    setError('');
    setResetEmail('');
    setResetSent(false);
    setPreselectedRole(null);
    setPreselectedEventType(null);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    resetForm();
    setModalView('login');
  };

  const switchMode = () => {
    const newMode = modalView === 'login' ? 'signup' : 'login';
    setModalView(newMode as ModalView);
    setAuthMode(newMode as 'login' | 'signup');
    setError('');
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setError('');
    };

  const roles = [
    { id: 'host' as const, label: 'Host', description: 'Planning an event', icon: User },
    { id: 'supplier' as const, label: 'Provider', description: 'Offering services', icon: Building2 },
    { id: 'coordinator' as const, label: 'Coordinator', description: 'Managing events', icon: Briefcase },
  ];

  // ─── Forgot Password View ───
  if (modalView === 'forgot-password') {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
      >
        <div 
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(11, 20, 38, 0.92)' }}
          onClick={handleClose}
        />
        <div 
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-10 text-center relative" style={{ backgroundColor: '#0B1426' }}>
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 transition-colors hover:text-white"
              style={{ color: '#FFFFFF', opacity: 0.6 }}
              type="button"
            >
              <X className="w-6 h-6" strokeWidth={1} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
              <Mail className="w-7 h-7 text-gold" />
            </div>

            <h2 
              className="text-2xl font-light tracking-wide"
              style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Reset Password
            </h2>
            <p className="text-white/50 text-sm mt-2">
              {resetSent 
                ? 'Check your email for a reset link' 
                : "Enter your email and we'll send you a reset link"
              }
            </p>
          </div>

          {resetSent ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Sent</h3>
              <p className="text-gray-500 text-sm mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-gray-900 font-medium text-sm mb-6">{resetEmail}</p>
              <p className="text-gray-400 text-xs mb-8">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setResetSent(false); setResetEmail(''); }}
                  className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Try a Different Email
                </button>
                <button
                  onClick={() => { setModalView('login'); setResetSent(false); setResetEmail(''); setError(''); }}
                  className="w-full py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-xl font-medium text-xs uppercase tracking-[0.15em]"
                  style={{ color: '#0B1426' }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="p-10 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] mb-3 text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); setError(''); }}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold/40 focus:border-gold focus:outline-none transition-all text-sm text-gray-900 bg-white"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark font-medium text-xs uppercase tracking-[0.15em] rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ color: '#0B1426' }}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setModalView('login'); setError(''); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─── Login / Signup View ───
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(11, 20, 38, 0.92)' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-10 text-center relative" style={{ backgroundColor: '#0B1426' }}>
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 transition-colors hover:text-white"
            style={{ color: '#FFFFFF', opacity: 0.6 }}
            type="button"
          >
            <X className="w-6 h-6" strokeWidth={1} />
          </button>

          {/* Logo */}
          <div className="relative flex justify-center mb-6">
            <svg viewBox="0 0 100 100" className="w-14 h-14">
              <defs>
                <linearGradient id="authGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B8956A" />
                  <stop offset="50%" stopColor="#8B6914" />
                  <stop offset="100%" stopColor="#6B5210" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#authGold)" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="url(#authGold)" strokeWidth="1" />
            </svg>
          </div>

          <h2 
            className="relative text-3xl font-light tracking-[0.06em]"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            {modalView === 'login' ? 'Welcome Back' : 'Join The One'}
          </h2>
          <div className="relative flex items-center justify-center gap-4 mt-4">
            <span 
              className="text-xs uppercase tracking-[0.2em]" 
              style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.6 }}
            >
              Your Event
            </span>
            <svg viewBox="0 0 100 100" className="w-3 h-3">
              <defs>
                <linearGradient id="authTaglineGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B8956A" />
                  <stop offset="50%" stopColor="#8B6914" />
                  <stop offset="100%" stopColor="#6B5210" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#authTaglineGold)" strokeWidth="4" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="url(#authTaglineGold)" strokeWidth="3" />
            </svg>
            <span 
              className="text-xs uppercase tracking-[0.2em]" 
              style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.6 }}
            >
              Your Way
            </span>
          </div>

          {/* Show preselected role badge */}
          {modalView === 'signup' && preselectedRole && (
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold/20 text-gold text-xs uppercase tracking-wider font-medium">
                <Check className="w-3 h-3" />
                Signing up as {preselectedRole === 'supplier' ? 'Service Provider' : preselectedRole.charAt(0).toUpperCase() + preselectedRole.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Name (signup only) */}
          {modalView === 'signup' && (
            <div>
              <label 
                htmlFor="auth-name"
                className="block text-xs uppercase tracking-[0.15em] mb-3" 
                style={{ color: '#4a5568' }}
              >
                Full Name
              </label>
              <input
                ref={nameInputRef}
                id="auth-name"
                type="text"
                value={name}
                onChange={handleInputChange(setName)}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold/40 focus:border-gold focus:outline-none transition-all duration-300 text-sm text-gray-900 bg-white"
                placeholder="Enter your name"
                required
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label 
              htmlFor="auth-email"
              className="block text-xs uppercase tracking-[0.15em] mb-3" 
              style={{ color: '#4a5568' }}
            >
              Email Address
            </label>
            <input
              ref={emailInputRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold/40 focus:border-gold focus:outline-none transition-all duration-300 text-sm text-gray-900 bg-white"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label 
                htmlFor="auth-password"
                className="block text-xs uppercase tracking-[0.15em]" 
                style={{ color: '#4a5568' }}
              >
                Password
              </label>
              {modalView === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setModalView('forgot-password');
                    setResetEmail(email); // Pre-fill with current email
                    setError('');
                  }}
                  className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleInputChange(setPassword)}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold/40 focus:border-gold focus:outline-none transition-all duration-300 pr-12 text-sm text-gray-900 bg-white"
                placeholder="Enter your password"
                required
                minLength={6}
                autoComplete={modalView === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1} /> : <Eye className="w-5 h-5" strokeWidth={1} />}
              </button>
            </div>
          </div>

          {/* Role selector (signup only, when no preselected role) */}
          {modalView === 'signup' && !preselectedRole && (
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] mb-4" style={{ color: '#4a5568' }}>
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                      role === r.id
                        ? 'border-gold bg-gold/[0.08]'
                        : 'border-gray-200 hover:border-gold/40'
                    }`}
                  >
                    <r.icon className={`w-6 h-6 mx-auto mb-2 ${
                      role === r.id ? 'text-gold' : 'text-gray-400'
                    }`} strokeWidth={1} />
                    <span className={`text-xs font-medium ${
                      role === r.id ? 'text-navy' : 'text-gray-600'
                    }`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark font-medium text-xs uppercase tracking-[0.15em] rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 disabled:opacity-50"
            style={{ color: '#0B1426' }}
          >
            {isLoading 
              ? (modalView === 'login' ? 'Signing In...' : 'Creating Account...') 
              : (modalView === 'login' ? 'Sign In' : 'Create Account')
            }
          </button>

          {/* Switch Mode */}
          <p className="text-center text-sm text-gray-600">
            {modalView === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={switchMode}
              className="ml-2 text-gold font-medium hover:underline"
            >
              {modalView === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
