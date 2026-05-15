const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/messageController');

// Triggered-thread API (manuscript Fig. 12)
router.get('/threads',                 auth, ctrl.listThreads);
router.post('/threads',                auth, ctrl.createThread);
router.patch('/threads/:id/close',     auth, ctrl.closeThread);
router.patch('/threads/:id/reopen',    auth, ctrl.reopenThread);
router.get('/threads/:id/messages',    auth, ctrl.getMessages);
router.post('/threads/:id/messages',   auth, ctrl.sendMessage);

// Legacy endpoints — kept as soft shims so any unmigrated caller doesn't 500.
router.get('/contacts',                auth, ctrl.legacyContacts);
router.get('/thread/:partnerId',       auth, ctrl.legacyThread);
router.post('/',                       auth, ctrl.legacySend);

module.exports = router;
