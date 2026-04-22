import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Tent, Plus, X, CalendarDays, MapPin, Target, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { formatDate, relativeTime } from '../utils/helpers';

type PollStatus = 'joined' | 'cancelled' | 'yes' | 'no' | 'maybe';

const BLANK_FORM = {
  title: '',
  date: '',
  time: '',
  location: '',
  target: 50,
  description: '',
};

export default function Camps() {
  const {
    currentUser,
    camps,
    addCamp,
    updateCamp,
    deleteCamp,
    isAdmin,
    showToast,
    getCampaignParticipants,
    submitCampaignParticipation,
  } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResultFor, setShowResultFor] = useState<string | null>(null);
  const [resultValue, setResultValue] = useState('');
  const [participantsByCamp, setParticipantsByCamp] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const today = new Date().toISOString().split('T')[0];
  const upcoming = camps.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = camps.filter((c) => c.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const isHimadri = (currentUser.email || '').toLowerCase() === 'himadri@duck.com' || !!currentUser.is_owner;

  useEffect(() => {
    let mounted = true;
    const loadParticipants = async () => {
      if (!currentUser || camps.length === 0) return;
      const entries = await Promise.all(
        camps.map(async (camp) => {
          const rows = await getCampaignParticipants(camp.id);
          return [camp.id, rows] as const;
        }),
      );
      if (!mounted) return;
      setParticipantsByCamp(Object.fromEntries(entries));
    };
    loadParticipants();
    return () => {
      mounted = false;
    };
  }, [currentUser, camps, getCampaignParticipants]);

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.date) { setError('Date is required.'); return; }
    if (!form.location.trim()) { setError('Location is required.'); return; }

    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 400));

    if (editId) {
      updateCamp(editId, { ...form });
      showToast('success', 'Camp updated successfully!');
      setEditId(null);
    } else {
      addCamp({
        ...form,
        created_by: currentUser.id,
        created_by_name: currentUser.full_name,
        actual_collections: null,
      });
      showToast('success', 'Camp created successfully!');
    }

    setForm(BLANK_FORM);
    setShowForm(false);
    setLoading(false);
  };

  const openEdit = (campId: string) => {
    const camp = camps.find((c) => c.id === campId);
    if (!camp) return;
    setForm({
      title: camp.title,
      date: camp.date,
      time: camp.time,
      location: camp.location,
      target: camp.target,
      description: camp.description,
    });
    setEditId(campId);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this camp? This cannot be undone.')) return;
    deleteCamp(id);
    showToast('success', 'Camp deleted.');
  };

  const handleSaveResult = (campId: string) => {
    const val = parseInt(resultValue);
    if (isNaN(val) || val < 0) { showToast('error', 'Enter a valid number.'); return; }
    updateCamp(campId, { actual_collections: val });
    setShowResultFor(null);
    setResultValue('');
    showToast('success', 'Results updated!');
  };

  const submitDecision = async (campId: string, status: PollStatus) => {
    const result = await submitCampaignParticipation(campId, status);
    if (!result.ok) {
      showToast('error', result.error || 'Could not save decision');
      return;
    }
    const refreshed = await getCampaignParticipants(campId);
    setParticipantsByCamp((prev) => ({ ...prev, [campId]: refreshed }));
    showToast('success', `Saved: ${status}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Tent size={22} className="text-emerald-500" /> Blood Donation Camps
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK_FORM); }}
              className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200">
              <Plus size={16} /> New Camp
            </button>
          )}
        </div>

        {/* Upcoming */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CalendarDays size={15} className="text-emerald-500" /> Upcoming Camps
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-10 text-center text-slate-400">
              <Tent size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No upcoming camps scheduled.</p>
              {isAdmin && <p className="text-xs mt-1">Click "New Camp" to schedule one.</p>}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {upcoming.map((camp) => {
                const d = new Date(camp.date);
                return (
                  <div key={camp.id} className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                    <div className="bg-emerald-50 px-5 py-3 flex items-center gap-3 border-b border-emerald-200">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <div className="text-lg font-black leading-none">{d.getDate()}</div>
                        <div className="text-xs opacity-80">{d.toLocaleString('default', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{camp.title}</div>
                        <div className="text-emerald-600 text-xs">{d.getFullYear()}</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin size={13} className="text-slate-400" />
                        {camp.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Target size={13} className="text-slate-400" />
                        Target: {camp.target} donations · {camp.time}
                      </div>
                      {camp.description && (
                        <p className="text-xs text-slate-500 italic">{camp.description}</p>
                      )}
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Campaign Participation</div>
                        {(() => {
                          const rows = participantsByCamp[camp.id] || [];
                          const me = rows.find((r) => r.user_id === currentUser.id);
                          const yes = rows.filter((r) => r.status === 'yes').length;
                          const no = rows.filter((r) => r.status === 'no').length;
                          const maybe = rows.filter((r) => r.status === 'maybe').length;
                          const joined = rows.filter((r) => r.status === 'joined').length;
                          const cancelled = rows.filter((r) => r.status === 'cancelled').length;

                          if (currentUser.role === 'admin') {
                            return (
                              <div className="space-y-2">
                                <div className="text-xs text-slate-500">
                                  Admin joined: <span className="font-semibold text-emerald-700">{joined}</span> · Opt-out: <span className="font-semibold text-amber-700">{cancelled}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => submitDecision(camp.id, 'joined')}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border ${me?.status === 'joined' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}
                                  >
                                    {isHimadri ? 'Join/Decide' : 'Join'}
                                  </button>
                                  <button
                                    onClick={() => submitDecision(camp.id, 'cancelled')}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border ${me?.status === 'cancelled' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}
                                  >
                                    Cancel/Opt-out
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (currentUser.is_rcy_member) {
                            return (
                              <div className="space-y-2">
                                <div className="text-xs text-slate-500">
                                  RCY Poll · Yes <span className="font-semibold text-emerald-700">{yes}</span> · No <span className="font-semibold text-rose-700">{no}</span> · Maybe <span className="font-semibold text-amber-700">{maybe}</span>
                                </div>
                                <div className="flex gap-2">
                                  {(['yes', 'no', 'maybe'] as PollStatus[]).map((status) => (
                                    <button
                                      key={status}
                                      onClick={() => submitDecision(camp.id, status)}
                                      className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize ${me?.status === status ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                      {status}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return <div className="text-xs text-slate-500">Polling is for admins and RCY members.</div>;
                        })()}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => openEdit(camp.id)}
                            className="flex items-center gap-1 text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => handleDelete(camp.id)}
                            className="flex items-center gap-1 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-slate-400" /> Past Camps
            </h2>
            <div className="flex flex-col gap-3">
              {past.map((camp) => {
                const d = new Date(camp.date);
                return (
                  <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold">
                      <div>{d.getDate()}</div>
                      <div className="opacity-70">{d.toLocaleString('default', { month: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-700 text-sm truncate">{camp.title}</div>
                      <div className="text-slate-500 text-xs">{camp.location}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {camp.actual_collections !== null ? (
                        <div>
                          <div className="text-emerald-600 font-bold text-sm">{camp.actual_collections}</div>
                          <div className="text-slate-400 text-xs">of {camp.target}</div>
                        </div>
                      ) : (
                        isAdmin ? (
                          <div>
                            {showResultFor === camp.id ? (
                              <div className="flex items-center gap-1.5">
                                <input type="number" value={resultValue} onChange={(e) => setResultValue(e.target.value)}
                                  className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs" placeholder="0" />
                                <button onClick={() => handleSaveResult(camp.id)}
                                  className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg">Save</button>
                                <button onClick={() => setShowResultFor(null)} className="text-xs text-slate-400">×</button>
                              </div>
                            ) : (
                              <button onClick={() => { setShowResultFor(camp.id); setResultValue(''); }}
                                className="text-xs border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg hover:bg-slate-50">
                                + Results
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No results</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
              <button onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
                <X size={16} />
              </button>
              <h2 className="text-lg font-black">{editId ? 'Edit Camp' : 'New Blood Donation Camp'}</h2>
              <p className="text-emerald-100 text-sm mt-0.5">Fill in the camp details below</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Camp Title *</label>
                <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Spring Blood Donation Drive 2025"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Location *</label>
                <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
                  placeholder="Venue name and address"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Target Collections</label>
                <input type="number" min={1} value={form.target} onChange={(e) => set('target', parseInt(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Camp details and objectives..." rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : editId ? 'Update Camp' : 'Create Camp'
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
