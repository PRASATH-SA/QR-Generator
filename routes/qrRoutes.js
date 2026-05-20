const express = require('express');
const router = express.Router();
const QRCodeModel = require('../models/QRCode');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user
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

// Generate QR Code (Save)
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { type, data, blockColor, eyeColor, pattern, eyePattern, logo, qrImageUrl } = req.body;
        
        // Enforce rules
        let finalLogo = 'default';
        if (req.user.tier === 'paid') {
            finalLogo = logo || 'default';
        }

        const newQR = new QRCodeModel({
            userId: req.user.id,
            type,
            data,
            design: {
                logo: finalLogo,
                blockColor: blockColor || '#000000',
                eyeColor: eyeColor || '#000000',
                pattern: pattern || 'square',
                eyePattern: eyePattern || 'square'
            },
            qrImageUrl // we expect the frontend to send the base64 data URL
        });

        await newQR.save();
        res.status(201).json(newQR);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's QR codes
router.get('/', authenticate, async (req, res) => {
    try {
        const qrs = await QRCodeModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(qrs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dynamic QR Redirection
router.get('/:id', async (req, res) => {
    try {
        const qr = await QRCodeModel.findById(req.params.id);
        if (!qr) return res.status(404).json({ error: 'QR not found' });
        
        if (qr.type === 'dynamic') {
            qr.scans += 1;
            await qr.save();
        }
        res.redirect(qr.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
