// Loads the trained TF.js classifier from ml/model/ and exposes a
// predict(signals) helper. Returns { tier, score, probabilities }.
// Throws on first call if the model files aren't on disk yet — the
// AI alert controller catches that and falls back to a rule engine.

const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const { extractFeatures, RISK_TIERS } = require('./featureSpec');

const MODEL_DIR  = path.resolve(__dirname, 'model');
const MODEL_JSON = path.join(MODEL_DIR, 'model.json');

let _model = null;
let _meta  = null;
let _loadPromise = null;

function fileLoadHandler(dir) {
  return {
    load: async () => {
      const modelTopologyJSON = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8'));
      const weightSpecs = modelTopologyJSON.weightsManifest.flatMap((g) => g.weights);
      const buffers = modelTopologyJSON.weightsManifest
        .map((g) => g.paths.map((p) => fs.readFileSync(path.join(dir, p))))
        .flat();
      const totalLen = buffers.reduce((s, b) => s + b.byteLength, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const b of buffers) {
        merged.set(new Uint8Array(b.buffer, b.byteOffset, b.byteLength), offset);
        offset += b.byteLength;
      }
      return {
        modelTopology: modelTopologyJSON.modelTopology,
        format: modelTopologyJSON.format,
        generatedBy: modelTopologyJSON.generatedBy,
        weightSpecs,
        weightData: merged.buffer,
      };
    },
  };
}

async function load() {
  if (_model) return _model;
  if (_loadPromise) return _loadPromise;
  if (!fs.existsSync(MODEL_JSON)) {
    throw new Error(`Risk model not found at ${MODEL_JSON} — run "node ml/train.js"`);
  }
  _loadPromise = (async () => {
    _model = await tf.loadLayersModel(fileLoadHandler(MODEL_DIR));
    const metaPath = path.join(MODEL_DIR, 'meta.json');
    _meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;
    return _model;
  })();
  return _loadPromise;
}

async function predict(signals) {
  await load();
  const features = extractFeatures(signals);
  const x = tf.tensor2d([features]);
  const out = _model.predict(x);
  const probs = (await out.data());
  tf.dispose([x, out]);

  let bestIdx = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[bestIdx]) bestIdx = i;
  const tier = RISK_TIERS[bestIdx];

  const weights = [10, 40, 70, 95];
  let score = 0;
  for (let i = 0; i < probs.length; i++) score += probs[i] * weights[i];

  return {
    tier,
    score: Math.round(score),
    probabilities: Object.fromEntries(RISK_TIERS.map((t, i) => [t, +probs[i].toFixed(4)])),
  };
}

function isReady() { return _model !== null; }
function meta()    { return _meta; }

module.exports = { load, predict, isReady, meta, RISK_TIERS };
