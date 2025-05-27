
const express = require('express');
const router = express.Router();
const { createLog, getLogs, getLogStats, deleteLogs } = require('../controllers/logsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Log:
 *       type: object
 *       required:
 *         - level
 *         - message
 *         - service
 *       properties:
 *         level:
 *           type: string
 *           enum: [info, warn, error, success, debug]
 *           description: Log level
 *         message:
 *           type: string
 *           maxLength: 1000
 *           description: Log message
 *         service:
 *           type: string
 *           maxLength: 100
 *           description: Service name
 *         endpoint:
 *           type: string
 *           maxLength: 200
 *           description: API endpoint
 *         statusCode:
 *           type: integer
 *           minimum: 100
 *           maximum: 599
 *           description: HTTP status code
 *         processingTime:
 *           type: number
 *           minimum: 0
 *           description: Processing time in milliseconds
 *         userId:
 *           type: string
 *           maxLength: 100
 *           description: User identifier
 *         requestId:
 *           type: string
 *           maxLength: 100
 *           description: Request identifier
 *         metadata:
 *           type: object
 *           description: Additional metadata
 */

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create a new log entry
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Log'
 *     responses:
 *       201:
 *         description: Log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Log'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', createLog);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get logs with filtering and pagination
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warn, error, success, debug]
 *         description: Filter by log level
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter by endpoint
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in message, service, and endpoint
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: timestamp
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Log'
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Server error
 */
router.get('/', getLogs);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Log statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/stats', getLogStats);

/**
 * @swagger
 * /api/logs:
 *   delete:
 *     summary: Bulk delete logs with filters
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [info, warn, error, success, debug]
 *               service:
 *                 type: string
 *               olderThan:
 *                 type: string
 *                 format: date-time
 *             description: At least one filter parameter is required
 *     responses:
 *       200:
 *         description: Logs deleted successfully
 *       400:
 *         description: At least one filter parameter is required
 *       500:
 *         description: Server error
 */
router.delete('/', deleteLogs);

module.exports = router;
