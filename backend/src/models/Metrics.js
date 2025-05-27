
const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    index: true
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  totalProcessingTime: {
    type: Number,
    default: 0
  },
  avgProcessingTime: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  statusCodes: {
    type: Map,
    of: Number,
    default: new Map()
  },
  logLevels: {
    info: { type: Number, default: 0 },
    warn: { type: Number, default: 0 },
    error: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    debug: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes
metricsSchema.index({ date: 1, hour: 1, service: 1, endpoint: 1 }, { unique: true });
metricsSchema.index({ date: -1, service: 1 });

module.exports = mongoose.model('Metrics', metricsSchema);
