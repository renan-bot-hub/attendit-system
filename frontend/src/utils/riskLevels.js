export const RISK_LEVELS = ['Low', 'Moderate', 'High'];

export function normalizeRiskLevel(value, fallback = 'Moderate') {
  const key = String(value || '').trim();
  const map = {
    Low: 'Low',
    'Low Risk': 'Low',
    Moderate: 'Moderate',
    'Medium Risk': 'Moderate',
    High: 'High',
    'High Risk': 'High',
    Critical: 'High',
  };
  return map[key] || fallback;
}

export function riskBadgeClass(value) {
  const level = normalizeRiskLevel(value);
  if (level === 'High') return 'bg-red-100 text-red-700 border-red-200';
  if (level === 'Moderate') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

export function riskTextClass(value) {
  const level = normalizeRiskLevel(value);
  if (level === 'High') return 'text-red-600';
  if (level === 'Moderate') return 'text-amber-600';
  return 'text-emerald-600';
}

export function riskBarClass(value) {
  const level = normalizeRiskLevel(value);
  if (level === 'High') return 'bg-red-500';
  if (level === 'Moderate') return 'bg-amber-500';
  return 'bg-emerald-500';
}
