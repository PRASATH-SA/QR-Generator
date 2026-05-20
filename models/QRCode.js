const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['static', 'dynamic'], default: 'static' },
    data: { type: String, required: true }, // The URL or text encoded
    design: {
        logo: { type: String, default: 'default' }, // 'default' for 'P', or a custom URL
        blockColor: { type: String, default: '#000000' },
        eyeColor: { type: String, default: '#000000' },
        pattern: { type: String, default: 'square' }, // dots, rounded, square
        eyePattern: { type: String, default: 'square' }
    },
    qrImageUrl: { type: String, required: true }, // The generated image data URL or stored path
    scans: { type: Number, default: 0 } // For dynamic QR codes
}, { timestamps: true });

module.exports = mongoose.model('QRCode', qrCodeSchema);
