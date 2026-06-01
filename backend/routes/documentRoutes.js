// /api/documents — parent excuse/health-cert submissions (Fig. 13).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const { list, create, review, summary, remove } = require('../controllers/documentController');

router.get('/',        auth, list);
router.get('/summary', auth, summary);
router.post('/',       auth, validateBody({
  studentId: { type: 'objectId', required: true },
  documentType: { type: 'string', enum: ['Excuse Letter', 'Health Certificate', 'Other'] },
  fileName: { type: 'string', maxLength: 240 },
  fileUrl: { type: 'string', maxLength: 1000 },
  absenceDate: { type: 'date' },
  reason: { type: 'string', maxLength: 2000 },
  parentName: { type: 'string', maxLength: 120 },
}), create);
router.patch('/:id',   auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), validateBody({
  status: { type: 'string', required: true, enum: ['Accepted', 'Rejected', 'Pending Review'] },
  reviewNote: { type: 'string', maxLength: 2000 },
}), review);
router.delete('/:id',  auth, requireRoles('admin'), validateObjectIdParam('id'), remove);

module.exports = router;
