// /api/cases — intervention cases. Admin-only delete.

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');
const {
  getCases, getSummary, createCase, updateCaseStatus, escalate, remove,
} = require('../controllers/caseController');

const caseStatuses = ['Open', 'Pending', 'Approved', 'Rejected', 'Escalated', 'Resolved'];
const riskLevels = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'];

router.get('/',              auth, requireRoles('admin', 'teacher', 'staff'), getCases);
router.get('/summary',       auth, requireRoles('admin', 'teacher', 'staff'), getSummary);
router.post('/',             auth, requireRoles('admin', 'teacher', 'staff'), validateBody({
  studentId: { type: 'objectId', required: true },
  type: { type: 'string', enum: ['Attendance Intervention', 'Medical Certificate', 'Excuse Letter', 'Other'] },
  description: { type: 'string', required: true, maxLength: 2000 },
  fileName: { type: 'string', maxLength: 240 },
  riskLevel: { type: 'string', enum: riskLevels },
}), createCase);
router.patch('/:id/status',  auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), validateBody({
  status: { type: 'string', required: true, enum: caseStatuses },
  reviewNote: { type: 'string', maxLength: 2000 },
}), updateCaseStatus);
router.post('/:id/escalate', auth, requireRoles('admin', 'teacher', 'staff'), validateObjectIdParam('id'), validateBody({
  riskLevel: { type: 'string', enum: riskLevels },
}), escalate);
router.delete('/:id',        auth, requireRoles('admin'), validateObjectIdParam('id'), remove);

module.exports = router;
