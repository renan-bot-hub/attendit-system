const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { list, create, update, remove } = require('../controllers/sectionController');

router.get('/',      auth, list);
router.post('/',     auth, create);
router.put('/:id',   auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
