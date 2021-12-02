const Message = require('../models/messages');
const User = require('../models/users');
const { body,validationResult } = require("express-validator");
var async = require("async");

// Get all messages (not show the author if user is not logged in)
exports.message_list = function (req, res, next) {
    Message.find()
    .sort({timestamp: -1})
    .populate('author')
    .exec(function(err, message_list) {
        if (err) {
            return next(err);
        }
        res.render('message_list', {title: 'Messages', message: message_list});
    });
};

// Display message detail (incl timestamp)
exports.message_detail = function (req, res, next) {
    async.parallel({
        message: function(callback) {
            Message.findById(req.params.id).populate('author').exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.message == null) {
            var err = new Error('Message not found');
            err.status = 404;
            return next(err);
        }
        res.render('message_detail', {message: results.message});
    });
};

// Create a new message
exports.message_create_get = function (req, res, next) {
    res.render('message_form', {title: 'Create a new message'});
};

exports.message_create_post = [
    // Validate user input
    body('message_title', 'Title required').trim().isLength({ min: 1 }).escape(),
    body('message', 'You can\'t send an empty message!').trim().isLength({ min: 1 }).escape(),

    // Proceed with the req after data has been validated
    (req, res, next) => {
        // Extract errors, if any
        const errors = validationResult(req);
        // Create a new Message object with the validated data
        var newMessage = new Message({
            message_title: req.body.message_title,
            message: req.body.message,
            timestamp: new Date().toISOString(),
            author: req.user._id,
        });
        if (!errors.isEmpty()) {
            // There are errors, re-render the message create form with the user input and display the errors
            res.render('message_form', {title: 'Create a new message', message: newMessage, errors: errors.array()});
            return;
        } else {
            newMessage.save(function(err){
                if (err) {
                    return next(err);
                } else {
                    res.redirect(newMessage.url);
                }
            });
        }
    }
];

// Edit a message
exports.message_edit_get = function (req, res, next) {
    async.parallel({
        message: function(callback) {
            Message.findById(req.params.id).populate('author').exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.message == null) {
            // No results
            var err = new Error('Message not found');
            err.status = 404;
            return next(err);
        }
        res.render('message_edit', {title: 'Edit message', message: results.message});
    }
    );
};

exports.message_edit_post = [
    // Validate user input.
    body('message_title', 'Title required').trim().isLength({ min: 1 }).escape(),
    body('message', 'You can\'t send an empty message!').trim().isLength({ min: 1 }).escape(),

    // Proceed with the edit request.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a new Message object to replace the old one.
        var newMessage = new Message({
            message_title: req.body.message_title,
            message: req.body.message,
            timestamp: new Date().toISOString(), // Might want to keep this as OG date, add a new 'edited_timestamp: ' instead
            author: req.user._id,
            _id: req.params.id,
        });
        if (!errors.isEmpty()) {
            // There are errros, re-render the form along with the errors.
            res.render('message_edit', {title: 'Edit message', message: newMessage, errors: errors.array()});
            return;
        } else {
            // No problems, finalizing the edit/update
            Message.findByIdAndUpdate(req.params.id, newMessage, {}, function(err, updatedMessage){
                if (err) {
                    return next(err);
                } else {
                    // Edit/update success, redirect users to the updated message detail page.
                    res.redirect(updatedMessage.url);
                }
            });
        }
    }
];

// Delete a message
exports.message_delete_get = function (req, res, next) {
    async.parallel({
        message: function(callback) {
            Message.findById(req.params.id).populate('author').exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.message == null) {
            // No results.
            var err = new Error('Message not found');
            err.status = 404;
            return next(err);
        }
        res.render('message_delete', {title: 'Delete message?', message: results.message});
    });
};

exports.message_delete_post = function (req, res, next) {
    Message.findByIdAndRemove(req.body.messageid, function deleteMessage(err){
        if (err) {
            return next(err);
        } else {
            // Delete successful, redirect user to the message list/board
            res.redirect('/message');
        }
    })
};