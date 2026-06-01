// /api/ai-alerts — TF.js-backed risk alerts (with rule-engine fallback).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const {
  runAnalysis, listAlerts, updateAlert, escalateAlert,
} = require('../controllers/aiAlertController');

router.get('/',              auth, requireRoles('admin', 'teacher', 'staff'), listAlerts);
router.post('/run',          auth, requireRoles('admin', 'teacher', 'staff'), runAnalysis);
router.patch('/:id',         auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), validateBody({
  status: { type: 'string', enum: ['New', 'Under Review', 'Actioned', 'Dismissed'] },
  linkedCase: { type: 'objectId' },
}), updateAlert);
router.post('/:id/escalate', auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), escalateAlert);

module.exports = router;
