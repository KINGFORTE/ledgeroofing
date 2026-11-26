export const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', tone: 'green' },
  { value: 'busy', label: 'Busy', tone: 'red' },
  { value: 'away', label: 'Away', tone: 'amber' },
  { value: 'dnd', label: 'Do Not Disturb', tone: 'slate' },
  { value: 'offline', label: 'Offline', tone: 'slate' },
];

export const EMPLOYMENT_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'contractor', label: 'Contractor' },
];

export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'message', label: 'Workspace message' },
  { value: 'email', label: 'Work email' },
  { value: 'phone', label: 'Work phone' },
];

export const ACHIEVEMENT_TYPES = [
  { value: 'milestone', label: 'Employee milestone' },
  { value: 'training', label: 'Training completed' },
  { value: 'certification', label: 'Professional certification' },
  { value: 'award', label: 'Award' },
  { value: 'recognition', label: 'Company recognition' },
  { value: 'accomplishment', label: 'Notable accomplishment' },
];

const TONES = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const DEFAULT_AVAILABILITY = AVAILABILITY_OPTIONS[0];

export function availabilityOption(value) {
  return AVAILABILITY_OPTIONS.find((option) => option.value === value) || DEFAULT_AVAILABILITY;
}

export function availabilityLabel(value) {
  return availabilityOption(value).label;
}

export function availabilityTone(value) {
  return TONES[availabilityOption(value).tone] || TONES.slate;
}

export function employmentLabel(value) {
  return EMPLOYMENT_OPTIONS.find((option) => option.value === value)?.label || 'Active';
}

export function achievementLabel(value) {
  return ACHIEVEMENT_TYPES.find((option) => option.value === value)?.label || 'Recognition';
}

export function preferredContactLabel(value) {
  return PREFERRED_CONTACT_OPTIONS.find((option) => option.value === value)?.label || 'Workspace message';
}

export function formatJoined(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initialsFor(name = '') {
  return String(name).trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
}
