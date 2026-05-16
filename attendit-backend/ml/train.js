// Trains the attendance-risk classifier and saves it under ml/model/.
// Run with: node ml/train.js
// Outputs: model.json, weights.bin, meta.json.

const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const { generate } = require('./dataset');
const { FEATURE_NAMES, RISK_TIERS } = require('./featureSpec');

const MODEL_DIR = path.resolve(__dirname, 'model');

function fileSaveHandler(dir) {
  return {
    save: async (artifacts) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'weights.bin'), Buffer.from(artifacts.weightData));
      const modelJSON = {
        modelTopology: artifacts.modelTopology,
        format: artifacts.format,
        generatedBy: artifacts.generatedBy,
        convertedBy: artifacts.convertedBy,
        weightsManifest: [{
          paths: ['weights.bin'],
          weights: artifacts.weightSpecs,
        }],
      };
      fs.writeFileSync(path.join(dir, 'model.json'), JSON.stringify(modelJSON, null, 2));
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    },
  };
}

function buildModel(numFeatures, numClasses) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [numFeatures], units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

function trainTestSplit(X, y, valFrac = 0.2) {
  const idx = X.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const cut = Math.floor(idx.length * (1 - valFrac));
  const trainIdx = idx.slice(0, cut);
  const valIdx   = idx.slice(cut);
  return {
    Xtr: trainIdx.map((i) => X[i]),
    ytr: trainIdx.map((i) => y[i]),
    Xv:  valIdx.map((i) => X[i]),
    yv:  valIdx.map((i) => y[i]),
  };
}

(async () => {
  console.log('Generating synthetic dataset…');
  const { X, y } = generate({ n: 6000 });
  const { Xtr, ytr, Xv, yv } = trainTestSplit(X, y, 0.2);
  console.log(`  train: ${Xtr.length}  validation: ${Xv.length}`);

  const xs   = tf.tensor2d(Xtr);
  const ys   = tf.oneHot(tf.tensor1d(ytr, 'int32'), RISK_TIERS.length);
  const xsV  = tf.tensor2d(Xv);
  const ysV  = tf.oneHot(tf.tensor1d(yv, 'int32'), RISK_TIERS.length);

  const model = buildModel(FEATURE_NAMES.length, RISK_TIERS.length);
  console.log('\nModel summary:');
  model.summary();

  console.log('\nTraining…');
  const history = await model.fit(xs, ys, {
    epochs: 40,
    batchSize: 64,
    validationData: [xsV, ysV],
    shuffle: true,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch === 0 || (epoch + 1) % 5 === 0 || epoch === 39) {
          console.log(
            `  epoch ${String(epoch + 1).padStart(2)}/40 ` +
            `loss=${logs.loss.toFixed(4)} acc=${logs.acc.toFixed(4)}  ` +
            `val_loss=${logs.val_loss.toFixed(4)} val_acc=${logs.val_acc.toFixed(4)}`
          );
        }
      },
    },
  });

  const evalRes = model.evaluate(xsV, ysV);
  const valLoss = (await evalRes[0].data())[0];
  const valAcc  = (await evalRes[1].data())[0];
  console.log(`\nFinal validation: loss=${valLoss.toFixed(4)} acc=${valAcc.toFixed(4)}`);

  const preds = model.predict(xsV);
  const predClasses = preds.argMax(-1).arraySync();
  const cm = Array.from({ length: RISK_TIERS.length }, () => Array(RISK_TIERS.length).fill(0));
  for (let i = 0; i < yv.length; i++) cm[yv[i]][predClasses[i]]++;
  console.log('\nConfusion matrix (rows = true, cols = predicted):');
  console.log('             ' + RISK_TIERS.map((t) => t.slice(0, 4).padStart(7)).join(''));
  cm.forEach((row, i) => {
    console.log(RISK_TIERS[i].padEnd(13) + row.map((v) => String(v).padStart(7)).join(''));
  });

  await model.save(fileSaveHandler(MODEL_DIR));

  const meta = {
    featureNames: FEATURE_NAMES,
    classes: RISK_TIERS,
    trainedAt: new Date().toISOString(),
    valLoss, valAcc,
    history: {
      lossLast: history.history.loss?.slice(-1)[0],
      accLast:  history.history.acc?.slice(-1)[0],
    },
  };
  fs.writeFileSync(path.join(MODEL_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log(`\nSaved to ${MODEL_DIR}`);
  console.log('Run inference via require("./ml/riskModel").predict(signals)');
})().catch((err) => { console.error(err); process.exit(1); });
