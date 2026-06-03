export function cleanStudentName(name = '') {
  let cleaned = String(name).trim();
  const patterns = [
    /\bgrade\s*(?:7|8|9|10|11|12)\b/gi,
    /\bg(?:7|8|9|10|11|12)\b/gi,
    /\b(?:7|8|9|10|11|12)\s*-\s*(?:[a-z]+|gas|humss|stem|abm)\b/gi,
    /\bsection\s+[a-z0-9-]+\b/gi,
    /\b(?:gas|humss|stem|abm)\b/gi,
  ];

  for (const pattern of patterns) cleaned = cleaned.replace(pattern, ' ');

  return cleaned
    .replace(/[|,_]+/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || String(name).trim();
}

export function studentInitials(name = '') {
  return cleanStudentName(name)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function canonicalSectionName(value = '') {
  return String(value)
    .trim()
    .replace(/^grade\s+/i, '')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ');
}

export function normalizeSectionKey(value = '') {
  return canonicalSectionName(value).toLowerCase();
}

export function gradeNumber(value = '') {
  const match = String(value).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function inferGradeLevel(value = '') {
  const grade = gradeNumber(value);
  return grade === Number.MAX_SAFE_INTEGER ? '' : `Grade ${grade}`;
}

export function gradeComparator(a, b) {
  const gradeDiff = gradeNumber(a) - gradeNumber(b);
  if (gradeDiff) return gradeDiff;
  return String(a || '').localeCompare(String(b || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function sectionNameComparator(a, b) {
  const gradeDiff = gradeNumber(a) - gradeNumber(b);
  if (gradeDiff) return gradeDiff;
  return String(a || '').localeCompare(String(b || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function sectionObjectComparator(a, b) {
  const gradeDiff = gradeNumber(a.gradeLevel || a.name) - gradeNumber(b.gradeLevel || b.name);
  if (gradeDiff) return gradeDiff;
  return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
