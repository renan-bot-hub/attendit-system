const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { list, create, update } = require('../controllers/conferenceController');

router.get('/',    auth, list);
router.post('/',   auth, create);
router.patch('/:id', auth, update);

module.exports = router;
