const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const urlRoutes = require('./src/routes/urlRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const Link = require('./src/models/Link');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://pagead2.googlesyndication.com", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://www.google-analytics.com"],
            frameSrc: ["https://pagead2.googlesyndication.com"],
        },
    },
}));

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://quicklinkpro.io',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for serving frontend if needed)
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API routes
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Redirect handler for shortened URLs
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        const link = await Link.findOne({ shortCode, isActive: true });
        
        if (!link) {
            return res.status(404).json({ 
                error: 'Short URL not found',
                shortCode: shortCode 
            });
        }

        // Check if link has expired
        if (link.expiresAt && new Date() > link.expiresAt) {
            return res.status(410).json({ 
                error: 'Short URL has expired',
                expiredAt: link.expiresAt 
            });
        }

        // Update click count and analytics
        link.clicks += 1;
        link.lastClickedAt = new Date();
        await link.save();

        // Log analytics data
        const Analytics = require('./src/models/Analytics');
        const userAgent = req.get('User-Agent') || '';
        const referer = req.get('Referer') || '';
        const ip = req.ip || req.connection.remoteAddress;

        await Analytics.create({
            linkId: link._id,
            shortCode: shortCode,
            userAgent: userAgent,
            referer: referer,
            ipAddress: ip,
            timestamp: new Date()
        });

        // Redirect to original URL
        res.redirect(301, link.originalUrl);
        
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).json({ 
            error: 'Internal server error during redirect',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
    // Check if it's an API route that doesn't exist
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Frontend not found' });
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QuickLink Pro Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'https://quicklinkpro.io'}`);
    console.log(`📝 Base URL: ${process.env.BASE_URL || 'https://quicklinkpro.io'}`);
});

module.exports = app;
