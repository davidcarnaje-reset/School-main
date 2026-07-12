import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings/settingsController.js';

const router = express.Router();

// Clean RESTful paths
router.get('/', getSettings);
router.post('/', updateSettings);

// Legacy PHP compatibility paths
router.get('/get_settings.php', getSettings);
router.get('/get_settings', getSettings);
router.post('/update_settings.php', updateSettings);
router.post('/update_settings', updateSettings);

export default router;
