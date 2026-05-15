const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getCases, getSummary, createCase, updateCaseStatus, escalate,
} = require('../controllers/caseController');

router.get('/',               auth, getCases);
router.get('/summary',        auth, getSummary);
router.post('/',              auth, createCase);
router.patch('/:id/status',   auth, updateCaseStatus);
router.post('/:id/escalate',  auth, escalate);

module.exports = router;
