// /api/messages — Triggered Threads + legacy compatibility shims.

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/messageController');

router.get('/threads',                auth, ctrl.listThreads);
router.post('/threads',               auth, ctrl.createThread);
router.patch('/threads/:id/close',    auth, ctrl.closeThread);
router.patch('/threads/:id/reopen',   auth, ctrl.reopenThread);
router.get('/threads/:id/messages',   auth, ctrl.getMessages);
router.post('/threads/:id/messages',  auth, ctrl.sendMessage);

router.get('/contacts',          auth, ctrl.legacyContacts);
router.get('/thread/:partnerId', auth, ctrl.legacyThread);
router.post('/',                 auth, ctrl.legacySend);

module.exports = router;
