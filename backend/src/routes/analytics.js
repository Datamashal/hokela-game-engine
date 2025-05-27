
const express = require('express');
const router = express.Router();
const { getAnalytics, getRealTimeMetrics } = require('../controllers/analyticsController');

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get comprehensive analytics data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics period
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by specific service
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter by specific endpoint
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestVolume:
 *                       type: array
 *                       description: Request volume over time
 *                     processingTime:
 *                       type: array
 *                       description: Processing time analytics by endpoint
 *                     errorRates:
 *                       type: array
 *                       description: Error rates and status code distribution
 *                     serviceBreakdown:
 *                       type: array
 *                       description: Service-wise breakdown
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */
router.get('/', getAnalytics);

/**
 * @swagger
 * /api/analytics/realtime:
 *   get:
 *     summary: Get real-time metrics for the last hour
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Real-time metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                       description: Total requests in the last hour
 *                     avgResponseTime:
 *                       type: number
 *                       description: Average response time in milliseconds
 *                     errorRate:
 *                       type: number
 *                       description: Error rate percentage
 *                     successRate:
 *                       type: number
 *                       description: Success rate percentage
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 */
router.get('/realtime', getRealTimeMetrics);

module.exports = router;
