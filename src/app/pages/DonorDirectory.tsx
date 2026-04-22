import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Filter, X, Phone, Eye, QrCode, Download,
  Users, ChevronDown, Activity, Plus,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  getInitials, bloodGroupColor, roleColor, roleLabel,
  isEligible, daysUntilEligible, formatDate, relativeTime,
  BLOOD_GROUPS, DEPARTMENTS, THANAS, exportCSV,
} from '../utils/helpers';

const STATUSES = ['all', 'active', 'inactive'];
const ROLES = ['all', 'admin', 'rcy', 'donor'];

export default function DonorDirectory() {
  const { currentUser, profiles, isAdmin, addActivity, recordContactView, updateProfile, showToast } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterBG, setFilterBG] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [actForm, setActForm] = useState({ last_contact_date: '', notes: '' });
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  const visibleProfiles = useMemo(() =>
    profiles.filter((p) => p.donor_visible || isAdmin),
    [profiles, isAdmin]
  );

  const filtered = useMemo(() => {
    return visibleProfiles.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.user_code.includes(q) ||
        p.blood_group.toLowerCase().includes(q) ||
        p.thana.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.phones.some((ph) => ph.includes(q));
      const matchBG = filterBG === 'all' || p.blood_group === filterBG;
      const matchStatus = filterStatus === 'all' || p.donor_status === filterStatus;
      const matchRole = filterRole === 'all' || p.role === filterRole;
      const matchThana = filterThana === 'all' || p.thana === filterThana;
      return matchSearch && matchBG && matchStatus && matchRole && matchThana;
    });
  }, [visibleProfiles, search, filterBG, filterStatus, filterRole, filterThana]);

  const selectedDonor = selected ? profiles.find((p) => p.id === selected) : null;

  const handleRevealPhone = (donorId: string) => {
    recordContactView(donorId);
    setRevealedPhones((prev) => new Set([...prev, donorId]));
    showToast('info', 'Contact revealed and logged.');
  };

  const handleExportCSV = () => {
    const data = filtered.map((p) => ({
      Code: p.user_code,
      Name: p.full_name,
      Email: p.email,
      'Blood Group': p.blood_group,
      Role: p.role,
      Status: p.donor_status,
      Department: p.department,
      Semester: p.semester,
      Thana: p.thana,
      Phone: p.phones.join(' / '),
      'Total Donations': p.total_donations,
      'Last Donation': p.last_donation_date || '',
    }));
    exportCSV(data, 'reddrop-donors.csv');
    showToast('success', 'CSV exported successfully!');
  };

  const handleSaveActivity = async () => {
    if (!actForm.last_contact_date || !actForm.notes.trim()) {
      showToast('error', 'Please fill all activity fields.');
      return;
    }
    if (!selectedDonor || !currentUser) return;
    setActLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    addActivity({
      user_id: currentUser.id,
      donor_id: selectedDonor.id,
      added_date: new Date().toISOString(),
      last_contact_date: actForm.last_contact_date,
      notes: actForm.notes,
    });
    updateProfile(selectedDonor.id, { last_contact_date: actForm.last_contact_date });
    setActForm({ last_contact_date: '', notes: '' });
    setShowActivity(false);
    setActLoading(false);
    showToast('success', 'Activity recorded successfully!');
  };

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Users size={22} className="text-red-500" /> Donor Directory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} donors found</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, blood group, phone..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border transition-colors ${showFilters ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={15} /> Filters <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Blood Group', value: filterBG, setter: setFilterBG, options: ['all', ...BLOOD_GROUPS] },
              { label: 'Status', value: filterStatus, setter: setFilterStatus, options: STATUSES },
              { label: 'Role', value: filterRole, setter: setFilterRole, options: ROLES },
              { label: 'Thana', value: filterThana, setter: setFilterThana, options: ['all', ...THANAS] },
            ].map(({ label, value, setter, options }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <select value={value} onChange={(e) => setter(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white capitalize">
                  {options.map((o) => <option key={o} value={o} className="capitalize">{o === 'all' ? `All ${label}s` : o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Donor grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No donors found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((donor) => {
              const eligible = isEligible(donor.last_donation_date);
              return (
                <button
                  key={donor.id}
                  onClick={() => setSelected(donor.id)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-red-200 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {donor.photo_url ? (
                      <img src={donor.photo_url} alt={donor.full_name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getInitials(donor.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{donor.full_name}</div>
                      <div className="text-slate-400 text-xs font-mono">#{donor.user_code}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border ${bloodGroupColor(donor.blood_group)}`}>
                      {donor.blood_group}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border ${roleColor(donor.role)}`}>
                      {roleLabel(donor.role)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border ${donor.donor_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {donor.donor_status}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border ${eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {eligible ? 'Eligible' : `${daysUntilEligible(donor.last_donation_date)}d`}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="truncate">{donor.department || 'No dept.'}</div>
                    <div>{donor.thana || 'No thana'} · {donor.total_donations} donations</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setShowQR(false); setShowActivity(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <button onClick={() => { setSelected(null); setShowQR(false); setShowActivity(false); }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={16} />
              </button>
              <div className="flex items-start gap-4">
                {selectedDonor.photo_url ? (
                  <img src={selectedDonor.photo_url} alt={selectedDonor.full_name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black">
                    {getInitials(selectedDonor.full_name)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black">{selectedDonor.full_name}</h2>
                  <div className="text-red-100 font-mono text-sm">#{selectedDonor.user_code}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{selectedDonor.blood_group}</span>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{roleLabel(selectedDonor.role)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isEligible(selectedDonor.last_donation_date) ? 'bg-emerald-400/30 text-emerald-100' : 'bg-amber-400/30 text-amber-100'}`}>
                      {isEligible(selectedDonor.last_donation_date) ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Department', value: selectedDonor.department },
                  { label: 'Semester', value: selectedDonor.semester },
                  { label: 'Shift', value: selectedDonor.shift },
                  { label: 'Group', value: selectedDonor.group_name },
                  { label: 'Thana', value: selectedDonor.thana },
                  { label: 'Area', value: selectedDonor.area },
                  { label: 'Parent', value: selectedDonor.parent_name },
                  { label: 'Donations', value: String(selectedDonor.total_donations) },
                  { label: 'Last Donation', value: formatDate(selectedDonor.last_donation_date) },
                  { label: 'Status', value: selectedDonor.donor_status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{value || 'N/A'}</div>
                  </div>
                ))}
              </div>

              {/* Contact numbers */}
              <div>
                <div className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Phone size={14} className="text-red-500" /> Contact Numbers
                </div>
                {selectedDonor.phones.length === 0 ? (
                  <p className="text-slate-400 text-sm">No contact numbers added.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDonor.phones.map((phone, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                        <span className="font-mono text-sm text-slate-700">
                          {revealedPhones.has(selectedDonor.id) ? phone : phone.slice(0, 6) + '•••••'}
                        </span>
                        {revealedPhones.has(selectedDonor.id) ? (
                          <a href={`tel:${phone}`} className="text-red-600 hover:text-red-700">
                            <Phone size={15} />
                          </a>
                        ) : (
                          <button onClick={() => handleRevealPhone(selectedDonor.id)} className="text-xs text-red-600 font-semibold flex items-center gap-1">
                            <Eye size={13} /> Reveal
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setShowQR(!showQR); setShowActivity(false); }}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  <QrCode size={14} /> QR Code
                </button>
                <button onClick={() => { setShowActivity(!showActivity); setShowQR(false); }}
                  className="flex items-center gap-1.5 border border-blue-200 text-blue-600 px-3 py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors">
                  <Plus size={14} /> Record Activity
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        updateProfile(selectedDonor.id, {
                          donor_status: selectedDonor.donor_status === 'active' ? 'inactive' : 'active',
                        });
                        showToast('success', 'Donor status updated!');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${selectedDonor.donor_status === 'active' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                      {selectedDonor.donor_status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>
                )}
              </div>

              {/* QR */}
              {showQR && (
                <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-6 gap-3">
                  <QRCode value={`${window.location.origin}/donor/${selectedDonor.user_code}`} size={160} />
                  <p className="text-xs text-slate-500 text-center">Donor Profile QR — #{selectedDonor.user_code}</p>
                </div>
              )}

              {/* Activity form */}
              {showActivity && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                    <Activity size={14} /> Record Activity
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Contact Date</label>
                    <input type="date" value={actForm.last_contact_date}
                      onChange={(e) => setActForm((f) => ({ ...f, last_contact_date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
                    <textarea value={actForm.notes}
                      onChange={(e) => setActForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={3} placeholder="Add notes about this contact..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <button onClick={handleSaveActivity} disabled={actLoading}
                    className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                    {actLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Activity'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}