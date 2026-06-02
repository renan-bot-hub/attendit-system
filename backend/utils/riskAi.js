const tf = require("@tensorflow/tfjs");

const trainingInputs = tf.tensor2d([
  [9, 1, 0],
  [8, 1, 1],
  [7, 2, 1],
  [6, 2, 2],
  [5, 3, 2],
  [4, 3, 3],
  [3, 3, 4],
  [2, 4, 4],
  [1, 4, 5],
  [0, 3, 7],
]);

const trainingOutputs = tf.tensor2d([
  [1, 0, 0, 0], // Low
  [1, 0, 0, 0], // Low
  [0, 1, 0, 0], // Moderate
  [0, 1, 0, 0], // Moderate
  [0, 1, 0, 0], // Moderate
  [0, 0, 1, 0], // High
  [0, 0, 1, 0], // High
  [0, 0, 1, 0], // High
  [0, 0, 0, 1], // Critical
  [0, 0, 0, 1], // Critical
]);

let model;

async function trainRiskModel() {
  model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [3],
      units: 8,
      activation: "relu",
    })
  );

  model.add(
    tf.layers.dense({
      units: 4,
      activation: "softmax",
    })
  );

  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(trainingInputs, trainingOutputs, {
    epochs: 250,
    verbose: 0,
  });

  console.log("TensorFlow attendance risk model trained successfully.");
}

async function predictRiskLevel({ present, late, absent }) {
  if (!model) {
    await trainRiskModel();
  }

  const input = tf.tensor2d([[present, late, absent]]);
  const prediction = model.predict(input);
  const scores = await prediction.data();

  const labels = ["Low", "Moderate", "High", "Critical"];
  const maxIndex = scores.indexOf(Math.max(...scores));
  const riskLevel = labels[maxIndex];

  return {
    riskLevel,
    confidence: Number(scores[maxIndex].toFixed(2)),
    recommendation: getRecommendation(riskLevel),
  };
}

function getRecommendation(riskLevel) {
  switch (riskLevel) {
    case "Low":
      return "Continue regular monitoring. Student attendance is stable.";
    case "Moderate":
      return "Notify parent and monitor attendance closely.";
    case "High":
      return "Teacher should contact parent and prepare intervention.";
    case "Critical":
      return "Refer student to guidance office and schedule parent conference.";
    default:
      return "Continue monitoring attendance.";
  }
}

module.exports = {
  trainRiskModel,
  predictRiskLevel,
};