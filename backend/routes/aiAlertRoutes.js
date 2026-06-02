// /api/ai-alerts — TF.js-backed risk alerts with rule-engine fallback.

const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  validateBody,
  validateObjectIdParam,
} = require("../middleware/validateRequest");

const {
  runAnalysis,
  listAlerts,
  updateAlert,
  escalateAlert,
} = require("../controllers/aiAlertController");

const { predictRiskLevel } = require("../utils/riskAi");

router.get(
  "/",
  auth,
  requireRoles("admin", "teacher", "staff"),
  listAlerts
);

router.post(
  "/run",
  auth,
  requireRoles("admin", "teacher", "staff"),
  runAnalysis
);

router.get(
  "/test",
  auth,
  requireRoles("admin", "teacher", "staff"),
  async (req, res) => {
    try {
      const result = await predictRiskLevel({
        present: 3,
        late: 2,
        absent: 5,
      });

      res.json({
        success: true,
        message: "TensorFlow risk prediction test successful",
        input: {
          present: 3,
          late: 2,
          absent: 5,
        },
        result,
      });
    } catch (err) {
      console.error("AI test route error:", err);

      res.status(500).json({
        success: false,
        message: "TensorFlow risk prediction test failed",
        error: err.message,
      });
    }
  }
);

router.post(
  "/predict",
  auth,
  requireRoles("admin", "teacher", "staff", "parent"),
  validateBody({
    present: { type: "number", required: true },
    late: { type: "number", required: true },
    absent: { type: "number", required: true },
  }),
  async (req, res) => {
    try {
      const present = Number(req.body.present);
      const late = Number(req.body.late);
      const absent = Number(req.body.absent);

      if (present < 0 || late < 0 || absent < 0) {
        return res.status(400).json({
          success: false,
          message: "Attendance values cannot be negative",
        });
      }

      const result = await predictRiskLevel({
        present,
        late,
        absent,
      });

      res.json({
        success: true,
        message: "Risk prediction generated successfully",
        input: {
          present,
          late,
          absent,
        },
        result,
      });
    } catch (err) {
      console.error("AI prediction route error:", err);

      res.status(500).json({
        success: false,
        message: "Failed to generate risk prediction",
        error: err.message,
      });
    }
  }
);

router.patch(
  "/:id",
  auth,
  requireRoles("admin", "teacher", "staff"),
  validateObjectIdParam("id"),
  validateBody({
    status: {
      type: "string",
      enum: ["New", "Under Review", "Actioned", "Dismissed"],
    },
    linkedCase: { type: "objectId" },
  }),
  updateAlert
);

router.post(
  "/:id/escalate",
  auth,
  requireRoles("admin", "teacher", "staff"),
  validateObjectIdParam("id"),
  escalateAlert
);

module.exports = router;