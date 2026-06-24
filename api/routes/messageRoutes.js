import express from 'express';
import getContacts from '../controllers/messages/getContacts.js';
import getAvailableContacts from '../controllers/messages/getAvailableContacts.js';
import getMessages from '../controllers/messages/getMessages.js';
import sendMessage from '../controllers/messages/sendMessage.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/contacts', getContacts);
router.get('/available-contacts', getAvailableContacts);
router.get('/thread', getMessages);
router.post('/send', sendMessage);

// Legacy compatibility endpoints
router.get('/get_contacts', getContacts);
router.get('/get_contacts.php', getContacts);
router.get('/get_available_contacts', getAvailableContacts);
router.get('/get_available_contacts.php', getAvailableContacts);
router.get('/get_messages', getMessages);
router.get('/get_messages.php', getMessages);
router.post('/send_message', sendMessage);
router.post('/send_message.php', sendMessage);

export default router;
