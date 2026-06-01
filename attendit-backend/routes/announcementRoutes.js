// /api/announcements — school-wide notices (Fig. 15).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const { list, create, update, remove } = require('../controllers/announcementController');

router.get('/',       auth, list);
router.post('/',      auth, requireRoles('admin', 'staff'), validateBody({
  title: { type: 'string', required: true, maxLength: 180 },
  body: { type: 'string', required: true, maxLength: 4000 },
  status: { type: 'string', enum: ['Draft', 'Published'] },
  targetSections: { type: 'array', items: { type: 'string', maxLength: 120 } },
}), create);
router.patch('/:id',  auth, requireRoles('admin', 'staff'), validateObjectIdParam('id'), validateBody({
  title: { type: 'string', maxLength: 180 },
  body: { type: 'string', maxLength: 4000 },
  status: { type: 'string', enum: ['Draft', 'Published'] },
  targetSections: { type: 'array', items: { type: 'string', maxLength: 120 } },
}), update);
router.delete('/:id', auth, requireRoles('admin'), validateObjectIdParam('id'), remove);

module.exports = router;
