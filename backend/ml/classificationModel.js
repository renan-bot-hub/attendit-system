// TensorFlow.js attendance-risk classification service.
//
// Loads ml/model/model.json + weights.bin, validates the saved metadata, and
// exposes predict(signals) for backend controllers. The model is a multi-class
// classifier with output labels: Low, Moderate, High.

const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const {
  CLASS_LABELS,
  FEATURE_NAMES,
  FEATURE_SCHEMA,
  MODEL_TASK,
  MODEL_VERSION,
  extractFeatures,
} = require('./featureSpec');
const { normalizeRiskLevel } = require('../utils/riskLevels');

const MODEL_DIR = path.resolve(__dirname, 'model');
const MODEL_JSON = path.join(MODEL_DIR, 'model.json');
const META_JSON = path.join(MODEL_DIR, 'meta.json');

let model = null;
let metadata = null;
let loadPromise = null;

function fileLoadHandler(dir) {
  return {
    load: async () => {
      const modelJsonPath = path.join(dir, 'model.json');
      const modelTopologyJSON = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
      const manifest = modelTopologyJSON.weightsManifest || [];
      const weightSpecs = manifest.flatMap((group) => group.weights || []);
      const buffers = manifest
        .flatMap((group) => group.paths || [])
        .map((fileName) => fs.readFileSync(path.join(dir, fileName)));

      if (!weightSpecs.length || !buffers.length) {
        throw new Error('Classification model weights are missing or invalid.');
      }

      const totalBytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const buffer of buffers) {
        merged.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength), offset);
        offset += buffer.byteLength;
      }

      return {
        modelTopology: modelTopologyJSON.modelTopology,
        format: modelTopologyJSON.format,
        generatedBy: modelTopologyJSON.generatedBy,
        convertedBy: modelTopologyJSON.convertedBy,
        weightSpecs,
        weightData: merged.buffer,
      };
    },
  };
}

function readMetadata() {
  if (!fs.existsSync(META_JSON)) {
    throw new Error(`Classification metadata not found at ${META_JSON}. Retrain with "npm run ml:train".`);
  }
  return JSON.parse(fs.readFileSync(META_JSON, 'utf8'));
}

function validateMetadata(meta) {
  if (meta.task !== MODEL_TASK) {
    throw new Error(`Model task mismatch: expected ${MODEL_TASK}, found ${meta.task || 'unknown'}.`);
  }

  const classes = meta.classes || [];
  if (classes.length !== CLASS_LABELS.length || !classes.every((label, index) => label === CLASS_LABELS[index])) {
    throw new Error(`Model classes must be ${CLASS_LABELS.join(', ')}.`);
  }

  const features = meta.featureNames || [];
  if (features.length !== FEATURE_NAMES.length || !features.every((name, index) => name === FEATURE_NAMES[index])) {
    throw new Error(`Model feature contract mismatch. Expected ${FEATURE_NAMES.join(', ')}.`);
  }
}

async function load() {
  if (model) return model;
  if (loadPromise) return loadPromise;
  if (!fs.existsSync(MODEL_JSON)) {
    throw new Error(`Classification model not found at ${MODEL_JSON}. Run "npm run ml:train".`);
  }

  loadPromise = (async () => {
    const meta = readMetadata();
    validateMetadata(meta);
    const loaded = await tf.loadLayersModel(fileLoadHandler(MODEL_DIR));
    model = loaded;
    metadata = meta;
    console.log(`[ml] Loaded ${meta.version || MODEL_VERSION} from ${MODEL_DIR}`);
    return model;
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

async function predict(signals) {
  await load();

  const features = extractFeatures(signals);
  if (features.some((value) => !Number.isFinite(value))) {
    throw new Error('Invalid model input: all features must be finite numbers.');
  }

  const xs = tf.tensor2d([features], [1, FEATURE_NAMES.length]);
  const output = model.predict(xs);
  const probabilitiesTensor = Array.isArray(output) ? output[0] : output;
  const probabilitiesArray = Array.from(await probabilitiesTensor.data());
  tf.dispose([xs, probabilitiesTensor]);

  if (probabilitiesArray.length !== CLASS_LABELS.length) {
    throw new Error(`Model returned ${probabilitiesArray.length} classes; expected ${CLASS_LABELS.length}.`);
  }

  let bestIndex = 0;
  for (let index = 1; index < probabilitiesArray.length; index++) {
    if (probabilitiesArray[index] > probabilitiesArray[bestIndex]) bestIndex = index;
  }

  const probabilities = {};
  for (let index = 0; index < CLASS_LABELS.length; index++) {
    probabilities[CLASS_LABELS[index]] = +probabilitiesArray[index].toFixed(4);
  }

  const score =
    probabilities.Low * 10 +
    probabilities.Moderate * 50 +
    probabilities.High * 90;

  return {
    tier: normalizeRiskLevel(CLASS_LABELS[bestIndex]),
    score: Math.round(score),
    probabilities,
    modelVersion: metadata?.version || MODEL_VERSION,
  };
}

function isReady() {
  return model !== null;
}

function meta() {
  return metadata;
}

module.exports = {
  CLASS_LABELS,
  FEATURE_NAMES,
  FEATURE_SCHEMA,
  MODEL_TASK,
  MODEL_VERSION,
  isReady,
  load,
  meta,
  predict,
};
