// /api/documents — parent excuse/health-cert submissions (Fig. 13).

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { list, create, review, summary, remove } = require('../controllers/documentController');

router.get('/',        auth, list);
router.get('/summary', auth, summary);
router.post('/',       auth, create);
router.patch('/:id',   auth, review);
router.delete('/:id',  auth, remove);

module.exports = router;
