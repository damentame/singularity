import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, Check, Loader2 } from 'lucide-react';

const ResetPasswordForm: React.FC = () => {
  const { setIsPasswordRecovery, routeToRoleDashboard, user } = useAppContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Please meet all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setIsSuccess(true);
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });

      // After 2 seconds, redirect to dashboard
      setTimeout(() => {
        setIsPasswordRecovery(false);
        if (user) {
          routeToRoleDashboard(user.role);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0B1426' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <defs>
              <linearGradient id="resetGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B8956A" />
                <stop offset="50%" stopColor="#8B6914" />
                <stop offset="100%" stopColor="#6B5210" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#resetGold)" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="url(#resetGold)" strokeWidth="1" />
          </svg>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-10 text-center" style={{ backgroundColor: '#0B1426' }}>
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-gold" />
            </div>
            <h2 
              className="text-2xl font-light tracking-wide"
              style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Set New Password
            </h2>
            <p className="text-white/50 text-sm mt-2">
              Choose a strong password for your account
            </p>
          </div>

          {isSuccess ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Password Updated</h3>
              <p className="text-gray-500 text-sm">
                Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] mb-3 text-gray-500">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold/40 focus:border-gold focus:outline-none transition-all pr-12 text-sm text-gray-900 bg-white"
                    placeholder="Enter new password"
                    required
                    autoFocus
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

                {/* Password strength indicators */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { key: 'length', label: '8+ characters' },
                    { key: 'uppercase', label: 'Uppercase letter' },
                    { key: 'lowercase', label: 'Lowercase letter' },
                    { key: 'number', label: 'Number' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        passwordChecks[key as keyof typeof passwordChecks] 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-gray-100 text-gray-300'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={`text-xs ${
                        passwordChecks[key as keyof typeof passwordChecks] ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] mb-3 text-gray-500">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    className={`w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-gold/40 focus:outline-none transition-all pr-12 text-sm text-gray-900 bg-white ${
                      confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gold'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" strokeWidth={1} /> : <Eye className="w-5 h-5" strokeWidth={1} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-red-500 text-xs mt-2">Passwords do not match</p>
                )}
                {passwordsMatch && (
                  <p className="text-emerald-500 text-xs mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                className="w-full py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark font-medium text-xs uppercase tracking-[0.15em] rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ color: '#0B1426' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
