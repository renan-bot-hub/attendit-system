// /api/cases — intervention cases. Admin-only delete.

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getCases, getSummary, createCase, updateCaseStatus, escalate, remove,
} = require('../controllers/caseController');

router.get('/',              auth, getCases);
router.get('/summary',       auth, getSummary);
router.post('/',             auth, createCase);
router.patch('/:id/status',  auth, updateCaseStatus);
router.post('/:id/escalate', auth, escalate);
router.delete('/:id',        auth, remove);

module.exports = router;
