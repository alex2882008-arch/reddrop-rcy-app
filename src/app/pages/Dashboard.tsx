import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Users, AlertCircle, Tent, Settings, Shield, Droplets,
  HeartPulse, Activity, Clock, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  getInitials, bloodGroupColor, roleColor, roleLabel,
  isEligible, daysUntilEligible, formatDate, relativeTime, BLOOD_GROUPS,
} from '../utils/helpers';

export default function Dashboard() {
  const { currentUser, profiles, requests, camps, activities, isAdmin, isLoading, askAi } = useApp();
  const navigate = useNavigate();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) navigate('/login');
  }, [currentUser, navigate, isLoading]);

  useEffect(() => {
    if (currentUser && !aiInsight && !loadingAi) {
      setLoadingAi(true);
      askAi("Analyze the current blood donor system status. Look at open requests and blood group distribution. Provide a 2-sentence actionable insight.")
        .then(setAiInsight)
        .finally(() => setLoadingAi(false));
    }
  }, [currentUser, askAi, aiInsight, loadingAi]);

  if (isLoading || !currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const eligible = isEligible(currentUser.last_donation_date);
  const daysLeft = daysUntilEligible(currentUser.last_donation_date);
  const activeProfiles = profiles.filter((p) => p.donor_status === 'active');
  const rcyMembers = profiles.filter((p) => p.is_rcy_member);
  const eligibleNow = profiles.filter((p) => isEligible(p.last_donation_date) && p.donor_status === 'active');
  const openRequests = requests.filter((r) => r.status === 'open');

  // Blood group counts
  const bgCounts = BLOOD_GROUPS.map((bg) => ({
    group: bg,
    count: profiles.filter((p) => p.blood_group === bg && p.donor_visible).length,
  }));

  // Recent activities
  const recentActivities = activities.slice(0, 5);

  const shortcuts = [
    { to: '/donors', icon: Users, label: 'Donor Directory', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { to: '/emergency', icon: AlertCircle, label: 'Emergency Requests', color: 'bg-red-50 text-red-600 border-red-200' },
    { to: '/profile', icon: Settings, label: 'Profile Settings', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin Panel', color: 'bg-purple-50 text-purple-600 border-purple-200' }] : []),
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Hero welcome */}
        <div className="relative bg-gradient-to-r from-red-600 via-red-600 to-red-700 rounded-3xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/3" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <p className="text-red-100 text-sm mb-1">Welcome back,</p>
              <h1 className="text-white text-2xl sm:text-3xl font-black mb-2">{currentUser.full_name.split(' ')[0]} 👋</h1>
              <p className="text-red-100 text-sm max-w-md">
                You're part of the RPI blood donor network. Your donor code is{' '}
                <span className="bg-white/20 font-mono font-bold px-2 py-0.5 rounded-lg text-white">#{currentUser.user_code}</span>
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              {openRequests.length > 0 && (
                <Link to="/emergency" className="bg-white text-red-600 font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-50 transition-all shadow-lg">
                  <AlertCircle size={14} />
                  {openRequests.length} Active Request{openRequests.length > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Bar */}
        {aiInsight && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-amber-100 p-2 rounded-xl">
              <Sparkles size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-amber-800 text-sm leading-relaxed font-medium">
                {aiInsight}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Welcome profile card */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col items-center text-center mb-5">
              {currentUser.photo_url ? (
                <img src={currentUser.photo_url} alt={currentUser.full_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-red-200 mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-black mb-3">
                  {getInitials(currentUser.full_name)}
                </div>
              )}
              <h2 className="font-black text-slate-800 text-base">{currentUser.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColor(currentUser.role)}`}>
                  {roleLabel(currentUser.role)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bloodGroupColor(currentUser.blood_group)}`}>
                  {currentUser.blood_group}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {eligible ? 'Eligible' : `${daysLeft}d to eligible`}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
              {[
                { label: 'Code', value: `#${currentUser.user_code}` },
                { label: 'Department', value: currentUser.department || 'Not set' },
                { label: 'Semester', value: currentUser.semester || 'Not set' },
                { label: 'Thana', value: currentUser.thana || 'Not set' },
                { label: 'Donations', value: String(currentUser.total_donations) },
                { label: 'Last Donation', value: formatDate(currentUser.last_donation_date) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-700 font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>

            {currentUser.is_rcy_member && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <Droplets size={14} className="text-emerald-600" />
                <span className="text-emerald-700 text-xs font-semibold">RCY Member</span>
              </div>
            )}

            <Link to="/profile" className="mt-4 w-full block text-center text-sm text-red-600 hover:underline font-semibold">
              Edit Profile →
            </Link>
          </div>

          {/* Right section */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Users, label: 'Total Donors', value: profiles.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Activity, label: 'Active Profiles', value: activeProfiles.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: HeartPulse, label: 'RCY Members', value: rcyMembers.length, color: 'text-rose-600', bg: 'bg-rose-50' },
                { icon: CheckCircle2, label: 'Eligible Now', value: eligibleNow.length, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="text-2xl font-black text-slate-800">{value}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Shortcuts */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Quick Access</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {shortcuts.map(({ to, icon: Icon, label, color }) => (
                  <Link key={to} to={to}
                    className={`${color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all text-center`}>
                    <Icon size={20} />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Blood group distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Droplets size={16} className="text-red-500" />
                Blood Group Distribution
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {bgCounts.map(({ group, count }) => (
                  <div key={group} className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-black ${bloodGroupColor(group)}`}>
                      {group}
                    </div>
                    <div className="text-slate-600 text-xs font-semibold">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-red-500" />
              Recent Activity
            </h3>
            <Link to="/donors" className="text-xs text-red-600 hover:underline font-semibold">View All →</Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent activity recorded.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {recentActivities.map((act) => {
                const actor = profiles.find((p) => p.id === act.user_id);
                const donor = profiles.find((p) => p.id === act.donor_id);
                return (
                  <div key={act.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-700 text-xs font-bold">{getInitials(actor?.full_name || '?')}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">{actor?.full_name}</span>
                        {' recorded activity for '}
                        <span className="font-semibold">{donor?.full_name}</span>
                      </p>
                      {act.notes && <p className="text-xs text-slate-400 mt-0.5">{act.notes}</p>}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{relativeTime(act.created_at || act.added_date)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Camps preview */}
        {camps.filter((c) => new Date(c.date) >= new Date()).length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Tent size={16} className="text-emerald-500" />
                Upcoming Camps
              </h3>
              <Link to="/camps" className="text-xs text-red-600 hover:underline font-semibold">All Camps →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {camps
                .filter((c) => new Date(c.date) >= new Date())
                .slice(0, 2)
                .map((camp) => {
                  const d = new Date(camp.date);
                  return (
                    <div key={camp.id} className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="w-12 flex-shrink-0 bg-emerald-600 text-white rounded-xl flex flex-col items-center justify-center text-center p-2">
                        <div className="text-lg font-black leading-none">{d.getDate()}</div>
                        <div className="text-xs opacity-80">{d.toLocaleString('default', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{camp.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{camp.location} · Target: {camp.target}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
