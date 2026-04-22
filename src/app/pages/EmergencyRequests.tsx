import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Plus, X, Phone, CheckCircle, XCircle, Clock, Droplets } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { BLOOD_GROUPS, bloodGroupColor, relativeTime, formatDate } from '../utils/helpers';

const INITIAL_FORM = {
  blood_group: 'O+',
  units: 1,
  patient_name: '',
  hospital: '',
  contact: '',
  notes: '',
};

export default function EmergencyRequests() {
  const { currentUser, requests, addRequest, updateRequest, isAdmin, showToast } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const active = requests.filter((r) => r.status === 'open');
  const closed = requests.filter((r) => r.status !== 'open');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name.trim()) { setError('Patient name is required.'); return; }
    if (!form.hospital.trim()) { setError('Hospital/location is required.'); return; }
    if (!form.contact.trim()) { setError('Contact number is required.'); return; }

    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 400));
    addRequest({
      ...form,
      status: 'open',
      requester_id: currentUser.id,
      requester_name: currentUser.full_name,
    });
    setForm(INITIAL_FORM);
    setShowForm(false);
    setLoading(false);
    showToast('success', 'Emergency request submitted!');
  };

  const handleStatusChange = (id: string, status: 'fulfilled' | 'closed') => {
    updateRequest(id, { status });
    showToast('success', `Request marked as ${status}.`);
  };

  const canManage = (req: { requester_id: string }) =>
    isAdmin || req.requester_id === currentUser?.id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <AlertCircle size={22} className="text-red-500" /> Emergency Requests
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {active.length} active · {closed.length} resolved
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-red-700 transition-colors shadow-md shadow-red-200"
          >
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* Urgent indicator */}
        {active.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-red-700 text-sm font-semibold">
              {active.length} urgent blood request{active.length > 1 ? 's are' : ' is'} active — please help if you can!
            </p>
          </div>
        )}

        {/* Active Requests */}
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-red-500" /> Active Requests
          </h2>
          {active.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-10 text-center text-slate-400">
              <CheckCircle size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No active emergency requests.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {active.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  canManage={canManage(req)}
                  onFulfill={() => handleStatusChange(req.id, 'fulfilled')}
                  onClose={() => handleStatusChange(req.id, 'closed')}
                  isActive
                />
              ))}
            </div>
          )}
        </div>

        {/* Closed / Fulfilled */}
        {closed.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-500" /> Resolved Requests
            </h2>
            <div className="flex flex-col gap-3">
              {closed.map((req) => (
                <RequestCard key={req.id} req={req} canManage={false} isActive={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black">New Emergency Request</h2>
                  <p className="text-red-100 text-sm">Fill in patient details below</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Blood Group *</label>
                  <select value={form.blood_group} onChange={(e) => set('blood_group', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Units Needed *</label>
                  <input type="number" min={1} max={10} value={form.units}
                    onChange={(e) => set('units', parseInt(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Patient Name *</label>
                <input type="text" value={form.patient_name} onChange={(e) => set('patient_name', e.target.value)}
                  placeholder="Full patient name"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Hospital / Location *</label>
                <input type="text" value={form.hospital} onChange={(e) => set('hospital', e.target.value)}
                  placeholder="Hospital name and location"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Contact Number *</label>
                <input type="tel" value={form.contact} onChange={(e) => set('contact', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Additional Notes</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                  placeholder="Any additional information..." rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><AlertCircle size={16} /> Submit Request</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

interface RequestCardProps {
  req: {
    id: string;
    blood_group: string;
    units: number;
    patient_name: string;
    hospital: string;
    contact: string;
    notes: string;
    status: string;
    requester_name: string;
    created_at: string;
  };
  canManage: boolean;
  isActive: boolean;
  onFulfill?: () => void;
  onClose?: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ req, canManage, isActive, onFulfill, onClose }) => {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${isActive ? 'border-red-200' : 'border-slate-200 opacity-80'}`}>
      <div className="flex items-start gap-4">
        {/* Blood group badge */}
        <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 font-black text-base ${bloodGroupColor(req.blood_group)}`}>
          {req.blood_group}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-800">{req.patient_name}</h3>
              <p className="text-slate-500 text-sm">{req.hospital}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
              req.status === 'open' ? 'bg-red-100 text-red-700' :
              req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {req.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Droplets size={12} className="text-red-400" />
              {req.units} unit{req.units > 1 ? 's' : ''} needed
            </span>
            <span>By {req.requester_name}</span>
            <span>{relativeTime(req.created_at)}</span>
          </div>

          {req.notes && (
            <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 italic">{req.notes}</p>
          )}

          {/* Contact & actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {showContact ? (
              <a href={`tel:${req.contact}`}
                className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-1.5 rounded-xl font-semibold hover:bg-emerald-100 transition-colors">
                <Phone size={13} /> {req.contact}
              </a>
            ) : (
              <button onClick={() => setShowContact(true)}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <Phone size={13} /> Call Contact
              </button>
            )}

            {canManage && isActive && (
              <>
                <button onClick={onFulfill}
                  className="flex items-center gap-1 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors">
                  <CheckCircle size={12} /> Fulfilled
                </button>
                <button onClick={onClose}
                  className="flex items-center gap-1 border border-slate-200 text-slate-500 text-xs px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <XCircle size={12} /> Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
