const express = require('express');
const router = express.Router();
/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Retrieve all business agents
 *     description: Get a list of all business agents
 *     responses:
 *       200:
 *         description: A list of business agents
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    console.log('Fetching all agents...');
    const [agents] = await req.db.query('SELECT * FROM agents ORDER BY created_at DESC');
    console.log(`Successfully fetched ${agents.length} agents`);
    res.json(agents);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /agents/prize-stats:
 *   get:
 *     summary: Get prize statistics for all agents
 *     description: Returns detailed statistics of prizes distributed by each agent
 *     responses:
 *       200:
 *         description: Agent prize statistics
 *       500:
 *         description: Server error
 */
router.get('/prize-stats', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    console.log('Fetching agent prize statistics...');
    
    // Get all agents with their spin statistics
    const [agentStats] = await req.db.query(`
      SELECT 
        a.agent_id,
        a.name as agent_name,
        COALESCE(COUNT(sr.id), 0) as total_spins,
        COALESCE(SUM(CASE WHEN sr.is_win = true THEN 1 ELSE 0 END), 0) as total_wins,
        COALESCE(
          CASE 
            WHEN COUNT(sr.id) > 0 
            THEN (SUM(CASE WHEN sr.is_win = true THEN 1 ELSE 0 END) / COUNT(sr.id)) * 100 
            ELSE 0 
          END, 
          0
        ) as win_rate
      FROM agents a
      LEFT JOIN spin_results sr ON a.agent_id = sr.agent_name OR a.name = sr.agent_name
      GROUP BY a.agent_id, a.name
      ORDER BY total_spins DESC
    `);

    // Get prize distribution for each agent
    const [prizeStats] = await req.db.query(`
      SELECT 
        COALESCE(sr.agent_name, 'Unknown') as agent_name,
        sr.prize,
        COUNT(*) as count
      FROM spin_results sr
      WHERE sr.is_win = true
      GROUP BY sr.agent_name, sr.prize
      ORDER BY sr.agent_name, count DESC
    `);

    // Combine the data
    const result = agentStats.map(agent => {
      const agentPrizes = prizeStats.filter(p => 
        p.agent_name === agent.agent_id || p.agent_name === agent.agent_name
      );
      
      const prizes_won = {};
      agentPrizes.forEach(prize => {
        prizes_won[prize.prize] = prize.count;
      });

      return {
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        total_spins: parseInt(agent.total_spins),
        total_wins: parseInt(agent.total_wins),
        win_rate: parseFloat(agent.win_rate.toFixed(2)),
        prizes_won
      };
    });
    
    console.log('Successfully fetched agent prize statistics');
    res.json(result);
  } catch (err) {
    console.error('Error fetching agent prize stats:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new business agent
 *     description: Add a new business agent to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - name
 *               - email
 *             properties:
 *               agent_id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agent created successfully
 *       400:
 *         description: Invalid data provided
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    const { agent_id, name, email, phone, location } = req.body;
    
    if (!agent_id || !name || !email) {
      return res.status(400).json({ message: 'Agent ID, name, and email are required' });
    }
    
    const [result] = await req.db.query(
      'INSERT INTO agents (agent_id, name, email, phone, location) VALUES (?, ?, ?, ?, ?)',
      [agent_id, name, email, phone || null, location || '']
    );
    
    const [newAgent] = await req.db.query('SELECT * FROM agents WHERE id = ?', [result.insertId]);
    res.status(201).json(newAgent[0]);
  } catch (err) {
    console.error('Error creating agent:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Agent ID or email already exists' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update a business agent
 *     description: Update an existing business agent
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    const { id } = req.params;
    const { agent_id, name, email, phone, location } = req.body;
    
    const [result] = await req.db.query(
      'UPDATE agents SET agent_id = ?, name = ?, email = ?, phone = ?, location = ? WHERE id = ?',
      [agent_id, name, email, phone || null, location || '', id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    const [updatedAgent] = await req.db.query('SELECT * FROM agents WHERE id = ?', [id]);
    res.json(updatedAgent[0]);
  } catch (err) {
    console.error('Error updating agent:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /agents/{id}:
 *   delete:
 *     summary: Delete a business agent
 *     description: Remove a business agent from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agent deleted successfully
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    const { id } = req.params;
    
    const [result] = await req.db.query('DELETE FROM agents WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).json({ message: err.message });
  }
});

// OPTIONS handler for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;
