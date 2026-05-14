const router = require('express').Router();
const { sendMessage, getContacts, getThread } = require('../controllers/messageController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, sendMessage);
router.get('/contacts', auth, getContacts);
router.get('/thread/:partnerId', auth, getThread);

module.exports = router;