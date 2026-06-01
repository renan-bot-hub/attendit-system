// Copies missing documents from the old mobile database into the unified
// database. This never deletes data and it skips documents whose _id already
// exists in the target database.

const mongoose = require('mongoose');
const connectDB = require('../config/db');
require('../config/env');

const DEFAULT_SOURCE_DB = 'attendit_db';
const DEFAULT_TARGET_DB = 'attend_it';
const MAX_ERRORS_TO_SHOW = 10;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--source') args.source = argv[++i];
    else if (arg === '--target') args.target = argv[++i];
  }
  return args;
}

function databaseFromMongoUri(uri) {
  const match = String(uri || '').match(/^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?[^/?]+\/([^?]+)/i);
  return match?.[1] || null;
}

async function collectionExists(db, name) {
  const found = await db.listCollections({ name }).toArray();
  return found.length > 0;
}

async function copyCollection({ sourceDb, targetDb, name, dryRun }) {
  const sourceCollection = sourceDb.collection(name);
  const targetCollection = targetDb.collection(name);

  const sourceCount = await sourceCollection.countDocuments();
  const targetCountBefore = await targetCollection.countDocuments().catch(() => 0);

  let inserted = 0;
  let wouldInsert = 0;
  let skippedExistingId = 0;
  let conflicts = 0;
  const errors = [];

  const cursor = sourceCollection.find({});
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const existing = await targetCollection.findOne({ _id: doc._id }, { projection: { _id: 1 } });

    if (existing) {
      skippedExistingId += 1;
      continue;
    }

    if (dryRun) {
      wouldInsert += 1;
      continue;
    }

    try {
      await targetCollection.insertOne(doc, { bypassDocumentValidation: true });
      inserted += 1;
    } catch (err) {
      conflicts += 1;
      if (errors.length < MAX_ERRORS_TO_SHOW) {
        errors.push(err.message);
      }
    }
  }

  const targetCountAfter = dryRun
    ? targetCountBefore
    : await targetCollection.countDocuments().catch(() => targetCountBefore + inserted);

  return {
    collection: name,
    sourceCount,
    targetCountBefore,
    targetCountAfter,
    wouldInsert,
    inserted,
    skippedExistingId,
    conflicts,
    errors,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceName = args.source || process.env.MOBILE_SOURCE_DB || DEFAULT_SOURCE_DB;
  const targetName = args.target || process.env.UNIFIED_TARGET_DB || databaseFromMongoUri(process.env.MONGO_URI) || DEFAULT_TARGET_DB;
  const dryRun = !args.apply || args.dryRun;

  if (sourceName === targetName) {
    throw new Error(`Source and target database are both "${sourceName}". Pick two different database names.`);
  }

  await connectDB();

  const client = mongoose.connection.getClient();
  const sourceDb = client.db(sourceName);
  const targetDb = client.db(targetName);

  const sourceCollections = await sourceDb.listCollections().toArray();
  if (sourceCollections.length === 0) {
    throw new Error(`Source database "${sourceName}" has no collections or could not be found.`);
  }

  console.log(`${dryRun ? 'Dry run' : 'Applying merge'}: ${sourceName} -> ${targetName}`);

  const results = [];
  for (const collection of sourceCollections) {
    if (collection.name.startsWith('system.')) continue;

    if (!(await collectionExists(sourceDb, collection.name))) continue;
    results.push(await copyCollection({
      sourceDb,
      targetDb,
      name: collection.name,
      dryRun,
    }));
  }

  for (const result of results) {
    const copied = dryRun ? result.wouldInsert : result.inserted;
    console.log([
      result.collection,
      `source=${result.sourceCount}`,
      `targetBefore=${result.targetCountBefore}`,
      dryRun ? `wouldCopy=${copied}` : `copied=${copied}`,
      `skippedSameId=${result.skippedExistingId}`,
      `conflicts=${result.conflicts}`,
      `targetAfter=${result.targetCountAfter}`,
    ].join(' | '));

    for (const error of result.errors) {
      console.log(`  conflict: ${error}`);
    }
  }

  if (dryRun) {
    console.log('\nNo data was changed. Run `npm.cmd run db:merge` to copy missing documents.');
  } else {
    console.log('\nMerge finished. Keep MONGO_URI pointed at the target database only.');
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
