const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { hashIdentifier, loadHistoricalDataset, parseCsv } = require('../ml/realData');

function tempFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'attendit-ml-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

test('parseCsv handles quoted commas', () => {
  const rows = parseCsv('student_id,note\n"anon,001","kept anonymous"\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].student_id, 'anon,001');
  assert.equal(rows[0].note, 'kept anonymous');
});

test('loadHistoricalDataset converts aggregated anonymized rows into feature vectors', () => {
  const header = 'student_id,name,email,attendance_rate,consecutive_absences,total_absences,late_count,last7_day_absences,last30_day_absences,worst_weekday_absence_rate,risk_label';
  const rows = Array.from({ length: 20 }, (_, index) => {
    const tier = index % 4;
    const labels = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'];
    const attendance = [98, 90, 84, 72][tier];
    const consecutive = [0, 0, 3, 5][tier];
    const total = [0, 2, 4, 6][tier];
    const late = [1, 5, 4, 6][tier];
    return [
      `S-${String(index + 1).padStart(3, '0')}`,
      `Student ${index + 1}`,
      `student${index + 1}@example.com`,
      attendance,
      consecutive,
      total,
      late,
      consecutive,
      total,
      tier * 0.2,
      labels[tier],
    ].join(',');
  });
  const file = tempFile('training.csv', [header, ...rows].join('\n'));

  const dataset = loadHistoricalDataset(file, { salt: 'test-salt' });

  assert.equal(dataset.X.length, 20);
  assert.equal(dataset.y.length, 20);
  assert.equal(dataset.X[0].length, 7);
  assert.equal(dataset.stats.identifiersHashed, true);
  assert.equal(dataset.samples[0].subjectHash, hashIdentifier('S-001', 'test-salt'));
  assert.equal(dataset.samples[0].name, undefined);
  assert.equal(dataset.stats.labelDistribution['Low Risk'], 5);
  assert.equal(dataset.stats.labelDistribution.Critical, 5);
});

test('loadHistoricalDataset can aggregate raw attendance rows by student', () => {
  const header = 'student_id,date,status';
  const rows = [];
  for (let student = 1; student <= 20; student++) {
    for (let day = 1; day <= 10; day++) {
      const status = student % 4 === 0 && day > 5 ? 'Absent' : day % 5 === 0 ? 'Late' : 'Present';
      rows.push(`R-${student},2026-01-${String(day).padStart(2, '0')},${status}`);
    }
  }
  const file = tempFile('raw.csv', [header, ...rows].join('\n'));

  const dataset = loadHistoricalDataset(file, { salt: 'raw-salt' });

  assert.equal(dataset.X.length, 20);
  assert.equal(dataset.stats.rowCount, 200);
  assert.ok(dataset.y.every((label) => Number.isInteger(label)));
});
