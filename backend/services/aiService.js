const tf = require("@tensorflow/tfjs");

let model = null;

function calculateAttendanceRate(present, late, absent) {
  const total = present + late + absent;
  if (total === 0) return 0;

  const attendanceScore = present + late * 0.5;
  return attendanceScore / total;
}

function getRiskCategory(attendanceRate) {
  if (attendanceRate >= 0.85) return "Low Risk";
  if (attendanceRate >= 0.70) return "Moderate Risk";
  return "High Risk";
}

function getOutputLabel(riskLevel) {
  if (riskLevel === "Low Risk") return [1, 0, 0];
  if (riskLevel === "Moderate Risk") return [0, 1, 0];
  return [0, 0, 1];
}

function generateTrainingData() {
  const inputs = [];
  const outputs = [];

  for (let present = 0; present <= 10; present++) {
    for (let late = 0; late <= 10 - present; late++) {
      const absent = 10 - present - late;
      const total = present + late + absent;

      const attendanceRate = calculateAttendanceRate(present, late, absent);
      const lateRate = late / total;
      const absentRate = absent / total;
      const riskLevel = getRiskCategory(attendanceRate);

      inputs.push([present, late, absent, attendanceRate, lateRate, absentRate]);
      outputs.push(getOutputLabel(riskLevel));
    }
  }

  return {
    inputs: tf.tensor2d(inputs),
    outputs: tf.tensor2d(outputs),
  };
}

async function trainModel() {
  if (model) return model;

  const trainingData = generateTrainingData();

  model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [6],
      units: 10,
      activation: "relu",
    })
  );

  model.add(
    tf.layers.dense({
      units: 3,
      activation: "softmax",
    })
  );

  model.compile({
    optimizer: tf.train.adam(0.03),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(trainingData.inputs, trainingData.outputs, {
    epochs: 50,
    shuffle: true,
    verbose: 0,
  });

  trainingData.inputs.dispose();
  trainingData.outputs.dispose();

  console.log("TensorFlow AI model trained successfully.");

  return model;
}

function getPrescription(riskLevel) {
  if (riskLevel === "Low Risk") {
    return "Continue good attendance habits, maintain regular monitoring, and provide positive reinforcement.";
  }

  if (riskLevel === "Moderate Risk") {
    return "Monitor attendance weekly, notify the parent or guardian if the pattern continues, and encourage punctuality and consistent school attendance.";
  }

  if (riskLevel === "High Risk") {
    return "Schedule an intervention meeting, notify the parent or guardian, create an attendance improvement plan, and monitor the student closely.";
  }

  return "No attendance records are available yet. Continue collecting attendance data before generating a prescription.";
}

exports.predictRisk = async ({ present, late, absent }) => {
  const safePresent = Number(present) || 0;
  const safeLate = Number(late) || 0;
  const safeAbsent = Number(absent) || 0;

  const total = safePresent + safeLate + safeAbsent;

  if (total === 0) {
    return {
      attendanceRate: "0.00",
      lateRate: "0.00",
      absentRate: "0.00",
      riskLevel: "No Data",
      confidence: "0.00",
      prescription: getPrescription("No Data"),
      modelUsed: "TensorFlow.js Neural Network",
      trainingSource: "Automatically generated weighted attendance criteria",
      inputSummary: {
        present: safePresent,
        late: safeLate,
        absent: safeAbsent,
        total,
      },
    };
  }

  const attendanceRate = calculateAttendanceRate(
    safePresent,
    safeLate,
    safeAbsent
  );

  const lateRate = safeLate / total;
  const absentRate = safeAbsent / total;

  const trainedModel = await trainModel();

  const inputTensor = tf.tensor2d([
    [
      safePresent,
      safeLate,
      safeAbsent,
      attendanceRate,
      lateRate,
      absentRate,
    ],
  ]);

  const prediction = trainedModel.predict(inputTensor);
  const predictionData = await prediction.data();

  inputTensor.dispose();
  prediction.dispose();

  const scores = Array.from(predictionData);
  const highestScore = Math.max(...scores);
  const selectedIndex = scores.indexOf(highestScore);

  let riskLevel = "Low Risk";

  if (selectedIndex === 1) {
    riskLevel = "Moderate Risk";
  } else if (selectedIndex === 2) {
    riskLevel = "High Risk";
  }

  return {
    attendanceRate: (attendanceRate * 100).toFixed(2),
    lateRate: (lateRate * 100).toFixed(2),
    absentRate: (absentRate * 100).toFixed(2),
    riskLevel,
    confidence: (highestScore * 100).toFixed(2),
    prescription: getPrescription(riskLevel),
    modelUsed: "TensorFlow.js Neural Network",
    trainingSource: "Automatically generated weighted attendance criteria",
    inputSummary: {
      present: safePresent,
      late: safeLate,
      absent: safeAbsent,
      total,
    },
    predictionScores: {
      lowRisk: (scores[0] * 100).toFixed(2),
      moderateRisk: (scores[1] * 100).toFixed(2),
      highRisk: (scores[2] * 100).toFixed(2),
    },
  };
};