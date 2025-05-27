const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  level: { 
    type: String, 
    enum: ['info', 'warn', 'error', 'success', 'debug'], 
    required: true,
    index: true 
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  service: { 
    type: String, 
    required: true, 
    index: true,
    maxlength: 100
  },
  endpoint: { 
    type: String, 
    index: true,
    maxlength: 200
  },
  statusCode: { 
    type: Number,
    min: 100,
    max: 599
  },
  processingTime: { 
    type: Number,
    min: 0
  },
  userId: { 
    type: String,
    maxlength: 100
  },
  requestId: { 
    type: String,
    maxlength: 100
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  userAgent: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes for performance
logSchema.index({ timestamp: -1, level: 1 });
logSchema.index({ service: 1, endpoint: 1 });
logSchema.index({ timestamp: -1, service: 1 });
logSchema.index({ level: 1, timestamp: -1 });

// TTL index to auto-delete old logs (optional - remove if you want to keep all logs)
// logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('Log', logSchema);
