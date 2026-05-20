const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: String, required: true, unique: true },
    planId: { type: String, required: true },
    status: { type: String, default: 'INITIALIZED' },
    cfSubscriptionId: { type: String },
    paymentSessionId: { type: String },
    nextScheduleDate: { type: Date },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
