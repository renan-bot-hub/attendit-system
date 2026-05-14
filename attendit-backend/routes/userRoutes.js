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
} = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.get('/',           auth, getAllUsers);
router.get('/me',         auth, getMe);
router.patch('/me',       auth, updateMe);
router.post('/me/password', auth, changePassword);
router.post('/',          auth, createUser);
router.post('/bulk',      auth, bulkCreate);
router.put('/:id',        auth, updateUser);
router.patch('/:id/toggle-status', auth, toggleUserStatus);
router.delete('/:id',     auth, deleteUser);

module.exports = router;
