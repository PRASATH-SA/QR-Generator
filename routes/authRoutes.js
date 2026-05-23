const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.zoho.in',
    port: process.env.EMAIL_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const hashedPassword = await bcrypt.hash(password, 10);
        
        if (existingUser && !existingUser.isVerified) {
            existingUser.name = name;
            existingUser.password = hashedPassword;
            existingUser.verificationOTP = otp;
            existingUser.otpExpires = otpExpires;
            await existingUser.save();
        } else {
            const newUser = new User({ 
                name, 
                email, 
                password: hashedPassword,
                verificationOTP: otp,
                otpExpires: otpExpires
            });
            await newUser.save();
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your QR Generator Account',
            text: `Your OTP for registration is ${otp}. It is valid for 10 minutes.`
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'OTP sent to email. Please verify.', email });
        } catch (error) {
            console.error("Email send error during register: ", error);
            return res.status(500).json({ error: 'Failed to send OTP email. Please check your SMTP credentials and try again.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
        if (user.verificationOTP !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (user.otpExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });

        user.isVerified = true;
        user.verificationOTP = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
        
        const otp = crypto.randomInt(100000, 999999).toString();
        user.verificationOTP = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your QR Generator Account',
            text: `Your new OTP is ${otp}. It is valid for 10 minutes.`
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'OTP resent to email' });
        } catch (error) {
            console.error("Email send error during resend-otp: ", error);
            return res.status(500).json({ error: 'Failed to send OTP email. Please check your SMTP credentials and try again.' });
        }
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

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email first', requiresVerification: true, email: user.email });
        }

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
