import { endOfDay, startOfDay, toDateInput } from './format';

export const PERIODS = [
  { v: 'today', l: 'Bugun' },
  { v: '7d', l: '7 kun' },
  { v: 'month', l: 'Shu oy' },
  { v: '30d', l: '30 kun' },
  { v: 'all', l: 'Hammasi' },
  { v: 'custom', l: 'Boshqa…' },
];

// Davr -> { from, to } ISO satrlari
export function periodRange(period, custom = {}) {
  const now = new Date();
  const today = toDateInput(now);
  switch (period) {
    case 'today':
      return { from: startOfDay(today).toISOString(), to: endOfDay(today).toISOString() };
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: startOfDay(toDateInput(d)).toISOString(), to: endOfDay(today).toISOString() };
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: startOfDay(toDateInput(d)).toISOString(), to: endOfDay(today).toISOString() };
    }
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: endOfDay(today).toISOString() };
    case 'custom':
      return {
        from: custom.from ? startOfDay(custom.from).toISOString() : undefined,
        to: custom.to ? endOfDay(custom.to).toISOString() : undefined,
      };
    default:
      return {};
  }
}
