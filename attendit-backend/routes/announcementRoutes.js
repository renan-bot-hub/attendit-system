// /api/announcements — school-wide notices (Fig. 15).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { list, create, update, remove } = require('../controllers/announcementController');

router.get('/',       auth, list);
router.post('/',      auth, create);
router.patch('/:id',  auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
