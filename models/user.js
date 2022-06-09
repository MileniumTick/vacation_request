const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    ced: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: true,
    },
    tipoUser: {
        type: String,
        required: true,
    },
    isVerified: { type: Boolean, default: false },
});

const User = mongoose.model('User', UserSchema)

module.exports = User;