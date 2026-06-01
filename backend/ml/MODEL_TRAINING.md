# Attendance Risk Model Training

This folder contains the TensorFlow.js attendance-risk model used by the AI
alert module. The deployed inference contract stays intentionally small:

1. `attendanceRate`
2. `consecutiveAbsences`
3. `totalAbsences`
4. `lateCount`
5. `last7DayAbsences`
6. `last30DayAbsences`
7. `worstWeekdayAbsenceRate`

The current checked-in model can run the system, but it must not be presented as
a production-trained school model until it is retrained with anonymized
historical attendance data.

## Required Real Dataset

Use one anonymized CSV or JSON export. Do not commit the real file.

Preferred aggregated format, one row per student:

```csv
student_id,attendance_rate,consecutive_absences,total_absences,late_count,last7_day_absences,last30_day_absences,worst_weekday_absence_rate,risk_label
anon-001,98,0,0,1,0,0,0.00,Low Risk
```

Supported `risk_label` values are `Low Risk`, `Medium Risk`, `High Risk`,
`Critical`, or numeric labels `0` to `3`. If `risk_label` is missing, the
training script applies the manuscript's rule thresholds to create the label.

Raw attendance-log format is also supported:

```csv
student_id,date,status
anon-001,2026-01-10,Present
anon-001,2026-01-11,Absent
```

Supported statuses are `Present`, `Late`, `Tardy`, `Absent`, `Excused`, and
`Unexcused`. Excused and unexcused absences are both counted as absences for risk
prediction; keep the justification workflow as the place where staff review the
reason.

## Privacy Rules

Place real data under `ml/private-data/` or use a filename like
`ml/training-data-2026.csv`. Those paths are gitignored.

The loader excludes direct sensitive fields such as names, emails, phone
numbers, parent contact details, and addresses. Student identifiers are hashed
with SHA-256 using the salt you provide, and the raw identifiers are not stored
in `model.json`, `weights.bin`, or `meta.json`.

Use a private salt:

```powershell
npm.cmd run ml:train -- --data .\ml\private-data\historical-attendance.csv --salt "replace-with-private-random-salt"
```

For a production run, require a real dataset:

```powershell
npm.cmd run ml:train -- --production --data .\ml\private-data\historical-attendance.csv --salt "replace-with-private-random-salt"
```

## Training And Evaluation

The training script:

- cleans and normalizes CSV/JSON fields
- hashes student identifiers
- encodes the 7 normalized model features
- splits data into train, validation, and test sets
- trains a TensorFlow.js dense neural network
- reports accuracy, precision, recall, F1, AUC, and a confusion matrix
- writes model metadata to `ml/model/meta.json`

Demo-only synthetic training is still available for local smoke tests:

```powershell
npm.cmd run ml:train:demo
```

Do not use demo/synthetic metrics as capstone evidence of real-world model
accuracy.

## Rule-Based Fallback

The AI alert controller first tries the TensorFlow.js model. If inference fails
or the model files are unavailable, it falls back to the existing rule-based
decision support:

- critical attendance percentage
- consecutive absences
- total absences
- frequent tardiness
- day-of-week absence pattern

Generated alerts now store `scorer`, `modelVersion`, and
`modelProbabilities` when the model is used. This gives the school a monitoring
trail for later comparison against actual attendance outcomes.

## Monitoring And Drift Checks

After deployment, export monthly alert results and compare:

- prediction distribution by risk level
- percentage handled by `scorer=model` versus `scorer=rules`
- false positive and false negative rate after staff review
- precision/recall for High Risk and Critical students
- changes in attendance feature distributions compared with the training set

Retrain when the attendance policy changes, school schedules change, or model
metrics drift below the acceptance threshold approved by the school.

## Production Readiness Criteria

The AI model is production-ready only after all of these are true:

- real anonymized school history was used
- training/test metrics are documented in `meta.json`
- High Risk and Critical recall are acceptable to the school
- the fallback rules still match the manuscript's intervention policy
- the model was smoke-tested with `npm.cmd run ml:smoke`
- private datasets and salts are not committed
