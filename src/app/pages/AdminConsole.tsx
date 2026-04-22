import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Users, Activity, Eye, AlertCircle, Search, Edit2,
  X, ChevronUp, TrendingUp, Save, Tent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  getInitials, bloodGroupColor, roleColor, roleLabel, formatDate,
  relativeTime, BLOOD_GROUPS, DEPARTMENTS, SEMESTERS,
} from '../utils/helpers';
import type { Profile } from '../context/AppContext';

type TabType = 'users' | 'activity' | 'contacts' | 'requests' | 'campaigns';

export default function AdminConsole() {
  const {
    currentUser,
    profiles,
    activities,
    contactViews,
    requests,
    camps,
    updateProfile,
    upgradeSemesters,
    isAdmin,
    showToast,
    getCampaignParticipants,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('users');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [campaignPolls, setCampaignPolls] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/dashboard'); return; }
  }, [currentUser, isAdmin, navigate]);

  useEffect(() => {
    let mounted = true;
    const loadPolls = async () => {
      if (camps.length === 0) return;
      const entries = await Promise.all(camps.map(async (camp) => {
        const rows = await getCampaignParticipants(camp.id);
        return [camp.id, rows] as const;
      }));
      if (!mounted) return;
      setCampaignPolls(Object.fromEntries(entries));
    };
    loadPolls();
    return () => {
      mounted = false;
    };
  }, [camps, getCampaignParticipants]);

  if (!currentUser || !isAdmin) return null;

  // Semester upgrade logic
  const ORDERED_SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', 'Internship'];
  const upgradeableDonors = profiles.filter((p) => {
    const idx = ORDERED_SEMESTERS.indexOf(p.semester);
    return idx >= 0 && idx < ORDERED_SEMESTERS.length - 1;
  });

  const handleUpgradeAll = async () => {
    if (!confirm(`Upgrade eligible students' semesters? This cannot be undone.`)) return;
    const count = await upgradeSemesters();
    showToast('success', `${count} students upgraded successfully!`);
  };

  const filteredUsers = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.full_name.toLowerCase().includes(q) || p.user_code.includes(q) || p.email.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
    const matchDept = filterDept === 'all' || p.department === filterDept;
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchDept && matchRole;
  });

  const openEdit = (user: Profile) => {
    setEditUser(user);
    setEditForm({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!editForm.user_code || editForm.user_code.length !== 5) {
      showToast('error', 'Donor code must be exactly 5 digits.');
      return;
    }
    setEditLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile(editUser.id, editForm);
    setEditUser(null);
    setEditForm({});
    setEditLoading(false);
    showToast('success', 'User updated successfully!');
  };

  const tabs: { key: TabType; icon: React.ReactNode; label: string; count?: number }[] = [
    { key: 'users', icon: <Users size={15} />, label: 'Users', count: profiles.length },
    { key: 'activity', icon: <Activity size={15} />, label: 'Activity', count: activities.length },
    { key: 'contacts', icon: <Eye size={15} />, label: 'Contact Views', count: contactViews.length },
    { key: 'requests', icon: <AlertCircle size={15} />, label: 'Requests', count: requests.length },
    { key: 'campaigns', icon: <Tent size={15} />, label: 'Campaign Polls', count: camps.length },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Shield size={22} className="text-red-500" /> Admin Console
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Full administrative access · {profiles.length} total members</p>
          </div>
        </div>

        {/* Semester upgrade panel */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-bold">Semester Upgrade</h3>
                <p className="text-purple-100 text-sm">
                  {upgradeableDonors.length} student{upgradeableDonors.length !== 1 ? 's' : ''} eligible for upgrade
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgradeAll}
              disabled={upgradeableDonors.length === 0}
              className="bg-white text-purple-700 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              <ChevronUp size={16} />
              Upgrade All ({upgradeableDonors.length})
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Members', value: profiles.length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Admin Users', value: profiles.filter((p) => p.role === 'admin').length, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'RCY Members', value: profiles.filter((p) => p.is_rcy_member).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Open Requests', value: requests.filter((r) => r.status === 'open').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-slate-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map(({ key, icon, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === key
                    ? 'border-red-500 text-red-600 bg-red-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {icon} {label}
                {count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Users Tab */}
            {tab === 'users' && (
              <div className="flex flex-col gap-4">
                {/* User filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, code, email..."
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    <option value="all">All Depts</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="rcy">RCY</option>
                    <option value="donor">Donor</option>
                  </select>
                </div>

                {/* Users table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Code', 'Member', 'Blood', 'Role', 'Semester', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No users found</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">#{user.user_code}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {user.photo_url ? (
                                  <img src={user.photo_url} alt={user.full_name} className="w-8 h-8 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                                    {getInitials(user.full_name)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-800 text-sm">{user.full_name}</div>
                                  <div className="text-xs text-slate-400">{user.department?.split(' ')[0] || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-lg border ${bloodGroupColor(user.blood_group)}`}>{user.blood_group}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-lg border ${roleColor(user.role)}`}>{roleLabel(user.role)}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{user.semester}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${user.donor_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {user.donor_status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button onClick={() => openEdit(user)}
                                  className="w-7 h-7 border border-blue-200 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors">
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    updateProfile(user.id, { donor_status: user.donor_status === 'active' ? 'inactive' : 'active' });
                                    showToast('success', 'Status updated!');
                                  }}
                                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${user.donor_status === 'active' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                  {user.donor_status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {tab === 'activity' && (
              <div className="flex flex-col gap-3">
                {activities.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Activity size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No activity logs yet.</p>
                  </div>
                ) : (
                  activities.map((act) => {
                    const actor = profiles.find((p) => p.id === act.user_id);
                    const donor = profiles.find((p) => p.id === act.donor_id);
                    return (
                      <div key={act.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 text-xs font-bold">{getInitials(actor?.full_name || '?')}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold">{actor?.full_name || 'Unknown'}</span>
                            {' → '}
                            <span className="font-semibold">{donor?.full_name || 'Unknown'}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{act.notes}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Contact: {formatDate(act.last_contact_date)}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{relativeTime(act.added_date)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Contact Views Tab */}
            {tab === 'contacts' && (
              <div className="flex flex-col gap-3">
                {contactViews.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Eye size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No contact views recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {['Viewer', 'Donor Viewed', 'Time'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {contactViews.map((cv) => (
                          <tr key={cv.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{cv.viewer_name}</td>
                            <td className="px-4 py-3 text-slate-600">{cv.donor_name}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{relativeTime(cv.viewed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {tab === 'requests' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Blood', 'Patient', 'Hospital', 'Requester', 'Status', 'Time'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No requests found</td>
                      </tr>
                    ) : (
                      requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-lg border font-bold ${bloodGroupColor(req.blood_group)}`}>{req.blood_group}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{req.patient_name}</td>
                          <td className="px-4 py-3 text-slate-500">{req.hospital}</td>
                          <td className="px-4 py-3 text-slate-500">{req.requester_name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${req.status === 'open' ? 'bg-red-100 text-red-700' : req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{relativeTime(req.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'campaigns' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Campaign', 'Date', 'Admin Joined', 'Admin Opt-out', 'RCY Yes', 'RCY No', 'RCY Maybe'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {camps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No campaigns found</td>
                      </tr>
                    ) : (
                      camps.map((camp) => {
                        const rows = campaignPolls[camp.id] || [];
                        const joined = rows.filter((r) => r.status === 'joined').length;
                        const cancelled = rows.filter((r) => r.status === 'cancelled').length;
                        const yes = rows.filter((r) => r.status === 'yes').length;
                        const no = rows.filter((r) => r.status === 'no').length;
                        const maybe = rows.filter((r) => r.status === 'maybe').length;
                        return (
                          <tr key={camp.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{camp.title}</td>
                            <td className="px-4 py-3 text-slate-500">{camp.date}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold">{joined}</td>
                            <td className="px-4 py-3 text-amber-700 font-semibold">{cancelled}</td>
                            <td className="px-4 py-3 text-blue-700 font-semibold">{yes}</td>
                            <td className="px-4 py-3 text-rose-700 font-semibold">{no}</td>
                            <td className="px-4 py-3 text-purple-700 font-semibold">{maybe}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
              <button onClick={() => setEditUser(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                <X size={16} />
              </button>
              <h2 className="text-lg font-black">Edit User</h2>
              <p className="text-slate-300 text-sm mt-0.5">{editUser.full_name}</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Donor Code (5 digits) *</label>
                <input type="text" value={editForm.user_code || ''} maxLength={5}
                  onChange={(e) => setEditForm((f) => ({ ...f, user_code: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name</label>
                <input type="text" value={editForm.full_name || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Blood Group</label>
                <select value={editForm.blood_group || 'O+'}
                  onChange={(e) => setEditForm((f) => ({ ...f, blood_group: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Role</label>
                <select value={editForm.role || 'donor'}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'admin' | 'rcy' | 'donor' }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="donor">Donor</option>
                  <option value="rcy">RCY</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Semester</label>
                <select value={editForm.semester || '1st'}
                  onChange={(e) => setEditForm((f) => ({ ...f, semester: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Donations</label>
                  <input type="number" min={0} value={editForm.total_donations || 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, total_donations: parseInt(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Donation</label>
                  <input type="date" value={editForm.last_donation_date || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_donation_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600">RCY Member</label>
                <div
                  onClick={() => setEditForm((f) => ({ ...f, is_rcy_member: !f.is_rcy_member }))}
                  className={`w-10 h-5 rounded-full cursor-pointer transition-all relative ${editForm.is_rcy_member ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.is_rcy_member ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>

              <button onClick={handleSaveEdit} disabled={editLoading}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-60">
                {editLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
