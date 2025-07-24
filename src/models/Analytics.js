const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  referrer: {
    type: String,
    default: 'direct',
  },
  country: {
    type: String,
    default: 'Unknown',
  },
  city: {
    type: String,
    default: 'Unknown',
  },
  device: {
    type: String,
    default: 'Unknown',
  },
  browser: {
    type: String,
    default: 'Unknown',
  },
  os: {
    type: String,
    default: 'Unknown',
  },
  clickedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
analyticsSchema.index({ linkId: 1, clickedAt: -1 });
analyticsSchema.index({ clickedAt: -1 });
analyticsSchema.index({ country: 1 });
analyticsSchema.index({ ipAddress: 1 });

// Static method to get analytics for a specific link
analyticsSchema.statics.getLinkAnalytics = function(linkId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        linkId: mongoose.Types.ObjectId(linkId),
        clickedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$clickedAt' },
          month: { $month: '$clickedAt' },
          day: { $dayOfMonth: '$clickedAt' }
        },
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$ipAddress' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get top countries
analyticsSchema.statics.getTopCountries = function(linkId, limit = 10) {
  return this.aggregate([
    { $match: { linkId: mongoose.Types.ObjectId(linkId) } },
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get browser statistics
analyticsSchema.statics.getBrowserStats = function(linkId) {
  return this.aggregate([
    { $match: { linkId: mongoose.Types.ObjectId(linkId) } },
    {
      $group: {
        _id: '$browser',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } }
  ]);
};

// Static method to get device statistics
analyticsSchema.statics.getDeviceStats = function(linkId) {
  return this.aggregate([
    { $match: { linkId: mongoose.Types.ObjectId(linkId) } },
    {
      $group: {
        _id: '$device',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } }
  ]);
};

// Method to parse user agent and extract device info
analyticsSchema.methods.parseUserAgent = function() {
  const userAgent = this.userAgent.toLowerCase();
  
  // Simple device detection
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
    this.device = 'Mobile';
  } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    this.device = 'Tablet';
  } else {
    this.device = 'Desktop';
  }
  
  // Simple browser detection
  if (userAgent.includes('chrome')) {
    this.browser = 'Chrome';
  } else if (userAgent.includes('firefox')) {
    this.browser = 'Firefox';
  } else if (userAgent.includes('safari')) {
    this.browser = 'Safari';
  } else if (userAgent.includes('edge')) {
    this.browser = 'Edge';
  } else {
    this.browser = 'Other';
  }
  
  // Simple OS detection
  if (userAgent.includes('windows')) {
    this.os = 'Windows';
  } else if (userAgent.includes('mac')) {
    this.os = 'macOS';
  } else if (userAgent.includes('linux')) {
    this.os = 'Linux';
  } else if (userAgent.includes('android')) {
    this.os = 'Android';
  } else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    this.os = 'iOS';
  } else {
    this.os = 'Other';
  }
};

// Pre-save middleware to parse user agent
analyticsSchema.pre('save', function(next) {
  if (this.userAgent) {
    this.parseUserAgent();
  }
  next();
});

module.exports = mongoose.model('Analytics', analyticsSchema);
