// /api/sections — class sections (Fig. 22). Admin-only writes.

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const { list, create, update, remove } = require('../controllers/sectionController');

router.get('/',       auth, requireRoles('admin', 'teacher', 'staff'), list);
router.post('/',      auth, requireRoles('admin'), validateBody({
  name: { type: 'string', required: true, maxLength: 120 },
  gradeLevel: { type: 'string', required: true, maxLength: 80 },
  adviser: { type: 'objectId' },
}), create);
router.put('/:id',    auth, requireRoles('admin'), validateObjectIdParam('id'), validateBody({
  name: { type: 'string', maxLength: 120 },
  gradeLevel: { type: 'string', maxLength: 80 },
  adviser: { type: 'objectId' },
  isActive: { type: 'boolean' },
}), update);
router.delete('/:id', auth, requireRoles('admin'), validateObjectIdParam('id'), remove);

module.exports = router;
