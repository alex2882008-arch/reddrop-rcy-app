import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Settings, Camera, Plus, Trash2, QrCode, Lock, User, Save,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  getInitials, bloodGroupColor, roleColor, roleLabel,
  isEligible, daysUntilEligible, formatDate,
  BLOOD_GROUPS, DEPARTMENTS, SEMESTERS, SHIFTS, THANAS,
} from '../utils/helpers';

export default function ProfileSettings() {
  const { currentUser, updateProfile, changePassword, isAdmin, showToast } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    blood_group: 'O+',
    donor_status: 'active' as 'active' | 'inactive',
    department: '',
    semester: '1st',
    shift: '1st Shift',
    group_name: 'A',
    thana: '',
    area: '',
    parent_name: '',
    last_donation_date: '',
    donor_visible: true,
    is_rcy_member: false,
  });
  const [phones, setPhones] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Password section
  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirmPwd: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    setForm({
      full_name: currentUser.full_name,
      blood_group: currentUser.blood_group,
      donor_status: currentUser.donor_status,
      department: currentUser.department,
      semester: currentUser.semester,
      shift: currentUser.shift,
      group_name: currentUser.group_name,
      thana: currentUser.thana,
      area: currentUser.area,
      parent_name: currentUser.parent_name,
      last_donation_date: currentUser.last_donation_date || '',
      donor_visible: currentUser.donor_visible,
      is_rcy_member: currentUser.is_rcy_member,
    });
    setPhones([...currentUser.phones]);
    setPhotoPreview(currentUser.photo_url);
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { showToast('error', 'Photo must be under 3MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      await updateProfile(currentUser.id, { photo_url: result });
      setUploading(false);
      showToast('success', 'Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { showToast('error', 'Full name is required.'); return; }
    setSaving(true);
    await updateProfile(currentUser.id, {
      ...form,
      phones,
      last_donation_date: form.last_donation_date || null,
    });
    setSaving(false);
    showToast('success', 'Profile saved successfully!');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPwd.length < 6) { showToast('error', 'Password must be at least 6 characters.'); return; }
    if (pwdForm.newPwd !== pwdForm.confirmPwd) { showToast('error', 'Passwords do not match.'); return; }
    setPwdSaving(true);
    const result = await changePassword(pwdForm.newPwd);
    setPwdSaving(false);
    if (result.ok) {
      setPwdForm({ newPwd: '', confirmPwd: '' });
      showToast('success', 'Password updated successfully!');
    } else {
      showToast('error', result.error || 'Password update failed.');
    }
  };

  const eligible = isEligible(currentUser.last_donation_date);
  const daysLeft = daysUntilEligible(currentUser.last_donation_date);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-red-500" />
          <div>
            <h1 className="text-2xl font-black text-slate-800">Profile Settings</h1>
            <p className="text-slate-500 text-sm">Manage your donor profile and account</p>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt={currentUser.full_name} className="w-24 h-24 rounded-2xl object-cover border-2 border-red-200" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-3xl font-black">
                  {getInitials(currentUser.full_name)}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-800">{currentUser.full_name}</h2>
              <p className="text-slate-500 text-sm">{currentUser.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${roleColor(currentUser.role)}`}>
                  {roleLabel(currentUser.role)}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${bloodGroupColor(currentUser.blood_group)}`}>
                  {currentUser.blood_group}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {eligible ? 'Eligible to Donate' : `${daysLeft} days until eligible`}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Donor Code: <span className="font-mono font-bold text-slate-600">#{currentUser.user_code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <User size={16} className="text-red-500" /> Personal Information
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name *</label>
              <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => set('blood_group', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          {/* Phone numbers */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Phone Numbers</label>
            <div className="space-y-2">
              {phones.map((ph, i) => (
                <div key={i} className="flex gap-2">
                  <input type="tel" value={ph}
                    onChange={(e) => {
                      const updated = [...phones];
                      updated[i] = e.target.value;
                      setPhones(updated);
                    }}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={`Phone ${i + 1}`}
                  />
                  <button type="button" onClick={() => setPhones(phones.filter((_, idx) => idx !== i))}
                    className="w-10 h-10 flex items-center justify-center border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setPhones([...phones, ''])}
                className="flex items-center gap-1.5 text-xs text-red-600 border border-dashed border-red-300 rounded-xl px-3 py-2 hover:bg-red-50 transition-colors">
                <Plus size={12} /> Add Phone Number
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Semester</label>
              <select value={form.semester} onChange={(e) => set('semester', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Shift</label>
              <select value={form.shift} onChange={(e) => set('shift', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                {SHIFTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Thana</label>
              <select value={form.thana} onChange={(e) => set('thana', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="">Select thana</option>
                {THANAS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Area</label>
              <input type="text" value={form.area} onChange={(e) => set('area', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Parent / Guardian</label>
              <input type="text" value={form.parent_name} onChange={(e) => set('parent_name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Donation Date</label>
              <input type="date" value={form.last_donation_date}
                onChange={(e) => set('last_donation_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Donor Status</label>
              <select value={form.donor_status} onChange={(e) => set('donor_status', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Visibility control - only for admin */}
          {isAdmin && (
            <div className="border border-purple-200 bg-purple-50 rounded-2xl p-4">
              <h4 className="text-sm font-bold text-purple-800 mb-3">Visibility Control (Admin Only)</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set('donor_visible', !form.donor_visible)}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.donor_visible ? 'bg-purple-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.donor_visible ? 'left-6' : 'left-1'}`} />
                </div>
                <span className="text-sm text-slate-700">
                  {form.donor_visible ? 'Visible in donor list' : 'Hidden from donor list'}
                </span>
              </label>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>

        {/* QR Code */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <QrCode size={16} className="text-red-500" /> My QR Code
            </h3>
            <button onClick={() => setShowQR(!showQR)}
              className="text-sm text-red-600 font-semibold hover:underline">
              {showQR ? 'Hide' : 'Show'} QR
            </button>
          </div>
          {showQR && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <QRCode value={`${window.location.origin}/donor/${currentUser.user_code}`} size={180} />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Scan to view donor profile for <span className="font-bold">#{currentUser.user_code}</span>
              </p>
            </div>
          )}
        </div>

        {/* Password */}
        <form onSubmit={handlePasswordUpdate} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock size={16} className="text-red-500" /> Update Password
          </h3>
          <div className="relative">
            <input
              type="password"
              value={pwdForm.newPwd}
              onChange={(e) => setPwdForm((f) => ({ ...f, newPwd: e.target.value }))}
              placeholder="New password (min. 6 characters)"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <input
            type="password"
            value={pwdForm.confirmPwd}
            onChange={(e) => setPwdForm((f) => ({ ...f, confirmPwd: e.target.value }))}
            placeholder="Confirm new password"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button type="submit" disabled={pwdSaving}
            className="w-full border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-60 text-sm">
            {pwdSaving ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <><Lock size={14} /> Update Password</>}
          </button>
        </form>
      </div>
    </Layout>
  );
}
