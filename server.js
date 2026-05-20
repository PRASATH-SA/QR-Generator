const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Serve uploaded custom logos from 'uploads' directory
const staticUploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(staticUploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/payments', paymentRoutes);

// Monolithic Setup - Serve React App
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('Database connection error:', err);
        });
} else {
    // For Vercel Serverless Functions, we just connect to Mongoose and export the app
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Connected to MongoDB (Vercel)'))
        .catch(err => console.error('Database connection error:', err));
}

module.exports = app;
