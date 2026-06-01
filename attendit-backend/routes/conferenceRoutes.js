// /api/conferences — POD-scheduled parent meetings (Fig. 18).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const { list, create, update, remove } = require('../controllers/conferenceController');

router.get('/',       auth, requireRoles('admin', 'teacher', 'staff', 'parent'), list);
router.post('/',      auth, requireRoles('admin', 'staff'), validateBody({
  caseRef: { type: 'objectId', required: true },
  date: { type: 'date', required: true },
  time: { type: 'string', maxLength: 40 },
  location: { type: 'string', maxLength: 240 },
  agenda: { type: 'string', maxLength: 2000 },
  attendees: { type: 'array', items: { type: 'string', maxLength: 120 } },
}), create);
router.patch('/:id',  auth, requireRoles('admin', 'staff'), validateObjectIdParam('id'), validateBody({
  status: { type: 'string', enum: ['Scheduled', 'Completed', 'Cancelled'] },
  outcome: { type: 'string', maxLength: 2000 },
  date: { type: 'date' },
  time: { type: 'string', maxLength: 40 },
  location: { type: 'string', maxLength: 240 },
  agenda: { type: 'string', maxLength: 2000 },
  attendees: { type: 'array', items: { type: 'string', maxLength: 120 } },
}), update);
router.delete('/:id', auth, requireRoles('admin'), validateObjectIdParam('id'), remove);

module.exports = router;
