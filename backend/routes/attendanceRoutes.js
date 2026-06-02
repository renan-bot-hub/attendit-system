// /api/attendance — manual submit, ledger, corrections, analytics.

const router = require('express').Router();
const {
  submitManual,
  scanQR,
  getLedger,
  correctEntry,
  removeEntry,
  getRiskAnalysis,
  getSummary,
  getTrend,
} = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const {
  validateAttendanceScanBody,
  validateBody,
  validateObjectIdParam,
} = require('../middleware/validateRequest');

const attendanceStatus = ['Present', 'Late', 'Absent'];

router.post('/manual',        auth, requireRoles('admin', 'teacher', 'staff'), validateBody({
  sessionId: { type: 'objectId', required: true },
  records: {
    type: 'array',
    required: true,
    min: 1,
    items: {
      type: 'object',
      fields: {
        studentId: { type: 'objectId', required: true },
        status: { type: 'string', required: true, enum: attendanceStatus },
      },
    },
  },
}), submitManual);
router.post('/scan',          auth, scanQR);
router.get('/ledger',         auth, getLedger);
router.get('/risk-analysis',  auth, requireRoles('admin', 'teacher', 'staff'), getRiskAnalysis);
router.get('/summary',        auth, requireRoles('admin', 'teacher', 'staff'), getSummary);
router.get('/trend',          auth, requireRoles('admin', 'teacher', 'staff'), getTrend);
router.patch('/:id',          auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), validateBody({
  status: { type: 'string', required: true, enum: attendanceStatus },
}), correctEntry);
router.delete('/:id',         auth, requireRoles('admin'), validateObjectIdParam('id'), removeEntry);

module.exports = router;
