const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for our User model
var UserSchema = new Schema ({
    first_name: {type: String, required: true, maxLength: 100},
    last_name: {type: String, required: true, maxlength: 100},
    username: {type: String, required: true, maxlength: 100},
    password: {type: String, required: true},
    membership_status: {type: Boolean},
    admin: {type: Boolean},
});

// Virtual for getting our user's full name
UserSchema.virtual('name').get(function() {
    return this.first_name + ' ' + this.last_name;
});

// Might need a virtual for url? to be determined
UserSchema.virtual('url').get(function() {
    return '/user/' + this._id;
});

// Export model
module.exports = mongoose.model('User', UserSchema);