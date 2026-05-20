const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer to use memory storage instead of disk storage for ImgBB upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, tier: user.tier }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, tier: user.tier, customLogoUrl: user.customLogoUrl } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Custom Logo
router.post('/upload-logo', authenticate, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.tier !== 'paid') {
            return res.status(403).json({ error: 'Premium feature only' });
        }

        // Upload to ImgBB
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
            return res.status(500).json({ error: 'IMGBB_API_KEY is not configured in .env' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ image: base64Image })
        });
        
        const imgbbData = await imgbbResponse.json();
        
        if (!imgbbData.success) {
            return res.status(500).json({ error: 'Failed to upload image to ImgBB' });
        }

        const logoUrl = imgbbData.data.url;
        user.customLogoUrl = logoUrl;
        await user.save();

        res.json({ 
            message: 'Logo uploaded successfully', 
            customLogoUrl: logoUrl,
            user: { id: user._id, name: user.name, email: user.email, tier: user.tier, customLogoUrl: user.customLogoUrl }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
