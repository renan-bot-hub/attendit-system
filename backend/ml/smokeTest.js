// Manual sanity check for the saved risk model. Walks six hand-crafted
// student profiles (perfect → extreme) and prints tier + probabilities.
// Run with: node ml/smokeTest.js

const riskModel = require('./riskModel');

const cases = [
  { name: 'Perfect attendance',
    signals: { attendanceRate: 100, consecutiveAbsences: 0, totalAbsences: 0,
               lateCount: 0, last7DayAbsences: 0, last30DayAbsences: 0, worstWeekdayAbsenceRate: 0 } },
  { name: 'Mostly fine, a couple lates',
    signals: { attendanceRate: 95, consecutiveAbsences: 0, totalAbsences: 1,
               lateCount: 2, last7DayAbsences: 0, last30DayAbsences: 1, worstWeekdayAbsenceRate: 0.1 } },
  { name: 'Warning zone — 3 absences building up',
    signals: { attendanceRate: 88, consecutiveAbsences: 2, totalAbsences: 3,
               lateCount: 4, last7DayAbsences: 1, last30DayAbsences: 3, worstWeekdayAbsenceRate: 0.3 } },
  { name: 'High Risk — long consecutive streak forming',
    signals: { attendanceRate: 82, consecutiveAbsences: 3, totalAbsences: 4,
               lateCount: 2, last7DayAbsences: 3, last30DayAbsences: 4, worstWeekdayAbsenceRate: 0.4 } },
  { name: 'Critical — chronic absenteeism',
    signals: { attendanceRate: 60, consecutiveAbsences: 6, totalAbsences: 9,
               lateCount: 4, last7DayAbsences: 5, last30DayAbsences: 9, worstWeekdayAbsenceRate: 0.7 } },
  { name: 'Critical — extreme',
    signals: { attendanceRate: 40, consecutiveAbsences: 10, totalAbsences: 15,
               lateCount: 2, last7DayAbsences: 6, last30DayAbsences: 15, worstWeekdayAbsenceRate: 0.85 } },
];

(async () => {
  for (const c of cases) {
    const pred = await riskModel.predict(c.signals);
    console.log(`\n${c.name}`);
    console.log(`  score=${pred.score}  tier=${pred.tier}`);
    console.log(`  probs:`, pred.probabilities);
  }
})().catch((err) => { console.error(err); process.exit(1); });
