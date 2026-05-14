const router = require('express').Router();
const {
  submitManual,
  getLedger,
  correctEntry,
  getRiskAnalysis,
  getSummary,
} = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');

router.post('/manual', auth, submitManual);
router.get('/ledger', auth, getLedger);
router.patch('/:id', auth, correctEntry);
router.get('/risk-analysis', auth, getRiskAnalysis);
router.get('/summary', auth, getSummary);

module.exports = router;
