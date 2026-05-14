const router = require('express').Router();
const { getCases, createCase, updateCaseStatus } = require('../controllers/caseController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, getCases);
router.post('/', auth, createCase);
router.patch('/:id/status', auth, updateCaseStatus);

module.exports = router;