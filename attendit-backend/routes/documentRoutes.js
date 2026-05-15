const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { list, create, review, summary } = require('../controllers/documentController');

router.get('/',         auth, list);
router.get('/summary',  auth, summary);
router.post('/',        auth, create);
router.patch('/:id',    auth, review);

module.exports = router;
