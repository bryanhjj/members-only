const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for our messages
const MessageSchema = new Schema ({
    message_title: {type: String, required: true, maxlength: 100},
    message: {type: String, required: true, maxlength: 1000},
    timestamp: {type: Date, required: true},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
});

// Virtual for url for specific message
MessageSchema.virtual('url').get(function() {
    return '/message/' + this._id;
});

module.exports = mongoose.model('Message', MessageSchema);