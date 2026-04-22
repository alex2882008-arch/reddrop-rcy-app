import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Droplets, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicLayout } from '../components/Layout';
import rpiLogo from '../../imports/rpi-logo.png';
import bdrcsLogo from '../../imports/Bangladesh_Red_Crescent_Society_Logo.png';

export default function Login() {
  const { login, currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Connection timed out. Please try again.');
    }, 15000);
    const result = await login(email.trim(), password);
    clearTimeout(timeoutId);
    setLoading(false);
    if (result.ok) {
      showToast('success', 'Welcome back! Redirecting to dashboard...');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={rpiLogo} alt="RPI" className="h-12 w-12 object-contain" />
            <div className="w-px h-10 bg-slate-200" />
            <img src={bdrcsLogo} alt="BDRCS" className="h-12 w-12 object-contain rounded-full" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-white/20 rounded-2xl p-3">
                  <Droplets size={28} />
                </div>
              </div>
              <h1 className="text-2xl font-black mb-1">RCY Access Portal</h1>
              <p className="text-red-100 text-sm">Sign in to your RedDrop account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@rpi.ac.bd"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>

              <div className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/signup" className="text-red-600 font-semibold hover:underline">
                  Register as Donor
                </Link>
              </div>

              <div className="text-center">
                <Link to="/admin-signup" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Admin / RCY Access →
                </Link>
              </div>
            </form>
          </div>

          {/* System status */}
          <div className="mt-4 text-center text-xs text-slate-400">
            Official Red Crescent Society Portal for RPI
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
