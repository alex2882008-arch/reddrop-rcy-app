// RedDrop RCY - Utility Helpers

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DEPARTMENTS = [
  'Civil Technology',
  'Computer Science and Technology',
  'Electrical Technology',
  'Electromedical Technology',
  'Electronics Technology',
  'Mechanical Technology',
  'Power Technology',
];

export const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', 'Internship'];
export const SHIFTS = ['1st Shift', '2nd Shift'];
export const GROUPS = ['A', 'B', 'C', 'D'];
export const THANAS = [
  'Rangpur Sadar',
  'Mithapukur',
  'Badarganj',
  'Gangachara',
  'Kaunia',
  'Pirgachha',
  'Pirganj',
  'Taraganj',
];

export const generateDonorCode = (profiles: { user_code?: string }[]): string => {
  if (!profiles || profiles.length === 0) return '10001';
  const codes = profiles
    .map((p) => parseInt(p.user_code || '0', 10))
    .filter((c) => !isNaN(c));
  const max = codes.length > 0 ? Math.max(...codes) : 10000;
  return String(max + 1).padStart(5, '0');
};

export const isEligible = (lastDonationDate: string | null): boolean => {
  if (!lastDonationDate) return true;
  const last = new Date(lastDonationDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 90;
};

export const daysUntilEligible = (lastDonationDate: string | null): number => {
  if (!lastDonationDate) return 0;
  const last = new Date(lastDonationDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - diffDays);
};

export const formatDate = (date: string | null): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const relativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date);
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const bloodGroupColor = (bg: string): string => {
  const map: Record<string, string> = {
    'A+': 'bg-rose-100 text-rose-700 border-rose-300',
    'A-': 'bg-rose-100 text-rose-700 border-rose-300',
    'B+': 'bg-blue-100 text-blue-700 border-blue-300',
    'B-': 'bg-blue-100 text-blue-700 border-blue-300',
    'AB+': 'bg-purple-100 text-purple-700 border-purple-300',
    'AB-': 'bg-purple-100 text-purple-700 border-purple-300',
    'O+': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'O-': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };
  return map[bg] || 'bg-gray-100 text-gray-700 border-gray-300';
};

export const roleColor = (role: string): string => {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-300',
    rcy: 'bg-green-100 text-green-700 border-green-300',
    donor: 'bg-blue-100 text-blue-700 border-blue-300',
  };
  return map[role] || 'bg-gray-100 text-gray-600 border-gray-300';
};

export const roleLabel = (role: string): string => {
  const map: Record<string, string> = {
    admin: 'Admin',
    rcy: 'RCY',
    donor: 'Donor',
  };
  return map[role] || role;
};

export const exportCSV = (
  data: Record<string, unknown>[],
  filename = 'export.csv'
): void => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = (): string => new Date().toISOString();
