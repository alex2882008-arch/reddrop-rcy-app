import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Droplets, Shield, Smartphone, Wifi, HeartPulse,
  Users, Tent, AlertCircle, ArrowRight, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicLayout } from '../components/Layout';
import rpiLogo from '../../imports/rpi-logo.png';
import bdrcsLogo from '../../imports/Bangladesh_Red_Crescent_Society_Logo.png';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Landing() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 40%, #b91c1c 70%, #1a3a1a 100%)',
          }}
        />
        <div className="absolute inset-0 z-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #fff 0%, transparent 60%)' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          {/* Logo pair */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20">
              <img src={rpiLogo} alt="RPI" className="h-14 w-14 object-contain" />
            </div>
            <div className="text-white/50 text-3xl font-thin">×</div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20">
              <img src={bdrcsLogo} alt="BDRCS" className="h-14 w-14 object-contain rounded-full" />
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-sm px-4 py-1.5 rounded-full border border-white/25 mb-6">
              <Droplets size={14} className="text-red-200" />
              RedDrop RCY · Rangpur Polytechnic Institute
            </div>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
              Campus Blood <br />
              <span className="text-red-200">Donor Network</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              A unified donor management platform for the RPI community. Register donors,
              coordinate emergency requests, manage blood donation camps, and save lives —
              all in one place.
            </p>
          </div>

          {/* Benefits pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              { icon: Shield, label: 'Admin-Ready Access Control' },
              { icon: Smartphone, label: 'Mobile-Friendly Layout' },
              { icon: Wifi, label: 'Offline Caching Support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full border border-white/25 backdrop-blur"
              >
                <Icon size={14} className="text-red-200" />
                {label}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/signup"
              className="bg-white text-red-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-red-50 transition-all flex items-center gap-2 shadow-xl w-full sm:w-auto justify-center"
            >
              <HeartPulse size={18} />
              Join as Donor
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="bg-white/15 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/25 transition-all flex items-center gap-2 backdrop-blur w-full sm:w-auto justify-center"
            >
              Sign In
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Stats card */}
          <div className="max-w-2xl mx-auto bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white">8</div>
                <div className="text-white/70 text-xs sm:text-sm mt-1">Blood Groups</div>
              </div>
              <div className="border-x border-white/20">
                <div className="text-3xl sm:text-4xl font-black text-red-200">24/7</div>
                <div className="text-white/70 text-xs sm:text-sm mt-1">Emergency Support</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white">∞</div>
                <div className="text-white/70 text-xs sm:text-sm mt-1">Lives to Save</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Groups Display */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 mb-2">All 8 Blood Groups Supported</h2>
            <p className="text-slate-500 text-sm">We coordinate donors for every blood type in the campus community</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {BLOOD_GROUPS.map((bg) => (
              <div key={bg} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center">
                  <span className="text-red-600 font-black text-sm">{bg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-800 mb-3">Everything your RCY unit needs</h2>
          <p className="text-slate-500">A complete blood donation management ecosystem built for campus life</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              color: 'bg-blue-50 text-blue-600',
              title: 'Donor Directory',
              desc: 'Searchable donor database with blood group filters, contact management, and QR profiles.',
            },
            {
              icon: AlertCircle,
              color: 'bg-red-50 text-red-600',
              title: 'Emergency Requests',
              desc: 'Submit and track urgent blood requests with real-time status and direct contact access.',
            },
            {
              icon: Tent,
              color: 'bg-emerald-50 text-emerald-600',
              title: 'Donation Camps',
              desc: 'Plan, manage, and track blood donation camps with target and collection tracking.',
            },
            {
              icon: Shield,
              color: 'bg-purple-50 text-purple-600',
              title: 'Admin Controls',
              desc: 'Full administrative access with role management, semester upgrades, and audit logs.',
            },
            {
              icon: Smartphone,
              color: 'bg-amber-50 text-amber-600',
              title: 'Mobile Friendly',
              desc: 'Fully responsive design optimized for use on phones, tablets, and desktops.',
            },
            {
              icon: HeartPulse,
              color: 'bg-rose-50 text-rose-600',
              title: 'Eligibility Tracking',
              desc: 'Automatic eligibility calculation based on 90-day donation intervals.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-14 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Droplets size={36} className="text-white mx-auto mb-4" />
          <h2 className="text-white text-3xl font-black mb-3">Ready to save lives?</h2>
          <p className="text-red-100 mb-8">Join the RPI blood donor network and become someone's hero today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-red-600 font-bold px-8 py-3 rounded-2xl hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <HeartPulse size={18} />
              Register Now
            </Link>
            <Link
              to="/login"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-2xl hover:bg-red-500 transition-all"
            >
              Already a member? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#1a3a1a] to-[#15501e] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={rpiLogo} alt="RPI" className="h-10 w-10 object-contain" />
              <img src={bdrcsLogo} alt="BDRCS" className="h-10 w-10 object-contain rounded-full" />
              <div>
                <div className="font-black text-lg">RedDrop RCY</div>
                <div className="text-green-300 text-xs">Rangpur Polytechnic Institute</div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-green-200 text-sm">Bangladesh Red Crescent Society</p>
              <p className="text-green-300 text-xs mt-1">Youth Unit · RPI Campus · Rangpur</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-4 text-center text-green-400 text-xs">
            © 2025 RedDrop RCY — Rangpur Polytechnic Institute. Built for the campus donor community.
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}
