// /api/settings — school config. GET is public; PUT is admin-only.

const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateRequest');

router.get('/',       getSettings);
router.put('/', auth, requireRoles('admin'), validateBody({
  schoolName: { type: 'string', maxLength: 180 },
  schoolType: { type: 'string', enum: ['public', 'private'] },
  academicYear: { type: 'string', maxLength: 40 },
  lateCutoffTime: { type: 'string', maxLength: 20 },
  autoAbsentTime: { type: 'string', maxLength: 20 },
  consecutiveAbsenceThreshold: { type: 'number' },
  warningTotalAbsences: { type: 'number' },
  criticalTotalAbsences: { type: 'number' },
  attendanceCriticalBelow: { type: 'number' },
  attendanceHighRiskBelow: { type: 'number' },
  attendanceModerateBelow: { type: 'number' },
  contactEmail: { type: 'string', maxLength: 180 },
  contactPhone: { type: 'string', maxLength: 40 },
  address: { type: 'string', maxLength: 500 },
}), updateSettings);

module.exports = router;
