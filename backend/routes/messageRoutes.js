// /api/messages — Triggered Threads + legacy compatibility shims.

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/messageController');
const { validateBody, validateObjectIdParam } = require('../middleware/validateRequest');

router.get('/threads',                auth, ctrl.listThreads);
router.post('/threads',               auth, validateBody({
  studentId: { type: 'objectId', required: true },
  topic: { type: 'string', maxLength: 180 },
  caseRef: { type: 'objectId' },
}), ctrl.createThread);
router.patch('/threads/:id/close',    auth, validateObjectIdParam('id'), ctrl.closeThread);
router.patch('/threads/:id/reopen',   auth, validateObjectIdParam('id'), ctrl.reopenThread);
router.get('/threads/:id/messages',   auth, validateObjectIdParam('id'), ctrl.getMessages);
router.post('/threads/:id/messages',  auth, validateObjectIdParam('id'), validateBody({
  text: { type: 'string', required: true, maxLength: 4000 },
}), ctrl.sendMessage);

module.exports = router;
