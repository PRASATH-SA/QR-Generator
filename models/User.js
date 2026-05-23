const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tier: { type: String, enum: ['free', 'paid'], default: 'free' },
    customLogoUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationOTP: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
