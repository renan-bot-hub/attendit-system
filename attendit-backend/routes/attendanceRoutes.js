// /api/attendance — manual submit, ledger, corrections, analytics.

const router = require('express').Router();
const {
  submitManual,
  getLedger,
  correctEntry,
  removeEntry,
  getRiskAnalysis,
  getSummary,
  getTrend,
} = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');

router.post('/manual',        auth, submitManual);
router.get('/ledger',         auth, getLedger);
router.patch('/:id',          auth, correctEntry);
router.delete('/:id',         auth, removeEntry);
router.get('/risk-analysis',  auth, getRiskAnalysis);
router.get('/summary',        auth, getSummary);
router.get('/trend',          auth, getTrend);

module.exports = router;
