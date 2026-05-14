const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');

router.get('/', getSettings);          // public — needed for login screen branding
router.put('/', auth, updateSettings); // admin only

module.exports = router;
