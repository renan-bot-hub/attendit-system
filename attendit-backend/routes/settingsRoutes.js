// /api/settings — school config. GET is public; PUT is admin-only.

const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');

router.get('/',       getSettings);
router.put('/', auth, updateSettings);

module.exports = router;
