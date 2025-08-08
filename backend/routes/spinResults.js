
const express = require('express');
const router = express.Router();
const { mapPrizeToProductId, isProductWin } = require('../utils/productMapping');

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
  const connection = req.db;
  
  try {
    await connection.beginTransaction();

    const { agent_id, agent_name, user_name, user_contact, prize_label, is_win, product_id } = req.body;
    // Validate required fields
    if (!agent_id || !user_name || !user_contact || prize_label === undefined || is_win === undefined) {
      await connection.rollback();
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // If it's a win and product_id is provided, check and update inventory atomically
    if (is_win && product_id) {
      // First check if there's available quantity
      const [inventoryCheck] = await connection.query(`
        SELECT available_quantity 
        FROM product_inventory 
        WHERE agent_id = ? AND product_id = ? 
        FOR UPDATE
      `, [agent_id, product_id]);

      if (inventoryCheck.length === 0 || inventoryCheck[0].available_quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'No prize available', 
          error: 'Insufficient inventory' 
        });
      }

      // Update inventory with atomic operation
      const [updateResult] = await connection.query(`
        UPDATE product_inventory 
        SET available_quantity = available_quantity - 1,
            distributed_quantity = distributed_quantity + 1,
            last_updated = NOW()
        WHERE agent_id = ? AND product_id = ? AND available_quantity > 0
      `, [agent_id, product_id]);

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'No prize available', 
          error: 'Inventory was depleted during transaction' 
        });
      }
    }
    // Insert the spin result
    const [result] = await connection.query(
      `INSERT INTO spin_results (agent_id, agent_name, user_name, user_contact, prize_label, is_win, date) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [agent_id, agent_name || 'Unknown Agent', user_name, user_contact, prize_label, is_win]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Spin result recorded successfully', 
      id: result.insertId 
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error recording spin result:', err);
    res.status(500).json({ message: 'Error recording spin result', error: err.message });
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
    
    // Normalize prize names and count accurately for current product set
    const prizeCounts = {
      "ILARA MAZIWA 500ML": 0,
      "APRONS": 0,
      "INDUCTION COOKER": 0,
      "KITCHEN SET": 0
    };
    
    allResults.forEach(result => {
      const prizeUpper = String(result.prize || '').toUpperCase().replace(/\s+/g, ' ').trim();
      
      if (prizeUpper.includes('MAZIWA') || prizeUpper.includes('500ML')) {
        prizeCounts["ILARA MAZIWA 500ML"]++;
      } else if (prizeUpper === 'APRONS' || prizeUpper === 'APRON') {
        prizeCounts["APRONS"]++;
      } else if (prizeUpper.includes('INDUCTION') || prizeUpper.includes('COOKER')) {
        prizeCounts["INDUCTION COOKER"]++;
      } else if (prizeUpper.includes('KITCHEN') && prizeUpper.includes('SET')) {
        prizeCounts["KITCHEN SET"]++;
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
