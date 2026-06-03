# Attend-IT-Backend

## Production readiness checklist

Before deployment:

1. Rotate the MongoDB Atlas database user password from Atlas Database Access.
2. Update `MONGO_URI` in your local `.env` and in Render/environment variables.
3. Use a unique `JWT_SECRET` with at least 32 characters.
4. Keep `.env`, `node_modules/`, and database exports out of git.
5. Keep `ALLOW_PUBLIC_STAFF_SIGNUP=false` in production.
6. Keep `ALLOW_UNLINKED_PARENT_REGISTRATION=false` unless the school has another verification flow.

Local setup:

```powershell
npm.cmd install
copy .env.example .env
# Edit .env and replace JWT_SECRET plus MONGO_URI before starting.
npm.cmd run dev
```

Run backend tests:

```powershell
npm.cmd test
```

## Seed bulk test students

Students are data-only records in this system. They appear in Student
Management, attendance, reports, QR flows, and AI analysis, but they do not use
the web login screen. Use an admin, teacher, or staff account for web login.

Create or update 200 deterministic test students:

```powershell
npm.cmd run seed:test-students
```

Create the same students plus seeded sessions and attendance history for AI and
risk-analysis testing:

```powershell
npm.cmd run seed:test-students -- --count=200 --with-attendance
```

Preview without writing to MongoDB:

```powershell
npm.cmd run seed:test-students -- --count=200 --with-attendance --dry-run
```

The script is non-destructive: it upserts records whose IDs start with
`AIT-TEST` and does not delete existing students. Change the generated group
with `--prefix=AIT-BATCH2` if you need another independent test set.

## Attendance risk model

The AI alert module uses the TensorFlow.js model in `ml/model/`. The training
pipeline now supports real anonymized school attendance exports and keeps
synthetic data as a demo-only fallback.

Use this only with a private dataset that is not committed:

```powershell
npm.cmd run ml:train -- --production --data .\ml\private-data\historical-attendance.csv --salt "private-random-salt"
npm.cmd run ml:smoke
```

See `ml/MODEL_TRAINING.md` for the required CSV/JSON schema, privacy rules,
evaluation metrics, fallback behavior, and model-monitoring checklist.

## MongoDB database merge

The unified web + mobile backend should use one MongoDB database:

```txt
attend_it
```

If old mobile records still live in `attendit_db`, preview the merge first:

```powershell
npm.cmd run db:merge:dry
```

If the dry run looks correct, copy missing records into `attend_it`:

```powershell
npm.cmd run db:merge
```

The merge script does not delete data and does not overwrite documents whose
`_id` already exists in the target database.

## Import a Compass export from the mobile database

If you exported `attendit_db` from MongoDB Compass, extract the ZIP at the repo
root so the JSON files sit here:

```txt
attendit-db-import/attendit_db/users.json
```

Preview the import:

```powershell
npm.cmd run mobile:import:dry
```

Apply it:

```powershell
npm.cmd run mobile:import
```

This maps mobile `users` into the unified `users` collection. Mobile-only
collections are preserved as `mobile_attendance_logs`, `mobile_qr_sessions`,
`mobile_email_verifications`, and `mobile_otps`.

Keep the extracted Compass export under `attendit-db-import/`; that folder is
gitignored because it may contain real student and parent data.
