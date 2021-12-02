const User = require('../models/users');
const Message = require('../models/messages')
const { body,validationResult } = require("express-validator");
var bcrypt = require('bcryptjs');
var async = require("async");

// GET request for creating a new user.
exports.user_create_get = function(req, res, next) {
    res.render('user_form', {title: 'Become a member!'});
};

// POST request for creating a new user.
exports.user_create_post = [
    // Validate user input when registering.
    body('first_name', 'First name required').trim().isLength({ min: 1 }).escape(),
    body('last_name', 'Last name required').trim().isLength({ min: 1 }).escape(),
    body('username', 'Username required').trim().isLength({ min: 1 }).escape(),
    body('password', 'Password required').trim().isLength({ min: 1 }).escape(),
    // Validate confirm_password field matches password before proceeding
    body('confirm_password').custom((value, {req}) => {
        if (value != req.body.password) {
            throw new Error ('Password confirmation does not match password');
        }
        return true;
    }),

    // Proceed with registering the user after validation.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var newUser = new User ({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            password: req.body.password,
            membership_status: false,
            admin: false,
        });

        if (!errors.isEmpty()) {
            // There are errors, re-render the registration page.
            res.render('user_form', {title: 'Become a member!', user: newUser, errors: errors.array()});
            return;
        } else {
            // User input is valid.
            // Check if username already exists, if it does, re-render and ask the user to input a new username.
            User.findOne({'username':req.body.username})
            .exec(function(err, foundDupeUser) {
                if(err) {
                    return next(err);
                }
                if(foundDupeUser) {
                    let dupeError = [
                        {
                            'location': 'body',
                            'msg': 'Username already taken.',
                            'param': 'username'
                        }
                    ];
                    res.render('user_form', {title: 'Become a member!', user: newUser, errors: dupeError});
                } else {
                    // Everything ok, saving new user registration details into db.
                    // gives the user admin rights if they entered the right secret pass-code.
                    if (req.body.secret_pass == '69') {
                        newUser.admin = true;
                    }
                     // hashing user password for security.
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(newUser.password, salt);
                    newUser.password = hash;
                    newUser.save(function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Success, redirect user to the login page.
                        res.redirect('/');
                    });
                }
            });
        }
    }
];

// Display user profile.
exports.user_profile = function(req, res, next) {
    // grab user details as well as messages sent by the user.
    async.parallel({
        user: function(callback) {
            User.findById(req.params.id).exec(callback);
        },
        messages: function(callback) {
            Message.find({'author': req.params.id}).populate('author').exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // if user do not exist.
        if (results.user == null) {
            var err = new Error('Grade not found');
            err.status = 404;
            return next(err);
        }
        res.render('user_profile', {user: results.user, message: results.messages});
    }
    );
};

// Update user profile.
exports.user_update_get = function(req, res, next) {
    async.parallel({
        user: function(callback) {
            User.findById(req.params.id).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.user == null) {
            // No result.
            var err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        // No problems, render the user_form with user details.
        res.render('user_update', {title: 'Update profile', user: results.user});
    }
    );
};

exports.user_update_post = [

    // Validate the users' input for updating their profile.
    body('first_name', 'First name required').trim().isLength({ min: 1 }).escape(),
    body('last_name', 'Last name required').trim().isLength({ min: 1 }).escape(),

    // Proceed with the update request.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a new user object to replace the old outdated one.
        var updatedUser = new User ({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            password: req.user.password,
            membership_status: req.user.membership_status,
            admin: req.user.admin,
            _id: req.params.id, // This is required, or a new ID will be issued.
        });
        if (!errors.isEmpty()) {
            // There are errors.
            res.render('user_update', {title: 'Update profile', user: updatedUser, errors: errors.array()});
        } else {
            // No errors, proceed with the update
            User.findByIdAndUpdate(req.params.id, updatedUser, {}, function(err, success) {
                if (err) {
                    return next(err);
                }
                res.redirect(success.url);
            });
        }
    }

];

// Delete a user profile (only can be done by the very same user, need auth)
exports.user_delete_get = function (req, res, next) {
    async.parallel({
        user: function(callback) {
            User.findById(req.params.id).exec(callback);
        },
        message: function(callback) {
            Message.find({'author': req.params.id}).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.user == null) {
            // User not found
            var err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        // No problems found, render the delete confirmation page
        res.render('user_delete', {title: 'Cancel your membership?', user: results.user, message: results.message});
    });
}

exports.user_delete_post = function (req, res, next) {
    async.parallel({
        user: function(callback) {
            User.findById(req.body.userid).exec(callback);
        },
        message: function(callback) {
            Message.find({'author': req.body.userid}).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // if the user has posted multiple messages in the past, delete them all
        if (results.message.length > 0) {
            for (let m of results.message) {
                Message.findByIdAndRemove(m._id, function deleteMessage(err){
                    if (err) {
                        return next(err);
                    }
                });
            }
        }
        User.findByIdAndRemove(req.body.userid, function deleteUser(err){
            if (err) {
                return next(err);
            }
            // Success - redirect the now resigned user to the login page
            res.redirect('/');
        });
    });
}

// 'join the club' feature for users to switch the membership_status
exports.join_club_get = function (req, res, next) {
    res.render('join_club', {title: 'Join the club now!'});
}

exports.join_club_post = function (req, res, next) {
    // Create a new user object with membership_status=true.
    var updatedUser = new User ({
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        username: req.user.username,
        password: req.user.password,
        membership_status: true,
        admin: req.user.admin,
        _id: req.user.id, // This is required, or a new ID will be issued.
    });
    User.findByIdAndUpdate(req.user.id, updatedUser, {}, function(err, success) {
        if (err) {
            return next(err);
        }
        res.redirect(success.url);
    });
}