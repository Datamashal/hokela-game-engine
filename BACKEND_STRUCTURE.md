
# Backend Implementation Guide

## Project Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── logsController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   └── Log.js
│   ├── routes/
│   │   ├── logs.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── services/
│   │   ├── logProcessor.js
│   │   ├── metricsCalculator.js
│   │   └── streamService.js
│   ├── config/
│   │   └── database.js
│   └── app.js
├── package.json
└── server.js
```

## Implementation Steps

### 1. Setup Express.js Server
```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/logs', require('./src/routes/logs'));
app.use('/api/analytics', require('./src/routes/analytics'));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. MongoDB Schema
```javascript
// src/models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  level: { type: String, enum: ['info', 'warn', 'error', 'success'], index: true },
  message: { type: String, required: true },
  service: { type: String, required: true, index: true },
  endpoint: { type: String, index: true },
  statusCode: { type: Number },
  processingTime: { type: Number },
  userId: { type: String },
  requestId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

// Indexes for performance
logSchema.index({ timestamp: -1, level: 1 });
logSchema.index({ service: 1, endpoint: 1 });

module.exports = mongoose.model('Log', logSchema);
```

### 3. Log Controller
```javascript
// src/controllers/logsController.js
const Log = require('../models/Log');
const streamService = require('../services/streamService');

const createLog = async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    
    // Forward to live stream
    streamService.broadcastLog(log);
    
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, service, startDate, endDate } = req.query;
    
    const filter = {};
    if (level) filter.level = level;
    if (service) filter.service = service;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Log.countDocuments(filter);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createLog, getLogs };
```

### 4. Analytics Controller
```javascript
// src/controllers/analyticsController.js
const Log = require('../models/Log');

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // Request volume over time
    const requestVolume = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Processing time by endpoint
    const processingTime = await Log.aggregate([
      { $match: { ...filter, processingTime: { $exists: true } } },
      {
        $group: {
          _id: "$endpoint",
          avgTime: { $avg: "$processingTime" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Error rates
    const errorRates = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 300] }] }, then: "2xx" },
                { case: { $and: [{ $gte: ["$statusCode", 400] }, { $lt: ["$statusCode", 500] }] }, then: "4xx" },
                { case: { $gte: ["$statusCode", 500] }, then: "5xx" }
              ],
              default: "other"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      requestVolume,
      processingTime,
      errorRates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnalytics };
```

### 5. Stream Service for Real-time Logs
```javascript
// src/services/streamService.js
let io;

const init = (socketIo) => {
  io = socketIo;
};

const broadcastLog = (log) => {
  if (io) {
    io.emit('newLog', log);
  }
};

module.exports = { init, broadcastLog };
```

### 6. Package.json
```json
{
  "name": "logflow-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "socket.io": "^4.7.2",
    "dotenv": "^16.3.1",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

This structure provides a complete backend implementation with MongoDB integration, real-time streaming, and analytics endpoints.
