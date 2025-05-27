
const Log = require('../models/Log');
const streamService = require('../services/streamService');
const { validateLog } = require('../middleware/validation');

/**
 * Create a new log entry
 */
const createLog = async (req, res) => {
  try {
    const { error } = validateLog(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }

    const logData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const log = new Log(logData);
    await log.save();
    
    // Forward to live stream
    streamService.broadcastLog(log);
    
    res.status(201).json({
      success: true,
      data: log,
      message: 'Log created successfully'
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ 
      error: 'Failed to create log', 
      message: error.message 
    });
  }
};

/**
 * Get logs with filtering and pagination
 */
const getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level, 
      service, 
      endpoint,
      startDate, 
      endDate,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (level) filter.level = level;
    if (service) filter.service = service;
    if (endpoint) filter.endpoint = endpoint;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { endpoint: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Log.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch logs', 
      message: error.message 
    });
  }
};

/**
 * Get log statistics
 */
const getLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const stats = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' },
          levels: {
            $push: '$level'
          },
          services: {
            $addToSet: '$service'
          }
        }
      },
      {
        $project: {
          totalLogs: 1,
          avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
          uniqueServices: { $size: '$services' },
          levelCounts: {
            $reduce: {
              input: '$levels',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalLogs: 0,
        avgProcessingTime: 0,
        uniqueServices: 0,
        levelCounts: {}
      }
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch log statistics', 
      message: error.message 
    });
  }
};

/**
 * Delete logs (bulk delete with filters)
 */
const deleteLogs = async (req, res) => {
  try {
    const { level, service, olderThan } = req.body;
    
    const filter = {};
    if (level) filter.level = level;
    if (service) filter.service = service;
    if (olderThan) filter.timestamp = { $lt: new Date(olderThan) };
    
    if (Object.keys(filter).length === 0) {
      return res.status(400).json({
        error: 'At least one filter parameter is required'
      });
    }
    
    const result = await Log.deleteMany(filter);
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Successfully deleted ${result.deletedCount} logs`
    });
  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({ 
      error: 'Failed to delete logs', 
      message: error.message 
    });
  }
};

module.exports = {
  createLog,
  getLogs,
  getLogStats,
  deleteLogs
};
