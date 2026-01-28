/**
 * @component AuthPage - Login and Signup page
 * @description User authentication interface with email/password and signup options
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await authService.login(formData.email, formData.password);
      } else {
        // Signup
        if (!formData.displayName.trim()) {
          setError('Display name is required');
          setLoading(false);
          return;
        }
        await authService.signup(formData.email, formData.password, formData.displayName);
      }
      // Navigate to menu after successful auth
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-900/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center mb-2">
            <img src="/cricsim_logo.png" alt="CricSim Pro" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="font-broadcast text-4xl text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            CRICSIM <span className="text-brand-gold">PRO</span>
          </h1>
          <p className="text-slate-400 text-sm">{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        {/* Auth Card */}
        <div
          className="rounded-2xl p-6 border border-slate-700/50"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold/50 transition"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold/50 transition"
                required
              />
              {!isLogin && (
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-brand-gold to-yellow-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-brand-gold/30 disabled:opacity-50 transition duration-300"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-brand-gold hover:text-yellow-400 font-medium transition"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          🔒 Your data is secure. We never share your information.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
