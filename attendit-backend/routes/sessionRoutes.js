// /api/sessions — class meetings.

const router = require('express').Router();
const { getSessions, createSession, toggleSession } = require('../controllers/sessionController');
const auth = require('../middleware/authMiddleware');

router.get('/',             auth, getSessions);
router.post('/',            auth, createSession);
router.patch('/:id/toggle', auth, toggleSession);

module.exports = router;
