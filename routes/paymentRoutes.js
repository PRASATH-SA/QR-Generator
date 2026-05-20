const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { Cashfree, CFEnvironment } = require('cashfree-pg');

Cashfree.XEnvironment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;

const cashfree = new Cashfree(
    Cashfree.XEnvironment,
    Cashfree.XClientId,
    Cashfree.XClientSecret
);

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Create Cashfree Subscription
router.post('/create-subscription', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const subId = 'SUB_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const planId = 'PLAN_PRO_80'; // Could be created via SubsCreatePlan

        const request = {
            subscription_id: subId,
            customer_details: {
                customer_name: user.name || "Test User",
                customer_email: user.email,
                customer_phone: "9999999999" // Typically required by payment gateways
            },
            plan_details: {
                plan_name: "Pro Member AutoPay",
                plan_type: "PERIODIC",
                plan_currency: "INR",
                plan_amount: 79,
                plan_max_amount: 100, // Slightly higher for auth buffer
                plan_max_cycles: 12,
                plan_intervals: 1,
                plan_interval_type: "MONTH"
            },
            authorization_details: {
                authorization_amount: 79,
                authorization_amount_refund: false, // keep the 80 INR initial charge
                payment_methods: ["upi"]
            },
            subscription_meta: {
                return_url: (req.headers.origin && !req.headers.origin.includes('localhost') ? req.headers.origin : "https://qrgenius.vercel.app") + "/dashboard?sub_id={subscription_id}"
            }
        };

        try {
            const response = await cashfree.SubsCreateSubscription(request);
            
            // Save subscription to DB
            const subscription = new Subscription({
                userId: user._id,
                subscriptionId: subId,
                planId: planId,
                cfSubscriptionId: response.data.cf_subscription_id,
                paymentSessionId: response.data.subscription_session_id,
                amount: 80
            });
            await subscription.save();

            res.json({
                subscriptionSessionId: response.data.subscription_session_id,
                subscriptionId: subId
            });
        } catch (apiError) {
            console.error("Cashfree Subs API Error:", apiError.response?.data || apiError.message);
            res.status(500).json({ error: 'Failed to create subscription', details: apiError.response?.data || apiError.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify Subscription endpoint
router.post('/verify-subscription', authenticate, async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        
        // Fetch subscription from DB
        const subscription = await Subscription.findOne({ subscriptionId, userId: req.user.id });
        if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

        try {
            const response = await cashfree.SubsFetchSubscription(subscriptionId);
            const subData = response.data;
            
            // Update DB status
            subscription.status = subData.subscription_status;
            if (subData.next_schedule_date) {
                subscription.nextScheduleDate = new Date(subData.next_schedule_date);
            }
            await subscription.save();

            // ACTIVE, COMPLETED, CANCELLED, ON_HOLD, INITIALIZED
            if (subData.subscription_status === 'ACTIVE' || subData.subscription_status === 'INITIALIZED') {
                await User.findByIdAndUpdate(req.user.id, { tier: 'paid' });
                const user = await User.findById(req.user.id);
                const token = jwt.sign({ id: user._id, tier: user.tier }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, tier: user.tier, customLogoUrl: user.customLogoUrl }, status: subData.subscription_status });
            } else {
                return res.status(400).json({ error: 'Subscription not active', status: subData.subscription_status });
            }
        } catch (err) {
            console.error("Cashfree Verification Error:", err.response?.data || err.message);
            res.status(500).json({ error: 'Verification failed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Webhook for recurring payments & subscription status changes
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.rawBody; // Populated by express.json() verify in server.js
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];

        if (!payload || !signature || !timestamp) {
            return res.status(400).send('Missing webhook headers or payload');
        }

        // Verify Signature
        try {
            cashfree.PGVerifyWebhookSignature(signature, payload, timestamp);
        } catch (err) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        const event = req.body; // Using parsed body for logic
        
        if (event.type === 'SUBSCRIPTION_PAYMENT_SUCCESS') {
            const subId = event.data.subscription.subscription_id;
            await Subscription.findOneAndUpdate({ subscriptionId: subId }, { 
                status: 'ACTIVE',
                updatedAt: new Date()
            });
            // Update user to paid
            const sub = await Subscription.findOne({ subscriptionId: subId });
            if (sub) {
                await User.findByIdAndUpdate(sub.userId, { tier: 'paid' });
            }
        } else if (event.type === 'SUBSCRIPTION_PAYMENT_FAILED' || event.type === 'SUBSCRIPTION_CANCELLED') {
             const subId = event.data.subscription.subscription_id;
             await Subscription.findOneAndUpdate({ subscriptionId: subId }, { 
                 status: 'CANCELLED',
                 updatedAt: new Date()
             });
             const sub = await Subscription.findOne({ subscriptionId: subId });
             if (sub) {
                 await User.findByIdAndUpdate(sub.userId, { tier: 'free' });
             }
        }
        res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).send('Webhook Error');
    }
});

module.exports = router;
