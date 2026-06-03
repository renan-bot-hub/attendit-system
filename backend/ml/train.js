// Trains the attendance-risk classifier and saves it under ml/model/.
//
// Real-data training:
//   node ml/train.js --data ./ml/training-data.csv --salt "school-secret"
//
// Demo/synthetic training:
//   node ml/train.js --source synthetic

const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const { generate } = require('./dataset');
const { loadHistoricalDataset } = require('./realData');
const {
  CLASS_LABELS,
  FEATURE_NAMES,
  FEATURE_SCHEMA,
  MODEL_TASK,
  MODEL_VERSION,
} = require('./featureSpec');

const MODEL_DIR = path.resolve(__dirname, 'model');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

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
  model.add(tf.layers.dense({ inputShape: [numFeatures], units: 32, activation: 'relu', name: 'features_dense_1' }));
  model.add(tf.layers.dropout({ rate: 0.2, name: 'regularization_dropout_1' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.1, name: 'regularization_dropout_2' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax', name: 'risk_classification' }));
  model.compile({
    optimizer: tf.train.adam(0.003),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

function splitDataset(X, y, ratios = { train: 0.7, validation: 0.15, test: 0.15 }) {
  const idx = X.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }

  const trainCut = Math.max(1, Math.floor(idx.length * ratios.train));
  const validationCut = Math.max(trainCut + 1, Math.floor(idx.length * (ratios.train + ratios.validation)));
  const trainIdx = idx.slice(0, trainCut);
  const validationIdx = idx.slice(trainCut, validationCut);
  const testIdx = idx.slice(validationCut);

  return {
    train: {
      X: trainIdx.map((i) => X[i]),
      y: trainIdx.map((i) => y[i]),
    },
    validation: {
      X: validationIdx.map((i) => X[i]),
      y: validationIdx.map((i) => y[i]),
    },
    test: {
      X: testIdx.map((i) => X[i]),
      y: testIdx.map((i) => y[i]),
    },
  };
}

function tensorsFor(split) {
  return {
    xs: tf.tensor2d(split.X),
    ys: tf.oneHot(tf.tensor1d(split.y, 'int32'), CLASS_LABELS.length),
  };
}

function argMax(row) {
  let best = 0;
  for (let i = 1; i < row.length; i++) {
    if (row[i] > row[best]) best = i;
  }
  return best;
}

function binaryAuc(scores, labels) {
  const positives = labels.filter(Boolean).length;
  const negatives = labels.length - positives;
  if (!positives || !negatives) return null;

  const pairs = scores.map((score, index) => ({ score, label: labels[index] }))
    .sort((a, b) => a.score - b.score);

  let rank = 1;
  let positiveRankSum = 0;
  for (let i = 0; i < pairs.length;) {
    let j = i + 1;
    while (j < pairs.length && pairs[j].score === pairs[i].score) j++;
    const averageRank = (rank + rank + (j - i) - 1) / 2;
    for (let k = i; k < j; k++) {
      if (pairs[k].label) positiveRankSum += averageRank;
    }
    rank += j - i;
    i = j;
  }

  return (positiveRankSum - (positives * (positives + 1)) / 2) / (positives * negatives);
}

function evaluateProbabilities(trueLabels, probabilities) {
  const predictions = probabilities.map(argMax);
  const confusion = Array.from({ length: CLASS_LABELS.length }, () => Array(CLASS_LABELS.length).fill(0));
  for (let i = 0; i < trueLabels.length; i++) {
    confusion[trueLabels[i]][predictions[i]]++;
  }

  const perClass = CLASS_LABELS.map((tier, index) => {
    const tp = confusion[index][index];
    const fp = confusion.reduce((sum, row, rowIndex) => rowIndex === index ? sum : sum + row[index], 0);
    const fn = confusion[index].reduce((sum, value, colIndex) => colIndex === index ? sum : sum + value, 0);
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    const auc = binaryAuc(
      probabilities.map((row) => row[index]),
      trueLabels.map((label) => label === index)
    );
    return {
      tier,
      precision: +precision.toFixed(4),
      recall: +recall.toFixed(4),
      f1: +f1.toFixed(4),
      auc: auc === null ? null : +auc.toFixed(4),
    };
  });

  const correct = predictions.filter((prediction, index) => prediction === trueLabels[index]).length;
  const macroF1 = perClass.reduce((sum, item) => sum + item.f1, 0) / perClass.length;
  const aucValues = perClass.map((item) => item.auc).filter((value) => value !== null);
  const macroAuc = aucValues.length ? aucValues.reduce((sum, value) => sum + value, 0) / aucValues.length : null;

  return {
    accuracy: trueLabels.length === 0 ? 0 : +(correct / trueLabels.length).toFixed(4),
    macroF1: +macroF1.toFixed(4),
    macroAuc: macroAuc === null ? null : +macroAuc.toFixed(4),
    perClass,
    confusionMatrix: confusion,
  };
}

async function predictProbabilities(model, xs) {
  const out = model.predict(xs);
  const tensor = Array.isArray(out) ? out[0] : out;
  const probabilities = await tensor.array();
  tf.dispose(out);
  return probabilities;
}

function loadTrainingData(args) {
  const dataPath = args.data || process.env.ATTENDIT_TRAINING_DATA;
  if (dataPath) {
    const absolutePath = path.resolve(process.cwd(), dataPath);
    console.log(`Loading anonymized historical training data from ${absolutePath}`);
    const dataset = loadHistoricalDataset(absolutePath, { salt: args.salt });
    return {
      ...dataset,
      source: 'historical',
      productionReady: true,
    };
  }

  if (args.production) {
    throw new Error('Production training requires --data or ATTENDIT_TRAINING_DATA.');
  }

  const n = Number(args.samples || 6000);
  console.warn('No historical dataset supplied. Training a synthetic DEMO model only.');
  const dataset = generate({ n });
  return {
    ...dataset,
    source: 'synthetic-demo',
    productionReady: false,
    stats: {
      rowCount: n,
      sampleCount: n,
      labelDistribution: Object.fromEntries(
        CLASS_LABELS.map((tier, index) => [tier, dataset.y.filter((label) => label === index).length])
      ),
      identifiersHashed: false,
    },
  };
}

function resetOutputDir(outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  for (const fileName of ['model.json', 'weights.bin', 'meta.json']) {
    const target = path.join(outputDir, fileName);
    if (fs.existsSync(target)) fs.unlinkSync(target);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const epochs = Number(args.epochs || 60);
  const batchSize = Number(args.batchSize || 64);
  const outputDir = path.resolve(process.cwd(), args.out || MODEL_DIR);
  const dataset = loadTrainingData(args);
  const splits = splitDataset(dataset.X, dataset.y);
  resetOutputDir(outputDir);

  console.log(`Samples: ${dataset.X.length}`);
  console.log(`  train: ${splits.train.X.length}`);
  console.log(`  validation: ${splits.validation.X.length}`);
  console.log(`  test: ${splits.test.X.length}`);

  const train = tensorsFor(splits.train);
  const validation = tensorsFor(splits.validation);
  const test = tensorsFor(splits.test);

  const model = buildModel(FEATURE_NAMES.length, CLASS_LABELS.length);
  console.log('\nModel summary:');
  model.summary();

  console.log('\nTraining...');
  const history = await model.fit(train.xs, train.ys, {
    epochs,
    batchSize,
    validationData: [validation.xs, validation.ys],
    shuffle: true,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch === 0 || (epoch + 1) % 5 === 0 || epoch === epochs - 1) {
          const acc = logs.acc ?? logs.accuracy ?? 0;
          const valAcc = logs.val_acc ?? logs.val_accuracy ?? 0;
          console.log(
            `  epoch ${String(epoch + 1).padStart(2)}/${epochs} ` +
            `loss=${logs.loss.toFixed(4)} acc=${acc.toFixed(4)} ` +
            `val_loss=${logs.val_loss.toFixed(4)} val_acc=${valAcc.toFixed(4)}`
          );
        }
      },
    },
  });

  const validationProbabilities = await predictProbabilities(model, validation.xs);
  const testProbabilities = await predictProbabilities(model, test.xs);
  const validationMetrics = evaluateProbabilities(splits.validation.y, validationProbabilities);
  const testMetrics = evaluateProbabilities(splits.test.y, testProbabilities);

  console.log('\nValidation metrics:', validationMetrics);
  console.log('\nTest metrics:', testMetrics);

  await model.save(fileSaveHandler(outputDir));

  const meta = {
    task: MODEL_TASK,
    version: MODEL_VERSION,
    featureNames: FEATURE_NAMES,
    featureSchema: FEATURE_SCHEMA,
    preprocessing: {
      type: 'min-max',
      description: 'Raw MongoDB-derived attendance features are clamped to each feature min/max and scaled into 0..1.',
    },
    classes: CLASS_LABELS,
    outputType: 'multi-class classification',
    trainedAt: new Date().toISOString(),
    dataSource: dataset.source,
    productionReady: dataset.productionReady,
    dataStats: dataset.stats,
    split: {
      train: splits.train.X.length,
      validation: splits.validation.X.length,
      test: splits.test.X.length,
    },
    trainingParameters: {
      epochs,
      batchSize,
      optimizer: 'adam',
      learningRate: 0.003,
      architecture: ['dense:32:relu', 'dropout:0.20', 'dense:32:relu', 'dropout:0.10', 'dense:3:softmax'],
    },
    metrics: {
      validation: validationMetrics,
      test: testMetrics,
    },
    privacy: {
      identifiersHashed: dataset.stats.identifiersHashed,
      sensitiveColumnsExcluded: dataset.stats.sensitiveColumnsExcluded || [],
      rawStudentIdentifiersStoredInModel: false,
    },
    fallback: {
      enabled: true,
      description: 'aiAlertController falls back to rule-based scoring if TensorFlow inference is unavailable or input data is incomplete.',
    },
    history: {
      lossLast: history.history.loss?.slice(-1)[0],
      accuracyLast: history.history.acc?.slice(-1)[0] ?? history.history.accuracy?.slice(-1)[0],
    },
  };
  fs.writeFileSync(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, 2));

  tf.dispose([train.xs, train.ys, validation.xs, validation.ys, test.xs, test.ys]);

  console.log(`\nSaved to ${outputDir}`);
  if (!dataset.productionReady) {
    console.warn('This model is synthetic-demo only. Do not describe it as production-trained.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
