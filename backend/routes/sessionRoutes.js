// /api/sessions — class meetings.

const router = require('express').Router();
const {
  getSessions,
  createSession,
  toggleSession,
  deleteSession,
} = require('../controllers/sessionController');
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');

router.get('/',             auth, getSessions);
router.post('/',            auth, requireRoles('admin', 'teacher'), validateBody({
  className: { type: 'string', required: true, maxLength: 120 },
  section: { type: 'string', required: true, maxLength: 120 },
  subject: { type: 'string', maxLength: 120 },
  date: { type: 'date' },
}), createSession);
router.patch('/:id/toggle', auth, requireRoles('admin', 'teacher'), validateObjectIdParam('id'), toggleSession);
router.delete('/:id',       auth, requireRoles('admin', 'teacher'), validateObjectIdParam('id'), deleteSession);

module.exports = router;
