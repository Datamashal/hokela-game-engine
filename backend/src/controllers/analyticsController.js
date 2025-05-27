
const Log = require('../models/Log');
const Metrics = require('../models/Metrics');

/**
 * Get comprehensive analytics data
 */
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, service, endpoint } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (service) filter.service = service;
    if (endpoint) filter.endpoint = endpoint;
    
    const [requestVolume, processingTime, errorRates, serviceBreakdown] = await Promise.all([
      getRequestVolume(filter),
      getProcessingTime(filter),
      getErrorRates(filter),
      getServiceBreakdown(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        requestVolume,
        processingTime,
        errorRates,
        serviceBreakdown,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      message: error.message 
    });
  }
};

/**
 * Get request volume over time
 */
const getRequestVolume = async (filter) => {
  return await Log.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" }
        },
        count: { $sum: 1 },
        levels: {
          $push: '$level'
        }
      }
    },
    {
      $project: {
        timestamp: '$_id',
        count: 1,
        levelBreakdown: {
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
    },
    { $sort: { timestamp: 1 } }
  ]);
};

/**
 * Get processing time analytics by endpoint
 */
const getProcessingTime = async (filter) => {
  const processingFilter = { ...filter, processingTime: { $exists: true, $ne: null } };
  
  return await Log.aggregate([
    { $match: processingFilter },
    {
      $group: {
        _id: {
          endpoint: '$endpoint',
          service: '$service'
        },
        avgTime: { $avg: '$processingTime' },
        minTime: { $min: '$processingTime' },
        maxTime: { $max: '$processingTime' },
        count: { $sum: 1 },
        p95Time: { $push: '$processingTime' }
      }
    },
    {
      $project: {
        endpoint: '$_id.endpoint',
        service: '$_id.service',
        avgTime: { $round: ['$avgTime', 2] },
        minTime: 1,
        maxTime: 1,
        count: 1,
        p95Time: {
          $arrayElemAt: [
            {
              $slice: [
                { $sortArray: { input: '$p95Time', sortBy: 1 } },
                { $multiply: [{ $size: '$p95Time' }, 0.95] },
                1
              ]
            },
            0
          ]
        }
      }
    },
    { $sort: { avgTime: -1 } }
  ]);
};

/**
 * Get error rates and status code distribution
 */
const getErrorRates = async (filter) => {
  return await Log.aggregate([
    { $match: { ...filter, statusCode: { $exists: true } } },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 300] }] }, then: "2xx" },
              { case: { $and: [{ $gte: ["$statusCode", 300] }, { $lt: ["$statusCode", 400] }] }, then: "3xx" },
              { case: { $and: [{ $gte: ["$statusCode", 400] }, { $lt: ["$statusCode", 500] }] }, then: "4xx" },
              { case: { $gte: ["$statusCode", 500] }, then: "5xx" }
            ],
            default: "other"
          }
        },
        count: { $sum: 1 },
        statusCodes: { $push: '$statusCode' }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        percentage: {
          $multiply: [
            { $divide: ['$count', { $sum: '$count' }] },
            100
          ]
        },
        topStatusCodes: {
          $slice: [
            {
              $map: {
                input: {
                  $setUnion: ['$statusCodes', []]
                },
                as: 'code',
                in: {
                  code: '$$code',
                  count: {
                    $size: {
                      $filter: {
                        input: '$statusCodes',
                        cond: { $eq: ['$$this', '$$code'] }
                      }
                    }
                  }
                }
              }
            },
            5
          ]
        }
      }
    }
  ]);
};

/**
 * Get service breakdown analytics
 */
const getServiceBreakdown = async (filter) => {
  return await Log.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$service',
        totalLogs: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        endpoints: { $addToSet: '$endpoint' },
        levels: { $push: '$level' },
        recentActivity: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        service: '$_id',
        totalLogs: 1,
        avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
        uniqueEndpoints: { $size: '$endpoints' },
        recentActivity: 1,
        levelDistribution: {
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
    },
    { $sort: { totalLogs: -1 } }
  ]);
};

/**
 * Get real-time metrics
 */
const getRealTimeMetrics = async (req, res) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const metrics = await Log.aggregate([
      { $match: { timestamp: { $gte: lastHour } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$processingTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          },
          successCount: {
            $sum: {
              $cond: [{ $lt: ['$statusCode', 400] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          totalRequests: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          errorRate: {
            $round: [
              { $multiply: [{ $divide: ['$errorCount', '$totalRequests'] }, 100] },
              2
            ]
          },
          successRate: {
            $round: [
              { $multiply: [{ $divide: ['$successCount', '$totalRequests'] }, 100] },
              2
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: metrics[0] || {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        successRate: 0
      },
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real-time metrics', 
      message: error.message 
    });
  }
};

module.exports = {
  getAnalytics,
  getRealTimeMetrics
};
