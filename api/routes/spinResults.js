
const express = require('express');
const router = express.Router();

// Enhanced CORS middleware for all routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '3600');
  next();
});

/**
 * @swagger
 * /spin-results:
 *   get:
 *     summary: Retrieve all spin results
 *     description: Get a list of all spin results with optional date filtering
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering results (YYYY-MM-DD format)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering results (YYYY-MM-DD format)
 *     responses:
 *       200:
 *         description: A list of spin results
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
  let connection;
  try {
    console.log('Fetching spin results from database...');
    
    // Get connection from pool with timeout
    connection = await Promise.race([
      req.db.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);
    
    let query = 'SELECT * FROM spin_results';
    const queryParams = [];
    
    // Add date filtering if provided
    const { from_date, to_date } = req.query;
    const conditions = [];
    
    if (from_date) {
      conditions.push('DATE(date) >= ?');
      queryParams.push(from_date);
    }
    
    if (to_date) {
      conditions.push('DATE(date) <= ?');
      queryParams.push(to_date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY date DESC';
    
    console.log('Executing query:', query, 'with params:', queryParams);
    
    const [spinResults] = await connection.query(query, queryParams);
    console.log(`Successfully fetched ${spinResults.length} spin results`);
    
    res.status(200).json(spinResults);
  } catch (err) {
    console.error('Error fetching spin results:', err);
    res.status(500).json({ 
      message: 'Failed to fetch spin results',
      error: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

/**
 * @swagger
 * /spin-results/stats:
 *   get:
 *     summary: Get statistics about spin results
 *     description: Returns counts of wins vs losses and prize distribution
 *     responses:
 *       200:
 *         description: Spin result statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSpins:
 *                   type: integer
 *                   description: Total number of spins
 *                 wins:
 *                   type: integer
 *                   description: Total number of wins
 *                 losses:
 *                   type: integer
 *                   description: Total number of losses
 *                 prizeDistribution:
 *                   type: object
 *                   description: Distribution of prizes and their counts
 *                   additionalProperties:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  let connection;
  try {
    console.log('Fetching spin result statistics...');
    
    connection = await Promise.race([
      req.db.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);
    
    const [totalResults] = await connection.query('SELECT COUNT(*) as total FROM spin_results');
    const [winsResults] = await connection.query('SELECT COUNT(*) as wins FROM spin_results WHERE is_win = true');
    
    const totalSpins = totalResults[0].total;
    const wins = winsResults[0].wins;
    const losses = totalSpins - wins;
    
    // Get prize distribution
    const [prizesResults] = await connection.query(
      'SELECT prize, COUNT(*) as count FROM spin_results GROUP BY prize ORDER BY count DESC'
    );
    
    const prizeDistribution = {};
    prizesResults.forEach(prize => {
      prizeDistribution[prize.prize] = prize.count;
    });

    // Get prize win rate
    const [prizeWinRates] = await connection.query(`
      SELECT 
        prize, 
        COUNT(*) as total_count,
        SUM(CASE WHEN is_win = true THEN 1 ELSE 0 END) as win_count,
        SUM(CASE WHEN is_win = false THEN 1 ELSE 0 END) as loss_count,
        (SUM(CASE WHEN is_win = true THEN 1 ELSE 0 END) / COUNT(*)) * 100 as win_percentage
      FROM spin_results 
      GROUP BY prize
      ORDER BY win_count DESC
    `);

    // Get user statistics
    const [userCountResults] = await connection.query('SELECT COUNT(DISTINCT email) as unique_users FROM spin_results');
    const uniqueUsers = userCountResults[0].unique_users;

    // Get win data over time (last 7 days)
    const [timeData] = await connection.query(`
      SELECT 
        DATE(date) as spin_date, 
        COUNT(*) as total,
        SUM(CASE WHEN is_win = true THEN 1 ELSE 0 END) as wins
      FROM spin_results
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date)
      ORDER BY spin_date ASC
    `);
    
    console.log('Successfully fetched spin result statistics');
    
    res.status(200).json({
      totalSpins,
      wins,
      losses,
      uniqueUsers,
      prizeDistribution,
      prizeWinRates,
      timeData
    });
  } catch (err) {
    console.error('Error fetching spin result stats:', err);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

/**
 * @swagger
 * /spin-results:
 *   post:
 *     summary: Record a new spin result
 *     description: Create a new spin result record in the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - location
 *               - prize
 *               - is_win
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the participant
 *               email:
 *                 type: string
 *                 description: Email of the participant
 *               location:
 *                 type: string
 *                 description: Location of the participant
 *               agent_name:
 *                 type: string
 *                 description: Name of the agent (optional)
 *               prize:
 *                 type: string
 *                 description: Prize won or lost
 *               is_win:
 *                 type: boolean
 *                 description: Whether the spin resulted in a win
 *     responses:
 *       201:
 *         description: Spin result recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid data provided
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('Received spin result data:', req.body);
    console.log('Request headers:', req.headers);
    
    const { name, email, location, agent_name, prize, is_win } = req.body;
    
    // Enhanced validation with more detailed error messages
    const missingFields = [];
    if (!name || name.trim() === '') missingFields.push('name');
    if (!email || email.trim() === '') missingFields.push('email');
    if (!location || location.trim() === '') missingFields.push('location');
    if (!prize || prize.trim() === '') missingFields.push('prize');
    if (is_win === undefined || is_win === null) missingFields.push('is_win');
    
    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        message: `The following required fields are missing: ${missingFields.join(', ')}`,
        received: req.body,
        success: false
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        success: false
      });
    }
    
    // Get connection with timeout
    console.log('Attempting to get database connection...');
    connection = await Promise.race([
      req.db.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log('Database connection acquired successfully');
    
    // Test connection
    await connection.query('SELECT 1');
    console.log('Database connection test successful');
    
    // Log before database insertion
    console.log('Attempting to insert into database with values:', { 
      name: name.trim(), 
      email: email.trim(), 
      location: location.trim(), 
      agent_name: agent_name ? agent_name.trim() : null, 
      prize: prize.trim(), 
      is_win: Boolean(is_win)
    });
    
    // Insert data into database with proper error handling
    const [result] = await connection.query(
      'INSERT INTO spin_results (name, email, location, agent_name, prize, is_win) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name.trim(), 
        email.trim(), 
        location.trim(), 
        agent_name ? agent_name.trim() : null, 
        prize.trim(), 
        Boolean(is_win)
      ]
    );
    
    console.log('Insert result:', result);
    
    if (result.affectedRows && result.insertId) {
      // Fetch the newly created record
      const [newResult] = await connection.query('SELECT * FROM spin_results WHERE id = ?', [result.insertId]);
      console.log('Successfully recorded spin result:', newResult[0]);
      
      res.status(201).json({
        success: true,
        message: 'Spin result recorded successfully',
        data: newResult[0]
      });
    } else {
      throw new Error('Failed to record spin result - no rows affected');
    }
  } catch (err) {
    console.error('Error recording spin result:', err);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (err.message.includes('timeout')) {
      statusCode = 503;
      errorMessage = 'Database connection timeout - service temporarily unavailable';
    } else if (err.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      errorMessage = 'Duplicate entry detected';
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      statusCode = 503;
      errorMessage = 'Database table not found - service configuration error';
    } else if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Database connection refused - service unavailable';
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

/**
 * @swagger
 * /spin-results/{id}:
 *   delete:
 *     summary: Delete a spin result
 *     description: Delete a specific spin result by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the spin result to delete
 *     responses:
 *       200:
 *         description: Spin result successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Spin result not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Valid ID parameter is required' });
    }
    
    console.log(`Attempting to delete spin result with ID: ${id}`);
    
    connection = await Promise.race([
      req.db.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);
    
    // Delete the record
    const [result] = await connection.query('DELETE FROM spin_results WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Spin result with ID ${id} not found` });
    }
    
    console.log(`Successfully deleted spin result with ID: ${id}`);
    res.status(200).json({ 
      success: true,
      message: `Spin result with ID ${id} deleted successfully` 
    });
  } catch (err) {
    console.error(`Error deleting spin result with ID ${req.params.id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete spin result',
      error: err.message
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

/**
 * @swagger
 * /spin-results/agent-prize-stats:
 *   get:
 *     summary: Get prize distribution statistics by agent
 *     description: Returns detailed statistics of prizes distributed by each agent
 *     responses:
 *       200:
 *         description: Agent prize distribution statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agentStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       agentName:
 *                         type: string
 *                       totalPrizes:
 *                         type: integer
 *                       prizeBreakdown:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/agent-prize-stats', async (req, res) => {
  let connection;
  try {
    console.log('Fetching agent prize statistics...');
    
    connection = await Promise.race([
      req.db.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);
    
    // First, get all spin results and normalize the prize names
    const [allResults] = await connection.query('SELECT * FROM spin_results ORDER BY date DESC');
    
    // Normalize prize names and count accurately - removed FOOTBALLS
    const prizeCounts = {
      "KEY HOLDERS": 0,
      "WATER BOTTLES": 0,
      "UMBRELLAS": 0
    };
    
    allResults.forEach(result => {
      const prizeUpper = result.prize.toUpperCase().replace(/\s+/g, ' ').trim();
      
      // More comprehensive matching for remaining prizes (removed football matching)
      if (prizeUpper === 'KEY HOLDERS' || prizeUpper === 'KEYHOLDERS' || prizeUpper === 'KEYHOLDER' || prizeUpper === 'KEY HOLDER') {
        prizeCounts["KEY HOLDERS"]++;
      } else if (prizeUpper === 'WATER BOTTLES' || prizeUpper === 'WATER BOTTLE' || prizeUpper === 'WATERBOTTLES' || prizeUpper === 'WATERBOTTLE') {
        prizeCounts["WATER BOTTLES"]++;
      } else if (prizeUpper === 'UMBRELLAS' || prizeUpper === 'UMBRELLA') {
        prizeCounts["UMBRELLAS"]++;
      }
    });

    // Calculate total
    const total = Object.values(prizeCounts).reduce((sum, count) => sum + count, 0);
    
    console.log('Calculated prize counts:', prizeCounts);
    console.log('Total prizes:', total);
    
    // Return the accurate counts
    res.status(200).json({
      success: true,
      agentStats: [], // Not used by current frontend implementation
      prizeSummary: {
        ...prizeCounts,
        total
      }
    });
  } catch (err) {
    console.error('Error fetching agent prize stats:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch prize statistics',
      error: err.message
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

// Add OPTIONS handler for CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Max-Age', '3600');
  res.sendStatus(200);
});

module.exports = router;
