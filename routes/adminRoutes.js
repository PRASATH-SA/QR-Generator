const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const jwt = require('jsonwebtoken');

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all users with stats
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        
        // Enhance users with QR code counts
        const enhancedUsers = await Promise.all(users.map(async (user) => {
            const qrCount = await QRCode.countDocuments({ user: user._id });
            return {
                ...user.toObject(),
                qrCount
            };
        }));
        
        res.json(enhancedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user tier
router.patch('/users/:id/tier', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { tier } = req.body;
        
        if (!['free', 'paid'].includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
        }
        
        const user = await User.findByIdAndUpdate(id, { tier }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.json({ message: `User tier updated to ${tier}`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Also delete all QR codes for this user
        await QRCode.deleteMany({ user: id });
        
        res.json({ message: 'User and their QR codes deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Stats
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({ tier: 'paid' });
        const totalQRCodes = await QRCode.countDocuments();
        const dynamicQRCodes = await QRCode.countDocuments({ type: 'dynamic' });
        
        res.json({
            totalUsers,
            paidUsers,
            freeUsers: totalUsers - paidUsers,
            totalQRCodes,
            dynamicQRCodes,
            staticQRCodes: totalQRCodes - dynamicQRCodes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
