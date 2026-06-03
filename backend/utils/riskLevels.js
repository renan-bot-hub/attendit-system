const RISK_LEVELS = ['Low', 'Moderate', 'High'];

const LEGACY_RISK_MAP = {
  Low: 'Low',
  'Low Risk': 'Low',
  Moderate: 'Moderate',
  'Medium Risk': 'Moderate',
  High: 'High',
  'High Risk': 'High',
  Critical: 'High',
};

const RISK_INPUT_LEVELS = [...new Set([...RISK_LEVELS, ...Object.keys(LEGACY_RISK_MAP)])];

function normalizeRiskLevel(value, fallback = 'Moderate') {
  const key = String(value || '').trim();
  return LEGACY_RISK_MAP[key] || fallback;
}

function riskQueryValues(value) {
  const normalized = normalizeRiskLevel(value);
  if (normalized === 'Low') return ['Low', 'Low Risk'];
  if (normalized === 'High') return ['High', 'High Risk', 'Critical'];
  return ['Moderate', 'Medium Risk'];
}

function normalizeProbabilityMap(probabilities) {
  const result = { Low: 0, Moderate: 0, High: 0 };
  const entries = probabilities instanceof Map
    ? [...probabilities.entries()]
    : Object.entries(probabilities || {});

  for (const [label, value] of entries) {
    const normalized = normalizeRiskLevel(label);
    result[normalized] += Number(value) || 0;
  }

  return Object.fromEntries(
    Object.entries(result).map(([label, value]) => [label, Number(value.toFixed(4))])
  );
}

module.exports = {
  RISK_LEVELS,
  RISK_INPUT_LEVELS,
  normalizeRiskLevel,
  riskQueryValues,
  normalizeProbabilityMap,
};
