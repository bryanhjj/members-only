const express = require('express');
const router = express.Router();

// Require controllers modules
const user_controller = require('../controllers/userController');

// User routes //
// registering a new user
router.get('/register', user_controller.user_create_get);
router.post('/register', user_controller.user_create_post);
// 'join the club' page for membership_status in User obj
router.get('/joinClub', user_controller.join_club_get);
router.post('/joinClub', user_controller.join_club_post);
// updating user profile
router.get('/:id/update', user_controller.user_update_get); 
router.post('/:id/update', user_controller.user_update_post);
// deleting a user
router.get('/:id/delete', user_controller.user_delete_get);
router.post('/:id/delete', user_controller.user_delete_post);
// show a user profile/details
router.get('/:id', user_controller.user_profile);

module.exports = router;