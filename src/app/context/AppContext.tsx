import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  generateId,
  now,
} from '../utils/helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_code: string;
  full_name: string;
  email: string;
  role: 'admin' | 'rcy' | 'donor';
  blood_group: string;
  phones: string[];
  department: string;
  semester: string;
  shift: string;
  group_name: string;
  district: string;
  thana: string;
  area: string;
  parent_name: string;
  photo_url: string | null;
  is_rcy_member: boolean;
  donor_visible: boolean;
  donor_status: 'active' | 'inactive';
  total_donations: number;
  last_donation_date: string | null;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
  is_owner?: boolean;
  warning_count?: number;
  account_disabled?: boolean;
}

export interface EmergencyRequest {
  id: string;
  blood_group: string;
  units: number;
  patient_name: string;
  hospital: string;
  contact: string;
  notes: string;
  status: 'open' | 'fulfilled' | 'closed';
  requester_id: string;
  requester_name: string;
  created_at: string;
}

export interface Camp {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  target: number;
  description: string;
  created_by: string;
  created_by_name: string;
  actual_collections: number | null;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  donor_id: string;
  added_date: string;
  last_contact_date: string;
  notes: string;
  created_at?: string;
}

export interface ContactView {
  id: string;
  viewer_id: string;
  viewer_name: string;
  donor_id: string;
  donor_name: string;
  viewed_at: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface CampaignParticipant {
  id?: string;
  campaign_id: string;
  user_id: string;
  status: 'joined' | 'cancelled' | 'yes' | 'no' | 'maybe';
  role: 'admin' | 'rcy';
  user_name?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
}

interface NotificationItem {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read_by?: string[];
  created_at: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
  // State
  currentUser: Profile | null;
  profiles: Profile[];
  requests: EmergencyRequest[];
  camps: Camp[];
  activities: Activity[];
  contactViews: ContactView[];
  toasts: Toast[];
  isLoading: boolean;

  // Auth
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: Partial<Profile> & { password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;

  // Profiles
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  getProfile: (id: string) => Profile | undefined;
  isAdmin: boolean;

  // Requests
  addRequest: (req: Omit<EmergencyRequest, 'id' | 'created_at'>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<EmergencyRequest>) => Promise<void>;

  // Camps
  addCamp: (camp: Omit<Camp, 'id' | 'created_at'>) => Promise<void>;
  updateCamp: (id: string, updates: Partial<Camp>) => Promise<boolean>;
  deleteCamp: (id: string) => Promise<void>;

  // Activities
  addActivity: (act: Omit<Activity, 'id'>) => Promise<void>;

  // Contact views
  recordContactView: (donorId: string) => Promise<void>;

  // Campaign polling
  getCampaignParticipants: (campaignId: string) => Promise<CampaignParticipant[]>;
  submitCampaignParticipation: (campaignId: string, status: CampaignParticipant['status']) => Promise<{ ok: boolean; error?: string }>;

  // Semester upgrade (batch)
  upgradeSemesters: () => Promise<number>;

  // AI & Tracing
  trackAction: (action: string, details: any) => void;
  askAi: (prompt: string, context?: any) => Promise<string>;

  // Toast
  changePassword: (newPwd: string) => Promise<{ ok: boolean; error?: string }>;
  showToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/server`;

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contactViews, setContactViews] = useState<ContactView[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const isAdmin = currentUser?.role === 'admin';

  const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
  const isProfile = (value: unknown): value is Profile => {
    return !!value && typeof value === 'object' && !Array.isArray(value) && 'id' in value;
  };

  const buildFallbackProfile = (user: any): Profile => ({
    id: user.id,
    user_code: user.user_metadata?.user_code || user.id.slice(0, 6).toUpperCase(),
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'rcy' ? user.user_metadata.role : 'donor',
    blood_group: user.user_metadata?.blood_group || 'O+',
    phones: Array.isArray(user.user_metadata?.phones) ? user.user_metadata.phones : [],
    department: user.user_metadata?.department || '',
    semester: user.user_metadata?.semester || '1st',
    shift: user.user_metadata?.shift || '1st Shift',
    group_name: user.user_metadata?.group_name || 'A',
    district: user.user_metadata?.district || 'Rangpur',
    thana: user.user_metadata?.thana || '',
    area: user.user_metadata?.area || '',
    parent_name: user.user_metadata?.parent_name || '',
    photo_url: user.user_metadata?.photo_url || null,
    is_rcy_member: !!user.user_metadata?.is_rcy_member,
    donor_visible: user.user_metadata?.donor_visible ?? true,
    donor_status: user.user_metadata?.donor_status === 'inactive' ? 'inactive' : 'active',
    total_donations: Number(user.user_metadata?.total_donations || 0),
    last_donation_date: user.user_metadata?.last_donation_date || null,
    last_contact_date: user.user_metadata?.last_contact_date || null,
    created_at: now(),
    updated_at: now(),
  });

  const resolveUserProfile = useCallback(async (user: any): Promise<Profile> => {
    try {
      const res = await fetch(`${SERVER_URL}/profiles/${user.id}`);
      const directProfile = await res.json();
      if (isProfile(directProfile)) return directProfile;

      const listRes = await fetch(`${SERVER_URL}/profiles`);
      const list = asArray<Profile>(await listRes.json());
      const byEmail = list.find((p) => p.email?.toLowerCase() === String(user.email || '').toLowerCase());
      if (byEmail) return byEmail;
    } catch (err) {
      console.error('Resolve profile error:', err);
    }

    return buildFallbackProfile(user);
  }, []);

  // ─── Fetching ───

  const fetchAll = useCallback(async () => {
    try {
      const [p, r, c, a, cv] = await Promise.all([
        fetch(`${SERVER_URL}/profiles`).then(res => res.json()),
        fetch(`${SERVER_URL}/requests`).then(res => res.json()),
        fetch(`${SERVER_URL}/camps`).then(res => res.json()),
        fetch(`${SERVER_URL}/activities`).then(res => res.json()),
        fetch(`${SERVER_URL}/contact-views`).then(res => res.json())
      ]);
      setProfiles(asArray<Profile>(p));
      setRequests(asArray<EmergencyRequest>(r));
      setCamps(asArray<Camp>(c));
      setActivities(asArray<Activity>(a));
      setContactViews(asArray<ContactView>(cv));
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        const profile = await resolveUserProfile(session.user);
        setCurrentUser(profile);
      } catch (err) {
        console.error('Refresh user error:', err);
        setCurrentUser(buildFallbackProfile(session.user));
      }
    } else {
      setCurrentUser(null);
    }
  }, [resolveUserProfile]);

  const fetchInitialData = useCallback(async () => {
    try {
      await Promise.all([fetchAll(), refreshUser()]);
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll, refreshUser]);

  useEffect(() => {
    setIsLoading(true);
    fetchInitialData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await resolveUserProfile(session.user);
          if (profile.account_disabled) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            return;
          }
          setCurrentUser(profile);
        }
      } else if (!session?.user) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAll, resolveUserProfile]);

  // ─── Toast ───────────────────────────────────────────────────────────────
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;
    try {
      const res = await fetch(`${SERVER_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      return res.ok;
    } catch (err) {
      console.error('Mark notification read error:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    const poll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !mounted) return;

      try {
        const res = await fetch(`${SERVER_URL}/notifications?limit=20`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const items = asArray<NotificationItem>(await res.json());
        for (const item of items) {
          const readBy = Array.isArray(item.read_by) ? item.read_by : [];
          if (readBy.includes(currentUser.id)) continue;
          if (notifiedIdsRef.current.has(item.id)) continue;

          const type: Toast['type'] = item.level === 'critical' ? 'error' : item.level === 'warning' ? 'info' : 'success';
          showToast(type, `${item.title}: ${item.message}`);
          notifiedIdsRef.current.add(item.id);
          const success = await markNotificationRead(item.id);
          if (!success) notifiedIdsRef.current.delete(item.id);
        }
      } catch (err) {
        console.error('Notification polling error:', err);
      }
    };

    poll();
    const timer = setInterval(poll, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [currentUser, markNotificationRead, showToast]);

  // ─── AI & Tracing ───

  const trackAction = useCallback(async (action: string, details: any) => {
    try {
      await fetch(`${SERVER_URL}/ai/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, userId: currentUser?.id })
      });
    } catch (err) {
      console.error('Trace error:', err);
    }
  }, [currentUser]);

  const askAi = useCallback(async (prompt: string, context?: any) => {
    try {
      const res = await fetch(`${SERVER_URL}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: context || { profiles, requests, camps } })
      });
      const data = await res.json();
      return data.result || 'Sorry, I couldn\'t process that.';
    } catch (err) {
      console.error('AI error:', err);
      return 'AI system is currently busy.';
    }
  }, [profiles, requests, camps]);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    
    await fetchAll();
    
    if (data.session?.access_token) {
      try {
        const meRes = await fetch(`${SERVER_URL}/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.profile) {
            if (meData.profile.account_disabled) {
              await supabase.auth.signOut();
              return { ok: false, error: 'Your account is disabled. Please contact an owner admin.' };
            }
            setCurrentUser(meData.profile);
          }
        }
      } catch (err) {
        console.error('/me fetch error:', err);
        const profile = await resolveUserProfile(data.user);
        if (profile.account_disabled) {
          await supabase.auth.signOut();
          return { ok: false, error: 'Your account is disabled. Please contact an owner admin.' };
        }
        setCurrentUser(profile);
      }
    }
    
    trackAction('login', { email });
    return { ok: true };
  };

  const signup = async (data: Partial<Profile> & { password: string }) => {
    try {
      const res = await fetch(`${SERVER_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          total_donations: 0,
        })
      });
      const result = await res.json();
      if (result.error) return { ok: false, error: result.error };
      
      // Auto-login after signup
      return await login(data.email!, data.password);
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  };

  const logout = async () => {
    trackAction('logout', { userId: currentUser?.id });
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // ─── Profiles ─────────────────────────────────────────────────────────────
  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/profiles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await fetchAll();
      if (currentUser?.id === id) await refreshUser();
      trackAction('update_profile', { profileId: id });
    }
  };

  const getProfile = (id: string) => profiles.find((p) => p.id === id);

  // ─── Requests ─────────────────────────────────────────────────────────────
  const addRequest = async (req: Omit<EmergencyRequest, 'id' | 'created_at'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ ...req, requester_name: currentUser?.full_name })
    });
    if (res.ok) {
      await fetchAll();
      trackAction('add_request', { blood_group: req.blood_group });
    }
  };

  const updateRequest = async (id: string, updates: Partial<EmergencyRequest>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await fetchAll();
      trackAction('update_request', { requestId: id, updates });
    }
  };

  // ─── Camps ────────────────────────────────────────────────────────────────
  const addCamp = async (camp: Omit<Camp, 'id' | 'created_at'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/camps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ ...camp, created_by: currentUser?.id, created_by_name: currentUser?.full_name })
    });
    if (res.ok) {
      await fetchAll();
      trackAction('add_camp', { title: camp.title });
    }
  };

  const updateCamp = async (id: string, updates: Partial<Camp>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/camps/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await fetchAll();
      trackAction('update_camp', { campId: id });
    }
    return res.ok;
  };

  const deleteCamp = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/camps/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    if (res.ok) {
      await fetchAll();
      trackAction('delete_camp', { campId: id });
    }
  };

  // ─── Activities ───────────────────────────────────────────────────────────
  const addActivity = async (act: Omit<Activity, 'id'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SERVER_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(act)
    });
    if (res.ok) {
      await fetchAll();
      trackAction('add_activity', { donorId: act.donor_id });
    }
  };

  // ─── Bulk semester upgrade ────────────────────────────────────────────────
  const SEMESTER_ORDER = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', 'Internship'];
  const upgradeSemesters = async (): Promise<number> => {
    let count = 0;
    const { data: { session } } = await supabase.auth.getSession();
    const promises: Promise<void>[] = [];
    
    for (const p of profiles) {
      const idx = SEMESTER_ORDER.indexOf(p.semester);
      if (idx >= 0 && idx < SEMESTER_ORDER.length - 1) {
        count++;
        promises.push(
          fetch(`${SERVER_URL}/profiles/${p.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ semester: SEMESTER_ORDER[idx + 1] })
          }).then(() => {})
        );
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
      await fetchAll();
      trackAction('bulk_upgrade', { count });
    }
    return count;
  };

  // ─── Contact Views ────────────────────────────────────────────────────────
  const recordContactView = async (donorId: string) => {
    if (!currentUser) return;
    const donor = profiles.find((p) => p.id === donorId);
    const view = {
      viewer_id: currentUser.id,
      viewer_name: currentUser.full_name,
      donor_id: donorId,
      donor_name: donor?.full_name || '',
    };
    const res = await fetch(`${SERVER_URL}/contact-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(view)
    });
    if (res.ok) {
      await fetchAll();
      trackAction('view_contact', { donorId });
    }
  };

  const getCampaignParticipants = async (campaignId: string): Promise<CampaignParticipant[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return [];
    try {
      const res = await fetch(`${SERVER_URL}/campaigns/${campaignId}/participants`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Get campaign participants error:', err);
      return [];
    }
  };

  const submitCampaignParticipation = async (campaignId: string, status: CampaignParticipant['status']) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { ok: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`${SERVER_URL}/campaigns/${campaignId}/participation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data?.error || 'Failed to submit decision' };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error' };
    }
  };

  const changePassword = async (newPwd: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) return { ok: false, error: error.message };
    trackAction('change_password', { userId: currentUser?.id });
    return { ok: true };
  };

  const safeProfiles = asArray<Profile>(profiles);
  const safeRequests = asArray<EmergencyRequest>(requests);
  const safeCamps = asArray<Camp>(camps);
  const safeActivities = asArray<Activity>(activities);
  const safeContactViews = asArray<ContactView>(contactViews);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        profiles: safeProfiles,
        requests: safeRequests,
        camps: safeCamps,
        activities: safeActivities,
        contactViews: safeContactViews,
        toasts,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        updateProfile,
        getProfile,
        isAdmin,
        addRequest,
        updateRequest,
        addCamp,
        updateCamp,
        deleteCamp,
        addActivity,
        recordContactView,
        getCampaignParticipants,
        submitCampaignParticipation,
        upgradeSemesters,
        trackAction,
        askAi,
        changePassword,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
