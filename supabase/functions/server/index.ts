import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

const GROQ_API_KEY = Deno.env.get('groq_api_reddroprcy');
const ALERT_EMAIL_API_KEY = Deno.env.get('ALERT_EMAIL_API_KEY') || '';
const ALERT_EMAIL_FROM = Deno.env.get('ALERT_EMAIL_FROM') || '';
const SETUP_KEY = Deno.env.get('OPENCODE_SETUP_KEY') || '';
const DB_WEBHOOK_SECRET = Deno.env.get('DB_WEBHOOK_SECRET') || '';
const ZENOH_HTTP_PUB_URL = Deno.env.get('ZENOH_HTTP_PUB_URL') || '';
const ZENOH_AUTH_TOKEN = Deno.env.get('ZENOH_AUTH_TOKEN') || '';
const ZENOH_TOPIC_PREFIX = Deno.env.get('ZENOH_TOPIC_PREFIX') || 'reddrop/notifications';

const OWNER_EMAILS = [
  'himadri@duck.com',
  'hsr2882008@gmail.com',
  'alex2882008@gmail.com',
];

const OWNER_PHONES = ['01797059666', '01632373707'];
const HIMADRI_PRIMARY_EMAIL = 'himadri@duck.com';

const isOwnerEmail = (email?: string) =>
  !!email && OWNER_EMAILS.includes(email.toLowerCase());

const nowIso = () => new Date().toISOString();

const chunk = <T,>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

const ownerProfileDefaults = (email: string, id: string, userCode: string) => ({
  id,
  user_code: userCode,
  full_name: 'Himadri Roy',
  email,
  role: 'admin',
  blood_group: 'O+',
  phones: OWNER_PHONES,
  department: 'Computer Technology',
  semester: 'Internship',
  shift: '1st Shift',
  group_name: 'A',
  district: 'Rangpur',
  thana: 'Rangpur Sadar',
  area: 'Rangpur',
  parent_name: 'N/A',
  photo_url: null,
  is_rcy_member: true,
  donor_visible: false,
  donor_status: 'inactive',
  total_donations: 0,
  last_donation_date: null,
  last_contact_date: null,
  warning_count: 0,
  account_disabled: false,
  is_owner: true,
  created_at: nowIso(),
  updated_at: nowIso(),
});

const publishZenoh = async (topic: string, payload: Record<string, unknown>) => {
  if (!ZENOH_HTTP_PUB_URL) return;
  const endpoint = `${ZENOH_HTTP_PUB_URL.replace(/\/$/, '')}/${topic}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (ZENOH_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${ZENOH_AUTH_TOKEN}`;
  }

  await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
};

const createNotification = async (data: {
  type: string;
  title: string;
  message: string;
  level?: 'info' | 'warning' | 'critical';
  source_table?: string;
  source_id?: string;
  payload?: Record<string, unknown>;
}) => {
  const id = Math.random().toString(36).slice(2);
  const notification = {
    id,
    type: data.type,
    title: data.title,
    message: data.message,
    level: data.level || 'info',
    source_table: data.source_table || null,
    source_id: data.source_id || null,
    payload: data.payload || null,
    read_by: [] as string[],
    created_at: nowIso(),
  };

  await kv.set(`notification:${id}`, notification);
  await publishZenoh(
    `${ZENOH_TOPIC_PREFIX}/${notification.level}`,
    {
      event: 'notification.created',
      ...notification,
    },
  );

  return notification;
};

const getProfiles = async () => {
  return await kv.getByPrefix('profile:');
};

const seedCampaignParticipants = async (camp: Record<string, any>) => {
  const profiles = await getProfiles();
  const admins = profiles.filter((p: any) => p.role === 'admin');
  const rcyMembers = profiles.filter((p: any) => p.is_rcy_member);

  for (const admin of admins) {
    const isHimadri = String(admin.email || '').toLowerCase() === HIMADRI_PRIMARY_EMAIL;
    if (isHimadri) continue;

    const participant = {
      campaign_id: camp.id,
      user_id: admin.id,
      status: 'joined',
      role: 'admin',
      user_name: admin.full_name || '',
      user_email: admin.email || '',
      updated_at: nowIso(),
    };

    await kv.set(`campaign_participant:${camp.id}:${admin.id}`, {
      ...participant,
      created_at: nowIso(),
    });

    await supabase
      .from('campaign_participants')
      .upsert(participant, { onConflict: 'campaign_id,user_id' });
  }

  await publishZenoh(`${ZENOH_TOPIC_PREFIX}/campaign-poll`, {
    event: 'campaign.poll.requested',
    campaign_id: camp.id,
    campaign_title: camp.title || 'Campaign',
    recipients: rcyMembers.map((m: any) => ({ id: m.id, email: m.email || '', name: m.full_name || '' })),
    requested_at: nowIso(),
  });

  await createNotification({
    type: 'campaign_poll',
    level: 'info',
    title: 'Campaign Poll Open',
    message: `${camp.title || 'New campaign'} has started. RCY members can vote Yes / No / Maybe.`,
    source_table: 'camps',
    source_id: String(camp.id || ''),
    payload: { recipients: rcyMembers.length },
  });
};

// Helper to get user from token
async function getUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

const PREFIX = "/server";

// --- AUTH ---

app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, full_name, ...rest } = await c.req.json();
    const owner = isOwnerEmail(email);
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const profilePayload = {
      ...rest,
      role: owner ? 'admin' : (rest.role || 'donor'),
      is_owner: owner,
      is_rcy_member: owner ? true : !!rest.is_rcy_member,
      donor_visible: owner ? false : (rest.donor_visible ?? true),
      donor_status: owner ? 'inactive' : (rest.donor_status || 'active'),
      warning_count: 0,
      account_disabled: false,
      phones: owner ? OWNER_PHONES : (Array.isArray(rest.phones) ? rest.phones : []),
      user_code: owner ? (rest.user_code || '99001') : rest.user_code,
    };
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { full_name, ...profilePayload },
      email_confirm: true
    });

    if (error) return c.json({ error: error.message }, 400);

    // Save profile to KV store
    const profile = {
      id: data.user.id,
      email: normalizedEmail,
      full_name,
      ...profilePayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`profile:${data.user.id}`, profile);
    
    return c.json({ user: profile });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// --- PROFILES ---

app.get(`${PREFIX}/profiles`, async (c) => {
  const profiles = await kv.getByPrefix("profile:");
  return c.json(profiles);
});

app.get(`${PREFIX}/profiles/:id`, async (c) => {
  const profile = await kv.get(`profile:${c.req.param('id')}`);
  return c.json(profile);
});

app.put(`${PREFIX}/profiles/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const existing = await kv.get(`profile:${c.req.param('id')}`);
  const requesterProfile = await kv.get(`profile:${user.id}`);
  
  if (user.id !== c.req.param('id') && requesterProfile?.role !== 'admin') {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (existing?.is_owner && user.id !== c.req.param('id')) {
    return c.json({ error: "Owner account cannot be modified by other admins" }, 403);
  }

  const updates = await c.req.json();
  if (existing?.is_owner) {
    delete updates.role;
    delete updates.is_owner;
    delete updates.donor_status;
    delete updates.donor_visible;
    delete updates.is_rcy_member;
    delete updates.account_disabled;
  }

  if (updates?.role === 'donor' && existing?.is_owner) {
    return c.json({ error: "Owner cannot be downgraded to donor" }, 403);
  }

  if (!requesterProfile?.is_owner && existing?.role === 'admin' && updates?.role && updates.role !== 'admin') {
    return c.json({ error: "Only owner can change admin role" }, 403);
  }

  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await kv.set(`profile:${c.req.param('id')}`, updated);
  return c.json(updated);
});

app.delete(`${PREFIX}/profiles/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const requesterProfile = await kv.get(`profile:${user.id}`);
  if (requesterProfile?.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

  const targetId = c.req.param('id');
  const existing = await kv.get(`profile:${targetId}`);
  if (!existing) return c.json({ ok: true });

  if (existing.is_owner) {
    return c.json({ error: 'Owner account cannot be deleted' }, 403);
  }

  if (existing.role === 'admin' && !requesterProfile?.is_owner && user.id === targetId) {
    return c.json({ error: 'Admin cannot self-delete' }, 403);
  }

  const { error } = await supabase.auth.admin.deleteUser(targetId);
  if (error) return c.json({ error: error.message }, 400);

  await kv.del(`profile:${targetId}`);
  return c.json({ ok: true });
});

app.get(`${PREFIX}/notifications`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const all = await kv.getByPrefix('notification:');
  const limit = Number(c.req.query('limit') || 25);
  const sorted = all
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, Math.min(100, Math.max(1, limit)));
  return c.json(sorted);
});

app.put(`${PREFIX}/notifications/:id/read`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = await kv.get(`notification:${id}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const readBy = Array.isArray(existing.read_by) ? existing.read_by : [];
  if (!readBy.includes(user.id)) readBy.push(user.id);
  const updated = { ...existing, read_by: readBy };
  await kv.set(`notification:${id}`, updated);
  return c.json(updated);
});

app.get(`${PREFIX}/campaigns/:id/participants`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const campaignId = c.req.param('id');
  const { data, error } = await supabase
    .from('campaign_participants')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    const fallback = await kv.getByPrefix(`campaign_participant:${campaignId}:`);
    return c.json(fallback || []);
  }

  return c.json(data || []);
});

app.post(`${PREFIX}/campaigns/:id/participation`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const profile = await kv.get(`profile:${user.id}`);
  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  const campaignId = c.req.param('id');
  const { status } = await c.req.json();
  const allowed = ['joined', 'cancelled', 'yes', 'no', 'maybe'];
  if (!allowed.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  if (profile.role === 'admin' && !['joined', 'cancelled'].includes(status)) {
    return c.json({ error: 'Admins can only choose joined/cancelled' }, 400);
  }

  if (profile.role !== 'admin' && !profile.is_rcy_member) {
    return c.json({ error: 'Only admins or RCY members can vote' }, 403);
  }

  const role = profile.role === 'admin' ? 'admin' : 'rcy';
  const entry = {
    campaign_id: campaignId,
    user_id: user.id,
    status,
    role,
    user_name: profile.full_name || '',
    user_email: profile.email || '',
    updated_at: nowIso(),
  };

  await kv.set(`campaign_participant:${campaignId}:${user.id}`, {
    ...entry,
    created_at: nowIso(),
  });

  const { data, error } = await supabase
    .from('campaign_participants')
    .upsert(entry, { onConflict: 'campaign_id,user_id' })
    .select('*')
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);

  await publishZenoh(`${ZENOH_TOPIC_PREFIX}/campaign-poll`, {
    event: 'campaign.poll.updated',
    campaign_id: campaignId,
    user_id: user.id,
    status,
    role,
    updated_at: nowIso(),
  });

  return c.json(data || entry);
});

app.post(`${PREFIX}/webhooks/database`, async (c) => {
  const secretHeader = c.req.header('x-webhook-secret') || c.req.header('X-Webhook-Secret') || '';
  if (DB_WEBHOOK_SECRET && secretHeader !== DB_WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const payload = await c.req.json();
  const table = String(payload.table || payload.table_name || '').toLowerCase();
  const eventType = String(payload.type || payload.eventType || payload.event || '').toUpperCase();
  const record = payload.record || payload.new || {};

  if (!table) return c.json({ ok: true, skipped: true });

  if (table === 'emergency_requests' && eventType === 'INSERT') {
    await createNotification({
      type: 'emergency_request',
      level: 'critical',
      title: 'New Emergency Request',
      message: `${record.patient_name || 'Patient'} needs ${record.blood_group || 'blood'} at ${record.hospital || 'hospital'}`,
      source_table: table,
      source_id: String(record.id || ''),
      payload,
    });
  } else if (table === 'camps' && eventType === 'INSERT') {
    await seedCampaignParticipants(record);
    await createNotification({
      type: 'camp_created',
      level: 'info',
      title: 'New Donation Camp',
      message: `${record.title || 'Camp'} scheduled on ${record.date || 'upcoming date'}`,
      source_table: table,
      source_id: String(record.id || ''),
      payload,
    });
  } else if (table === 'profiles' && eventType === 'UPDATE' && record?.account_disabled) {
    await createNotification({
      type: 'account_disabled',
      level: 'warning',
      title: 'User Account Disabled',
      message: `${record.full_name || record.email || 'A user'} account has been disabled`,
      source_table: table,
      source_id: String(record.id || ''),
      payload,
    });
  }

  return c.json({ ok: true });
});

// --- REQUESTS ---

app.get(`${PREFIX}/requests`, async (c) => {
  const requests = await kv.getByPrefix("request:");
  return c.json(requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

app.post(`${PREFIX}/requests`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const body = await c.req.json();
  const id = Math.random().toString(36).slice(2);
  const request = {
    ...body,
    id,
    requester_id: user.id,
    created_at: new Date().toISOString(),
  };
  await kv.set(`request:${id}`, request);
  await createNotification({
    type: 'emergency_request',
    level: 'critical',
    title: 'New Emergency Request',
    message: `${request.patient_name || 'Patient'} needs ${request.blood_group || 'blood'} at ${request.hospital || 'hospital'}`,
    source_table: 'request',
    source_id: request.id,
    payload: request,
  });
  return c.json(request);
});

app.put(`${PREFIX}/requests/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const existing = await kv.get(`request:${c.req.param('id')}`);
  const updates = await c.req.json();
  const updated = { ...existing, ...updates };
  await kv.set(`request:${c.req.param('id')}`, updated);
  if (existing?.status !== updated.status) {
    await createNotification({
      type: 'request_status_changed',
      level: updated.status === 'fulfilled' ? 'info' : 'warning',
      title: 'Emergency Request Updated',
      message: `${updated.patient_name || 'Request'} is now ${updated.status}`,
      source_table: 'request',
      source_id: updated.id,
      payload: updated,
    });
  }
  return c.json(updated);
});

// --- CAMPS ---

app.get(`${PREFIX}/camps`, async (c) => {
  const camps = await kv.getByPrefix("camp:");
  return c.json(camps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

app.post(`${PREFIX}/camps`, async (c) => {
  const user = await getUser(c);
  const profile = user ? await kv.get(`profile:${user.id}`) : null;
  if (profile?.role !== 'admin') return c.json({ error: "Forbidden" }, 403);
  
  const body = await c.req.json();
  const id = Math.random().toString(36).slice(2);
  const camp = { ...body, id, created_at: new Date().toISOString() };
  await kv.set(`camp:${id}`, camp);
  await seedCampaignParticipants(camp);
  await createNotification({
    type: 'camp_created',
    level: 'info',
    title: 'New Blood Donation Camp',
    message: `${camp.title || 'Camp'} scheduled on ${camp.date || 'upcoming date'}`,
    source_table: 'camp',
    source_id: camp.id,
    payload: camp,
  });
  return c.json(camp);
});

app.put(`${PREFIX}/camps/:id`, async (c) => {
  const user = await getUser(c);
  const profile = user ? await kv.get(`profile:${user.id}`) : null;
  if (profile?.role !== 'admin') return c.json({ error: "Forbidden" }, 403);

  const id = c.req.param('id');
  const existing = await kv.get(`camp:${id}`);
  if (!existing) return c.json({ error: "Camp not found" }, 404);

  const updates = await c.req.json();
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await kv.set(`camp:${id}`, updated);

  await createNotification({
    type: 'camp_updated',
    level: 'info',
    title: 'Blood Donation Camp Updated',
    message: `${existing.title || 'Camp'} has been updated`,
    source_table: 'camp',
    source_id: id,
    payload: updated,
  });

  return c.json(updated);
});

app.delete(`${PREFIX}/camps/:id`, async (c) => {
  const user = await getUser(c);
  const profile = user ? await kv.get(`profile:${user.id}`) : null;
  if (profile?.role !== 'admin') return c.json({ error: "Forbidden" }, 403);
  
  const existing = await kv.get(`camp:${c.req.param('id')}`);
  await kv.del(`camp:${c.req.param('id')}`);
  await createNotification({
    type: 'camp_deleted',
    level: 'warning',
    title: 'Camp Removed',
    message: `${existing?.title || 'A camp'} has been deleted`,
    source_table: 'camp',
    source_id: c.req.param('id'),
    payload: existing || {},
  });
  return c.json({ ok: true });
});

// --- ACTIVITIES & CONTACT VIEWS ---

app.post(`${PREFIX}/activities`, async (c) => {
  const body = await c.req.json();
  const id = Math.random().toString(36).slice(2);
  const activity = { ...body, id, created_at: new Date().toISOString() };
  await kv.set(`activity:${id}`, activity);
  return c.json(activity);
});

app.get(`${PREFIX}/activities`, async (c) => {
  const activities = await kv.getByPrefix("activity:");
  return c.json(activities);
});

app.post(`${PREFIX}/contact-views`, async (c) => {
  const body = await c.req.json();
  const id = Math.random().toString(36).slice(2);
  const view = { ...body, id, viewed_at: new Date().toISOString() };
  await kv.set(`contact_view:${id}`, view);
  return c.json(view);
});

app.get(`${PREFIX}/contact-views`, async (c) => {
  const views = await kv.getByPrefix("contact_view:");
  return c.json(views);
});

// --- AI AUTOMATION (GROQ) ---

const AI_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-32b"
];

async function callGroq(prompt: string, context: any, modelIndex = 0): Promise<string> {
  if (modelIndex >= AI_MODELS.length) throw new Error("All AI models failed");
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: AI_MODELS[modelIndex],
        messages: [
          { role: "system", content: "You are an intelligent assistant for RedDrop RCY. Provide concise and helpful insights based on the provided data. Do not mention you are an AI or which model you are using." },
          { role: "user", content: `Context: ${JSON.stringify(context)}\n\nQuery: ${prompt}` }
        ]
      })
    });
    
    if (!response.ok) {
      console.log(`Model ${AI_MODELS[modelIndex]} failed, trying next...`);
      return callGroq(prompt, context, modelIndex + 1);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.log(`Error with model ${AI_MODELS[modelIndex]}: ${err}`);
    return callGroq(prompt, context, modelIndex + 1);
  }
}

app.post(`${PREFIX}/ai/trace`, async (c) => {
  if (!GROQ_API_KEY) return c.json({ error: "AI key missing" }, 500);
  const { action, details, userId } = await c.req.json();
  const traceId = Math.random().toString(36).slice(2);
  const trace = { action, details, userId, timestamp: new Date().toISOString() };
  await kv.set(`trace:${traceId}`, trace);

  const profile = userId ? await kv.get(`profile:${userId}`) : null;
  const suspiciousKeywords = ['sql injection', 'xss', 'bruteforce', 'credential stuffing', 'abuse', 'spam'];
  const actionText = String(action || '').toLowerCase();
  const detailsText = JSON.stringify(details || {}).toLowerCase();
  const isSuspicious = suspiciousKeywords.some((k) => actionText.includes(k) || detailsText.includes(k));

  if (profile && !profile.is_owner && isSuspicious) {
    const warningCount = Number(profile.warning_count || 0) + 1;
    const disabled = warningCount >= 3;
    const updatedProfile = {
      ...profile,
      warning_count: warningCount,
      account_disabled: disabled,
      donor_status: disabled ? 'inactive' : profile.donor_status,
      updated_at: nowIso(),
    };
    await kv.set(`profile:${userId}`, updatedProfile);

    if (disabled) {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    }

    if (ALERT_EMAIL_API_KEY && ALERT_EMAIL_FROM && profile.email) {
      const subject = disabled
        ? 'RedDrop RCY: Account Disabled After Security Warnings'
        : `RedDrop RCY: Security Warning ${warningCount}/3`;
      const text = disabled
        ? 'Your account has been disabled after repeated suspicious behavior detections. Contact an owner admin to review.'
        : `Suspicious behavior was detected on your account. This is warning ${warningCount} of 3.`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ALERT_EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: ALERT_EMAIL_FROM,
          to: [profile.email],
          subject,
          text,
        }),
      });
    }

    return c.json({ ok: true, traceId, warning_count: warningCount, account_disabled: disabled });
  }

  return c.json({ ok: true, traceId, warning_count: Number(profile?.warning_count || 0), account_disabled: !!profile?.account_disabled });
});

app.post(`${PREFIX}/admin/bootstrap-reset`, async (c) => {
  try {
    const { setupKey, password } = await c.req.json();
    if (!SETUP_KEY || setupKey !== SETUP_KEY) {
      return c.json({ error: 'Invalid setup key' }, 401);
    }
    if (!password || String(password).length < 8) {
      return c.json({ error: 'Password is required' }, 400);
    }

    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return c.json({ error: error.message }, 500);
      const users = data.users || [];
      for (const u of users) {
        await supabase.auth.admin.deleteUser(u.id);
      }
      if (users.length < 200) break;
      page += 1;
    }

    const prefixes = ['profile:', 'request:', 'camp:', 'activity:', 'contact_view:', 'trace:', 'notification:', 'campaign_participant:'];
    for (const prefix of prefixes) {
      const keys = await kv.getKeysByPrefix(prefix);
      for (const batch of chunk(keys, 100)) {
        if (batch.length > 0) await kv.mdel(batch);
      }
    }

    await supabase.from('profiles').delete().neq('id', '');
    await supabase.from('emergency_requests').delete().neq('id', '');
    await supabase.from('donor_activity').delete().neq('id', '');
    await supabase.from('contact_views').delete().neq('id', '');
    await supabase.from('camps').delete().neq('id', '');

    const created: { email: string; id: string }[] = [];
    for (const [index, email] of OWNER_EMAILS.entries()) {
      const code = String(99001 + index);
      const profileSeed = ownerProfileDefaults(email, '', code);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: profileSeed,
      });
      if (error || !data.user) return c.json({ error: error?.message || 'Could not create owner user' }, 500);

      const profile = ownerProfileDefaults(email, data.user.id, code);
      await kv.set(`profile:${data.user.id}`, profile);
      await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
      created.push({ email, id: data.user.id });
    }

    return c.json({ ok: true, created });
  } catch (err: any) {
    return c.json({ error: err.message || 'Bootstrap reset failed' }, 500);
  }
});

app.post(`${PREFIX}/ai/analyze`, async (c) => {
  if (!GROQ_API_KEY) return c.json({ error: "AI key missing" }, 500);
  const { prompt, context } = await c.req.json();
  try {
    const result = await callGroq(prompt, context);
    return c.json({ result });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Bootstrap endpoint - fetch all user data in single request
app.get(`${PREFIX}/me`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const profile = await kv.get(`profile:${user.id}`);
  if (!profile) return c.json({ error: "Profile not found" }, 404);

  const allNotifications = await kv.getByPrefix("notification:");
  const unreadCount = allNotifications.filter((n: any) => {
    const readBy = Array.isArray(n.read_by) ? n.read_by : [];
    return !readBy.includes(user.id);
  }).length;

  const { data: pendingParticipations } = await supabase
    .from("campaign_participants")
    .select("id, campaign_id, status, role, user_name, user_email, created_at")
    .eq("user_id", user.id)
    .eq("status", "maybe")
    .order("created_at", { ascending: false })
    .limit(10);

  return c.json({
    profile,
    role: profile.role || "member",
    pendingCampaigns: pendingParticipations || [],
    unreadNotificationCount: unreadCount,
  });
});

// Health check
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);
