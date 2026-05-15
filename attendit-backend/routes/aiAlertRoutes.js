const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  runAnalysis, listAlerts, updateAlert, escalateAlert,
} = require('../controllers/aiAlertController');

router.get('/',           auth, listAlerts);
router.post('/run',       auth, runAnalysis);
router.patch('/:id',      auth, updateAlert);
router.post('/:id/escalate', auth, escalateAlert);

module.exports = router;
