// Imports a MongoDB Compass JSON export from the old mobile database into the
// unified database configured by MONGO_URI. Users are mapped into the real
// users collection; mobile-only collections are preserved with a mobile_ prefix.

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
require('../config/env');

const User = require('../models/User');

const DEFAULT_EXPORT_DIR = path.resolve(__dirname, '..', '..', 'attendit-db-import', 'attendit_db');
const LEGACY_COLLECTIONS = {
  attendance_logs: 'mobile_attendance_logs',
  qr_sessions: 'mobile_qr_sessions',
  email_verification: 'mobile_email_verifications',
  otps: 'mobile_otps',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--dir') args.dir = argv[++i];
  }
  return args;
}

function reviveExtendedJson(_key, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (typeof value.$oid === 'string') return new mongoose.Types.ObjectId(value.$oid);
    if (typeof value.$date === 'string') return new Date(value.$date);
  }
  return value;
}

function readExportFile(exportDir, collectionName) {
  const filePath = path.join(exportDir, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];

  const parsed = JSON.parse(raw, reviveExtendedJson);
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array exported from Compass.`);
  }
  return parsed;
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function mapMobileUser(doc) {
  const role = ['parent', 'teacher', 'staff', 'student', 'admin'].includes(doc.role)
    ? doc.role
    : 'parent';
  const email = normalizeEmail(doc.email);
  const studentNumber = doc.studentNumber || doc.studentId || null;
  const gradeSection = doc.gradeSection || doc.section || null;
  const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt : new Date();

  return {
    _id: doc._id,
    name: doc.name,
    email,
    password: doc.password,
    role,
    studentId: studentNumber,
    studentNumber,
    section: gradeSection,
    gradeSection,
    teacherNumber: doc.teacherNumber || null,
    birthdate: doc.birthdate || null,
    contactNumber: doc.contactNumber || null,
    parentName: role === 'parent' ? doc.name : null,
    parentEmail: role === 'parent' ? email : null,
    parentPhone: role === 'parent' ? doc.contactNumber || null : null,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : updatedAt,
    updatedAt,
  };
}

async function importUsers(users, dryRun) {
  const result = { source: users.length, inserted: 0, wouldInsert: 0, skipped: 0, errors: [] };

  for (const doc of users) {
    const mapped = mapMobileUser(doc);
    if (!mapped.name || !mapped.email || !mapped.password) {
      result.skipped += 1;
      result.errors.push(`Skipped user with missing name/email/password: ${doc._id || '(no _id)'}`);
      continue;
    }

    const existing = await User.findOne({
      $or: [
        { _id: mapped._id },
        { email: mapped.email },
      ],
    }).select('_id email');

    if (existing) {
      result.skipped += 1;
      continue;
    }

    if (dryRun) {
      result.wouldInsert += 1;
      continue;
    }

    try {
      await User.create(mapped);
      result.inserted += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push(`User ${mapped.email}: ${err.message}`);
    }
  }

  return result;
}

async function preserveLegacyCollection(collectionName, docs, dryRun) {
  const result = { collection: collectionName, source: docs.length, inserted: 0, wouldInsert: 0, skipped: 0, errors: [] };
  const collection = mongoose.connection.db.collection(collectionName);

  for (const doc of docs) {
    const existing = await collection.findOne({ _id: doc._id }, { projection: { _id: 1 } });
    if (existing) {
      result.skipped += 1;
      continue;
    }

    if (dryRun) {
      result.wouldInsert += 1;
      continue;
    }

    try {
      await collection.insertOne(doc, { bypassDocumentValidation: true });
      result.inserted += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push(`${collectionName}: ${err.message}`);
    }
  }

  return result;
}

function printResult(label, result, dryRun) {
  const copied = dryRun ? result.wouldInsert : result.inserted;
  console.log([
    label,
    `source=${result.source}`,
    dryRun ? `wouldImport=${copied}` : `imported=${copied}`,
    `skipped=${result.skipped}`,
  ].join(' | '));

  for (const error of result.errors.slice(0, 10)) {
    console.log(`  ${error}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.apply || args.dryRun;
  const exportDir = path.resolve(args.dir || process.env.MOBILE_EXPORT_DIR || DEFAULT_EXPORT_DIR);

  if (!fs.existsSync(exportDir)) {
    throw new Error(`Mobile export folder not found: ${exportDir}`);
  }

  await connectDB();
  console.log(`${dryRun ? 'Dry run' : 'Applying import'} from ${exportDir}`);

  const users = readExportFile(exportDir, 'users');
  printResult('users -> users', await importUsers(users, dryRun), dryRun);

  for (const [sourceName, targetName] of Object.entries(LEGACY_COLLECTIONS)) {
    const docs = readExportFile(exportDir, sourceName);
    printResult(`${sourceName} -> ${targetName}`, await preserveLegacyCollection(targetName, docs, dryRun), dryRun);
  }

  if (dryRun) {
    console.log('\nNo data was changed. Run `npm.cmd run mobile:import` to import the export.');
  } else {
    console.log('\nMobile export import finished.');
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
