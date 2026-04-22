import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Shield, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicLayout } from '../components/Layout';

import rpiLogo from '../../imports/rpi-logo.png';
import bdrcsLogo from '../../imports/Bangladesh_Red_Crescent_Society_Logo.png';

export default function AdminSignup() {
  const { signup, currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    const result = await signup({
      full_name: email.split('@')[0].replace(/[._]/g, ' '),
      email: email.trim(),
      password,
      blood_group: 'O+',
      phones: [],
      department: '',
      semester: '1st',
      shift: '1st Shift',
      group_name: 'A',
      district: 'Rangpur',
      thana: '',
      area: '',
      parent_name: '',
    });
    setLoading(false);

    if (result.ok) {
      showToast('success', 'Admin account created successfully!');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed.');
    }
};

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-12 px-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>

        {/* Glowing circle accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20">
              <img src={rpiLogo} alt="RPI" className="h-9 w-9 object-contain" />
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="bg-white/10 p-2 rounded-xl border border-white/20">
              <img src={bdrcsLogo} alt="BDRCS" className="h-9 w-9 object-contain rounded-full" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-8 text-center border-b border-white/10">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Lock size={10} className="text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Admin Access</h1>
              <p className="text-slate-400 text-sm">Privileged registration portal</p>
            </div>

            {/* Warning */}
            <div className="mx-7 mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex gap-3">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Only blessed emails receive full <span className="text-amber-300 font-semibold">Admin + RCY</span> access automatically.
                All other emails are registered as regular donors.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rpi.ac.bd"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60 shadow-lg shadow-red-500/20">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Shield size={16} /> Register Admin Account</>
                }
              </button>

              <div className="text-center text-sm text-slate-400 mt-1">
                Not an admin?{' '}
                <Link to="/signup" className="text-red-400 font-semibold hover:underline">Register as Donor</Link>
                {' · '}
                <Link to="/login" className="text-slate-300 hover:underline">Sign In</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
