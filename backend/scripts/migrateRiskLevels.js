require('../config/env');

const mongoose = require('mongoose');
const AIAlert = require('../models/AIAlert');
const Case = require('../models/Case');

async function migrateModel(Model, name) {
  const updates = [
    Model.updateMany({ riskLevel: 'Low Risk' }, { $set: { riskLevel: 'Low' } }),
    Model.updateMany({ riskLevel: 'Medium Risk' }, { $set: { riskLevel: 'Moderate' } }),
    Model.updateMany({ riskLevel: { $in: ['High Risk', 'Critical'] } }, { $set: { riskLevel: 'High' } }),
  ];
  const results = await Promise.all(updates);
  const modified = results.reduce((total, result) => total + (result.modifiedCount || 0), 0);
  console.log(`${name}: migrated ${modified} document(s)`);
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  await migrateModel(AIAlert, 'AIAlert');
  await migrateModel(Case, 'Case');
}

main()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Risk level migration complete.');
  })
  .catch(async (err) => {
    await mongoose.disconnect().catch(() => {});
    console.error('Risk level migration failed:', err.message);
    process.exit(1);
  });
