const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 15,
  },
  customAlias: {
    type: String,
    default: null,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    maxlength: 200,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  expiration: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    default: 'anonymous',
  },
  lastClicked: {
    type: Date,
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  qrCodeGenerated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Index for faster queries
linkSchema.index({ shortCode: 1 });
linkSchema.index({ createdAt: -1 });
linkSchema.index({ clicks: -1 });

// Virtual for short URL
linkSchema.virtual('shortUrl').get(function() {
  return `${process.env.BASE_URL || 'http://localhost:5000'}/${this.shortCode}`;
});

// Method to check if link is expired
linkSchema.methods.isExpired = function() {
  return this.expiration && new Date() > new Date(this.expiration);
};

// Method to get analytics summary
linkSchema.methods.getAnalyticsSummary = async function() {
  const Analytics = require('./Analytics');
  
  const analytics = await Analytics.aggregate([
    { $match: { linkId: this._id } },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$ipAddress' },
        lastClick: { $max: '$clickedAt' },
        firstClick: { $min: '$clickedAt' },
      }
    }
  ]);
  
  return analytics[0] || {
    totalClicks: 0,
    uniqueClicks: [],
    lastClick: null,
    firstClick: null,
  };
};

module.exports = mongoose.model('Link', linkSchema);
