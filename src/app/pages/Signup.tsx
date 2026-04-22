import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Droplets, Eye, EyeOff, Camera, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicLayout } from '../components/Layout';
import { BLOOD_GROUPS, DEPARTMENTS, SEMESTERS, SHIFTS, GROUPS, THANAS } from '../utils/helpers';
import rpiLogo from '../../imports/rpi-logo.png';
import bdrcsLogo from '../../imports/Bangladesh_Red_Crescent_Society_Logo.png';

export default function Signup() {
  const { signup, currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Step 1
    full_name: '',
    email: '',
    password: '',
    blood_group: 'O+',
    phone1: '',
    photo_url: null as string | null,
    // Step 2
    phone2: '',
    department: '',
    semester: '1st',
    shift: '1st Shift',
    group_name: 'A',
    thana: '',
    area: '',
    parent_name: '',
  });

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('Photo must be under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setForm((f) => ({ ...f, photo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.email.includes('@')) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.phone1.trim()) return 'Phone number is required.';
    return null;
  };

  const validateStep2 = () => {
    if (!form.department) return 'Department is required.';
    if (!form.thana) return 'Thana is required.';
    if (!form.parent_name.trim()) return 'Parent/guardian name is required.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    const phones = [form.phone1];
    if (form.phone2.trim()) phones.push(form.phone2);

    const result = await signup({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      blood_group: form.blood_group,
      phones,
      department: form.department,
      semester: form.semester,
      shift: form.shift,
      group_name: form.group_name,
      district: 'Rangpur',
      thana: form.thana,
      area: form.area,
      parent_name: form.parent_name,
      photo_url: form.photo_url,
    });

    setLoading(false);
    if (result.ok) {
      showToast('success', 'Account created! Welcome to RedDrop.');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={rpiLogo} alt="RPI" className="h-10 w-10 object-contain" />
            <div className="w-px h-8 bg-slate-200" />
            <img src={bdrcsLogo} alt="BDRCS" className="h-10 w-10 object-contain rounded-full" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-7 text-white">
              <div className="flex justify-center mb-3">
                <div className="bg-white/20 rounded-2xl p-2.5">
                  <Droplets size={24} />
                </div>
              </div>
              <h1 className="text-xl font-black text-center mb-1">Donor Registration</h1>
              <p className="text-red-100 text-sm text-center">Step {step} of 2 — {step === 1 ? 'Basic Details' : 'Academic & Location'}</p>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {[1, 2].map((s) => (
                  <div key={s} className={`rounded-full transition-all ${s === step ? 'w-6 h-2.5 bg-white' : s < step ? 'w-2.5 h-2.5 bg-white/70' : 'w-2.5 h-2.5 bg-white/30'}`} />
                ))}
              </div>
            </div>

            <div className="p-7">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {step === 1 ? (
                <div className="flex flex-col gap-4">
                  {/* Photo upload */}
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all overflow-hidden"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={24} className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">Photo (optional, max 3MB)</span>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
                      placeholder="Md. Your Name" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                      placeholder="you@rpi.ac.bd" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)}
                        placeholder="Min. 6 characters" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group *</label>
                    <select value={form.blood_group} onChange={(e) => set('blood_group', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel" value={form.phone1} onChange={(e) => set('phone1', e.target.value)}
                      placeholder="01XXXXXXXXX" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <button
                    type="button" onClick={handleNext}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all mt-2"
                  >
                    Continue to Step 2
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Phone</label>
                    <input
                      type="tel" value={form.phone2} onChange={(e) => set('phone2', e.target.value)}
                      placeholder="01XXXXXXXXX (optional)" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Department *</label>
                    <select value={form.department} onChange={(e) => set('department', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
                      <select value={form.semester} onChange={(e) => set('semester', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Shift</label>
                      <select value={form.shift} onChange={(e) => set('shift', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Group</label>
                    <select value={form.group_name} onChange={(e) => set('group_name', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      {GROUPS.map((g) => <option key={g} value={g}>Group {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Thana *</label>
                    <select value={form.thana} onChange={(e) => set('thana', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      <option value="">Select thana</option>
                      {THANAS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Area / Village</label>
                    <input
                      type="text" value={form.area} onChange={(e) => set('area', e.target.value)}
                      placeholder="Your area or village" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
                    <input
                      type="text" value={form.parent_name} onChange={(e) => set('parent_name', e.target.value)}
                      placeholder="Father/Guardian name" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => { setStep(1); setError(''); }}
                      className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-60">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center text-sm text-slate-500 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}