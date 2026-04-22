import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import {
  LayoutDashboard, Users, AlertCircle, Tent, Settings, Shield,
  Menu, X, LogOut, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials, roleColor, roleLabel } from '../utils/helpers';
import rpiLogo from '../../imports/rpi-logo.png';
import bdrcsLogo from '../../imports/Bangladesh_Red_Crescent_Society_Logo.png';
import AiChatWidget from './AiChatWidget';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/donors', label: 'Donors', icon: Users },
  { to: '/emergency', label: 'Emergency', icon: AlertCircle },
  { to: '/camps', label: 'Camps', icon: Tent },
];

interface ToastBarProps {
  toasts: { id: string; type: 'success' | 'error' | 'info'; message: string }[];
  dismiss: (id: string) => void;
}

const ToastBar: React.FC<ToastBarProps> = ({ toasts, dismiss }) => {
  if (!toasts.length) return null;
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type]} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-in slide-in-from-bottom-2`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, toasts, dismissToast, isAdmin } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top identity strip */}
      <div className="bg-gradient-to-r from-[#1a3a1a] to-[#15501e] text-white text-xs py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={rpiLogo} alt="RPI" className="h-5 w-5 object-contain" />
          <span className="hidden sm:inline font-medium">Rangpur Polytechnic Institute</span>
          <span className="hidden sm:inline text-green-300">|</span>
          <span className="hidden sm:inline text-green-200">RCY Blood Donor Management</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={bdrcsLogo} alt="BDRCS" className="h-5 w-5 object-contain rounded-full" />
          <span className="hidden sm:inline text-green-200">BDRCS</span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-red-600 rounded-lg p-1.5">
                <img src="/redcrescent-icon.svg" alt="Red Crescent" className="h-[18px] w-[18px]" />
              </div>
              <div className="hidden sm:block">
                <div className="text-red-600 font-black text-base leading-none">RedDrop</div>
                <div className="text-slate-400 text-[10px] leading-none">RCY · RPI</div>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 flex-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive(to)
                      ? 'bg-red-50 text-red-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive('/admin')
                      ? 'bg-red-50 text-red-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield size={15} />
                  Admin
                </Link>
              )}
            </div>

            <div className="flex-1 md:hidden" />

            {/* User menu */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
                >
                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt={currentUser.full_name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-red-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(currentUser.full_name)}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-slate-800 leading-none">
                      {currentUser.full_name.split(' ')[0]}
                    </div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${roleColor(currentUser.role)}`}>
                      {roleLabel(currentUser.role)}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-1.5">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="text-sm font-semibold text-slate-800">{currentUser.full_name}</div>
                        <div className="text-xs text-slate-400">{currentUser.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Settings size={14} />
                        Profile Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Shield size={14} />
                          Admin Console
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive(to)
                    ? 'bg-red-50 text-red-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive('/admin')
                    ? 'bg-red-50 text-red-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield size={16} />
                Admin Console
              </Link>
            )}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              <Settings size={16} />
              Profile Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#1a3a1a] to-[#15501e] text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src={rpiLogo} alt="RPI" className="h-8 w-8 object-contain" />
                <img src={bdrcsLogo} alt="BDRCS" className="h-8 w-8 object-contain rounded-full" />
              </div>
              <div>
                <div className="font-bold text-sm">RedDrop RCY</div>
                <div className="text-green-200 text-xs">Rangpur Polytechnic Institute</div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-green-200 text-xs">
                Blood Donor Management Portal
              </div>
              <div className="text-green-300 text-xs mt-0.5">
                Every drop counts. Be a hero today.
              </div>
              <div className="text-green-200 text-xs mt-2 flex items-center justify-center sm:justify-end gap-2">
                <Link to="/legal" className="hover:text-white underline-offset-2 hover:underline">Terms</Link>
                <span>|</span>
                <Link to="/legal" className="hover:text-white underline-offset-2 hover:underline">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ToastBar toasts={toasts} dismiss={dismissToast} />
      <AiChatWidget />
    </div>
  );
};

// Public layout (for auth pages, landing)
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top identity strip */}
      <div className="bg-gradient-to-r from-[#1a3a1a] to-[#15501e] text-white text-xs py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={rpiLogo} alt="RPI" className="h-5 w-5 object-contain" />
          <span className="font-medium">Rangpur Polytechnic Institute</span>
          <span className="text-green-300">|</span>
          <span className="text-green-200 hidden sm:inline">RCY Blood Donor Management</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={bdrcsLogo} alt="BDRCS" className="h-5 w-5 object-contain rounded-full" />
          <span className="hidden sm:inline text-green-200">BDRCS</span>
        </div>
      </div>
      {children}
      <footer className="border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <Link to="/legal" className="hover:text-slate-700 hover:underline">Terms & Privacy</Link>
      </footer>
      <ToastBar toasts={toasts} dismiss={dismissToast} />
      <AiChatWidget />
    </div>
  );
};
