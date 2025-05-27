
const Log = require('../models/Log');
const Metrics = require('../models/Metrics');
const streamService = require('./streamService');

let processingInterval;
let metricsInterval;

/**
 * Initialize metrics processing
 */
const init = () => {
  // Process metrics every 5 minutes
  processingInterval = setInterval(processHourlyMetrics, 5 * 60 * 1000);
  
  // Broadcast real-time metrics every 30 seconds
  metricsInterval = setInterval(broadcastRealTimeMetrics, 30 * 1000);
  
  console.log('Metrics processor initialized');
};

/**
 * Process and store hourly metrics
 */
const processHourlyMetrics = async () => {
  try {
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);
    
    console.log(`Processing metrics for hour: ${previousHour.toISOString()}`);
    
    // Get logs from the previous hour
    const logs = await Log.find({
      timestamp: {
        $gte: previousHour,
        $lt: currentHour
      }
    });
    
    if (logs.length === 0) {
      console.log('No logs to process for the previous hour');
      return;
    }
    
    // Group logs by service and endpoint
    const groupedLogs = logs.reduce((acc, log) => {
      const key = `${log.service}:${log.endpoint || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = {
          service: log.service,
          endpoint: log.endpoint || 'unknown',
          logs: []
        };
      }
      acc[key].logs.push(log);
      return acc;
    }, {});
    
    // Process each group
    for (const [key, group] of Object.entries(groupedLogs)) {
      await processMetricsForGroup(group, previousHour, currentHour.getHours() - 1);
    }
    
    console.log(`Processed metrics for ${Object.keys(groupedLogs).length} service-endpoint combinations`);
  } catch (error) {
    console.error('Error processing hourly metrics:', error);
  }
};

/**
 * Process metrics for a specific service-endpoint group
 */
const processMetricsForGroup = async (group, date, hour) => {
  try {
    const { service, endpoint, logs } = group;
    
    // Calculate metrics
    const totalRequests = logs.length;
    const processingTimes = logs.filter(log => log.processingTime).map(log => log.processingTime);
    const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);
    const avgProcessingTime = processingTimes.length > 0 ? totalProcessingTime / processingTimes.length : 0;
    
    const errorCount = logs.filter(log => log.statusCode && log.statusCode >= 400).length;
    const successCount = logs.filter(log => log.statusCode && log.statusCode < 400).length;
    
    // Status code distribution
    const statusCodes = new Map();
    logs.forEach(log => {
      if (log.statusCode) {
        statusCodes.set(log.statusCode, (statusCodes.get(log.statusCode) || 0) + 1);
      }
    });
    
    // Log level distribution
    const logLevels = {
      info: logs.filter(log => log.level === 'info').length,
      warn: logs.filter(log => log.level === 'warn').length,
      error: logs.filter(log => log.level === 'error').length,
      success: logs.filter(log => log.level === 'success').length,
      debug: logs.filter(log => log.level === 'debug').length
    };
    
    // Update or create metrics document
    await Metrics.findOneAndUpdate(
      {
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        hour,
        service,
        endpoint
      },
      {
        totalRequests,
        totalProcessingTime,
        avgProcessingTime,
        errorCount,
        successCount,
        statusCodes,
        logLevels
      },
      {
        upsert: true,
        new: true
      }
    );
    
  } catch (error) {
    console.error('Error processing metrics for group:', error);
  }
};

/**
 * Broadcast real-time metrics
 */
const broadcastRealTimeMetrics = async () => {
  try {
    const now = new Date();
    const lastMinute = new Date(now.getTime() - 60 * 1000);
    
    const recentLogs = await Log.find({
      timestamp: { $gte: lastMinute }
    });
    
    if (recentLogs.length === 0) {
      return;
    }
    
    const metrics = {
      timestamp: now.toISOString(),
      totalLogs: recentLogs.length,
      levels: {
        info: recentLogs.filter(log => log.level === 'info').length,
        warn: recentLogs.filter(log => log.level === 'warn').length,
        error: recentLogs.filter(log => log.level === 'error').length,
        success: recentLogs.filter(log => log.level === 'success').length,
        debug: recentLogs.filter(log => log.level === 'debug').length
      },
      services: [...new Set(recentLogs.map(log => log.service))],
      avgProcessingTime: recentLogs.filter(log => log.processingTime)
        .reduce((sum, log, _, arr) => sum + log.processingTime / arr.length, 0)
    };
    
    streamService.broadcastMetrics(metrics);
  } catch (error) {
    console.error('Error broadcasting real-time metrics:', error);
  }
};

/**
 * Get processed metrics for analytics
 */
const getProcessedMetrics = async (startDate, endDate, service, endpoint) => {
  try {
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (service) filter.service = service;
    if (endpoint) filter.endpoint = endpoint;
    
    return await Metrics.find(filter).sort({ date: -1, hour: -1 });
  } catch (error) {
    console.error('Error fetching processed metrics:', error);
    return [];
  }
};

/**
 * Cleanup old metrics (optional - run daily)
 */
const cleanupOldMetrics = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Metrics.deleteMany({
      date: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old metrics records`);
  } catch (error) {
    console.error('Error cleaning up old metrics:', error);
  }
};

/**
 * Stop metrics processing
 */
const stop = () => {
  if (processingInterval) {
    clearInterval(processingInterval);
  }
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
  console.log('Metrics processor stopped');
};

module.exports = {
  init,
  processHourlyMetrics,
  broadcastRealTimeMetrics,
  getProcessedMetrics,
  cleanupOldMetrics,
  stop
};
