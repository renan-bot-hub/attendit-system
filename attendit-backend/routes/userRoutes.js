// /api/users — CRUD, self-service profile, admin-only QR backup.

const router = require('express').Router();
const {
  getAllUsers,
  getMe,
  updateMe,
  changePassword,
  createUser,
  bulkCreate,
  updateUser,
  toggleUserStatus,
  deleteUser,
  regenerateQr,
} = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');

const roleEnum = ['student', 'teacher', 'staff', 'admin', 'parent'];
const userFields = {
  name: { type: 'string', maxLength: 120 },
  email: { type: 'string', maxLength: 180 },
  password: { type: 'string', minLength: 6, maxLength: 128 },
  role: { type: 'string', enum: roleEnum },
  studentId: { type: 'string', maxLength: 80 },
  studentNumber: { type: 'string', maxLength: 80 },
  section: { type: 'string', maxLength: 120 },
  gradeLevel: { type: 'string', maxLength: 80 },
  gradeSection: { type: 'string', maxLength: 120 },
  department: { type: 'string', maxLength: 120 },
  teacherNumber: { type: 'string', maxLength: 80 },
  birthdate: { type: 'string', maxLength: 40 },
  contactNumber: { type: 'string', maxLength: 40 },
  parentName: { type: 'string', maxLength: 120 },
  parentEmail: { type: 'string', maxLength: 180 },
  parentPhone: { type: 'string', maxLength: 40 },
};

router.get('/',           auth, requireRoles('admin', 'teacher', 'staff'), getAllUsers);
router.get('/me',         auth, getMe);
router.patch('/me',       auth, validateBody({
  name: { type: 'string', maxLength: 120 },
  email: { type: 'string', maxLength: 180 },
  department: { type: 'string', maxLength: 120 },
  section: { type: 'string', maxLength: 120 },
  gradeLevel: { type: 'string', maxLength: 80 },
}), updateMe);
router.post('/me/password', auth, validateBody({
  currentPassword: { type: 'string', required: true, maxLength: 128 },
  newPassword: { type: 'string', required: true, minLength: 6, maxLength: 128 },
}), changePassword);
router.post('/',          auth, requireRoles('admin'), validateBody({
  ...userFields,
  name: { type: 'string', required: true, maxLength: 120 },
  email: { type: 'string', required: true, maxLength: 180 },
  role: { type: 'string', required: true, enum: roleEnum },
}), createUser);
router.post('/bulk',      auth, requireRoles('admin'), validateBody({
  users: {
    type: 'array',
    required: true,
    min: 1,
    items: {
      type: 'object',
      fields: {
        name: { type: 'string', required: true, maxLength: 120 },
        email: { type: 'string', required: true, maxLength: 180 },
        role: { type: 'string', enum: roleEnum },
        password: { type: 'string', maxLength: 128 },
      },
    },
  },
}), bulkCreate);
router.put('/:id',        auth, requireRoles('admin'), validateObjectIdParam('id'), validateBody(userFields), updateUser);
router.patch('/:id/toggle-status', auth, requireRoles('admin'), validateObjectIdParam('id'), toggleUserStatus);
router.post('/:id/regenerate-qr',  auth, requireRoles('admin'), validateObjectIdParam('id'), regenerateQr);
router.delete('/:id',     auth, requireRoles('admin'), validateObjectIdParam('id'), deleteUser);

module.exports = router;
