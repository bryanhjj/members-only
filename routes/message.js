const express = require('express');
const router = express.Router();

// Require controllers modules
const message_controller = require('../controllers/messageController');

// Message routes //
// creating a new message
router.get('/create', message_controller.message_create_get);
router.post('/create', message_controller.message_create_post);
// editing a message
router.get('/:id/edit', message_controller.message_edit_get);
router.post('/:id/edit', message_controller.message_edit_post);
// deleting a message
router.get('/:id/delete', message_controller.message_delete_get);
router.post('/:id/delete', message_controller.message_delete_post);
// show a message with more details
router.get('/:id', message_controller.message_detail);
// show all messages
router.get('/', message_controller.message_list);

module.exports = router;