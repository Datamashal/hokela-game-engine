const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PrizeDistribution:
 *       type: object
 *       properties:
 *         product_id:
 *           type: string
 *           description: Product identifier
 *         product_name:
 *           type: string
 *           description: Product name
 *         total_assigned:
 *           type: integer
 *           description: Total quantity assigned to all agents
 *         total_distributed:
 *           type: integer
 *           description: Total quantity distributed to winners
 *         remaining_inventory:
 *           type: integer
 *           description: Total remaining inventory across all agents
 *         agents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: string
 *               agent_name:
 *                 type: string
 *               location:
 *                 type: string
 *               assigned:
 *                 type: integer
 *               distributed:
 *                 type: integer
 *               remaining:
 *                 type: integer
 */

/**
 * @swagger
 * /prize-distribution:
 *   get:
 *     summary: Get comprehensive prize distribution statistics
 *     description: Returns detailed distribution statistics for all products across all agents
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by specific agent
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by specific product
 *     responses:
 *       200:
 *         description: Prize distribution statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_products:
 *                       type: integer
 *                     total_agents:
 *                       type: integer
 *                     total_assigned:
 *                       type: integer
 *                     total_distributed:
 *                       type: integer
 *                     total_remaining:
 *                       type: integer
 *                     out_of_stock_count:
 *                       type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrizeDistribution'
 */
router.get('/', async (req, res) => {
  try {
    const { agent_id, product_id } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (agent_id) {
      whereClause += ' WHERE agent_id = ?';
      params.push(agent_id);
    }
    
    if (product_id) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' product_id = ?';
      params.push(product_id);
    }

    // Get product distribution statistics
    const [productStats] = await req.db.query(`
      SELECT 
        product_id,
        product_name,
        SUM(total_quantity) as total_assigned,
        SUM(distributed_quantity) as total_distributed,
        SUM(available_quantity) as remaining_inventory,
        COUNT(*) as agent_count,
        SUM(CASE WHEN available_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_agents
      FROM product_inventory 
      ${whereClause}
      GROUP BY product_id, product_name
      ORDER BY product_name
    `, params);

    // Get detailed agent breakdown for each product
    const products = [];
    for (const product of productStats) {
      const [agentBreakdown] = await req.db.query(`
        SELECT 
          agent_id,
          agent_name,
          location,
          total_quantity as assigned,
          distributed_quantity as distributed,
          available_quantity as remaining
        FROM product_inventory 
        WHERE product_id = ? ${agent_id ? 'AND agent_id = ?' : ''}
        ORDER BY agent_name
      `, agent_id ? [product.product_id, agent_id] : [product.product_id]);

      products.push({
        product_id: product.product_id,
        product_name: product.product_name,
        total_assigned: product.total_assigned,
        total_distributed: product.total_distributed,
        remaining_inventory: product.remaining_inventory,
        agent_count: product.agent_count,
        out_of_stock_agents: product.out_of_stock_agents,
        agents: agentBreakdown
      });
    }

    // Calculate summary statistics
    const summary = {
      total_products: productStats.length,
      total_agents: [...new Set(products.flatMap(p => p.agents.map(a => a.agent_id)))].length,
      total_assigned: productStats.reduce((sum, p) => sum + p.total_assigned, 0),
      total_distributed: productStats.reduce((sum, p) => sum + p.total_distributed, 0),
      total_remaining: productStats.reduce((sum, p) => sum + p.remaining_inventory, 0),
      out_of_stock_count: productStats.reduce((sum, p) => sum + p.out_of_stock_agents, 0)
    };

    res.json({
      summary,
      products
    });
  } catch (err) {
    console.error('Error fetching prize distribution:', err);
    res.status(500).json({ message: 'Error fetching prize distribution', error: err.message });
  }
});

/**
 * @swagger
 * /prize-distribution/current-wheel:
 *   get:
 *     summary: Get current wheel product availability
 *     description: Returns which products are currently available for the spin wheel based on inventory
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID to check inventory for
 *     responses:
 *       200:
 *         description: Current wheel configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available_products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: string
 *                       product_name:
 *                         type: string
 *                       available_quantity:
 *                         type: integer
 *                       should_show_on_wheel:
 *                         type: boolean
 *                 wheel_configuration:
 *                   type: object
 *                   properties:
 *                     win_sectors:
 *                       type: integer
 *                     try_again_sectors:
 *                       type: integer
 *                     total_sectors:
 *                       type: integer
 */
router.get('/current-wheel', async (req, res) => {
  try {
    const { agent_id } = req.query;
    
    if (!agent_id) {
      return res.status(400).json({ message: 'agent_id is required' });
    }

    // Get all products for this agent with their current inventory
    const [products] = await req.db.query(`
      SELECT 
        product_id,
        product_name,
        available_quantity,
        distributed_quantity,
        total_quantity,
        CASE WHEN available_quantity > 0 THEN true ELSE false END as should_show_on_wheel
      FROM product_inventory 
      WHERE agent_id = ?
      ORDER BY product_name
    `, [agent_id]);

    // Calculate wheel configuration
    const availableProducts = products.filter(p => p.available_quantity > 0);
    const winSectors = availableProducts.length;
    const tryAgainSectors = Math.max(2, winSectors); // At least 2 "Try Again" sectors
    const totalSectors = winSectors + tryAgainSectors;

    // Get recent distribution stats
    const [recentStats] = await req.db.query(`
      SELECT 
        COUNT(*) as total_spins,
        SUM(CASE WHEN is_win = true THEN 1 ELSE 0 END) as total_wins,
        COUNT(DISTINCT CASE WHEN is_win = true THEN prize END) as unique_prizes_won
      FROM spin_results 
      WHERE date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND agent_name = (SELECT agent_name FROM product_inventory WHERE agent_id = ? LIMIT 1)
    `, [agent_id]);

    res.json({
      available_products: products,
      wheel_configuration: {
        win_sectors: winSectors,
        try_again_sectors: tryAgainSectors,
        total_sectors: totalSectors,
        win_percentage: totalSectors > 0 ? Math.round((winSectors / totalSectors) * 100) : 0
      },
      recent_activity: recentStats[0] || {
        total_spins: 0,
        total_wins: 0,
        unique_prizes_won: 0
      }
    });
  } catch (err) {
    console.error('Error fetching current wheel configuration:', err);
    res.status(500).json({ message: 'Error fetching wheel configuration', error: err.message });
  }
});

/**
 * @swagger
 * /prize-distribution/low-stock:
 *   get:
 *     summary: Get products with low stock levels
 *     description: Returns products that are running low on inventory (less than specified threshold)
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Stock level threshold (default: 5)
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by specific agent
 *     responses:
 *       200:
 *         description: Products with low stock
 */
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = 5, agent_id } = req.query;
    
    let whereClause = 'WHERE available_quantity <= ? AND available_quantity > 0';
    const params = [threshold];
    
    if (agent_id) {
      whereClause += ' AND agent_id = ?';
      params.push(agent_id);
    }

    const [lowStockItems] = await req.db.query(`
      SELECT 
        product_id,
        product_name,
        agent_id,
        agent_name,
        location,
        total_quantity,
        available_quantity,
        distributed_quantity,
        ROUND((available_quantity / total_quantity) * 100, 2) as stock_percentage
      FROM product_inventory 
      ${whereClause}
      ORDER BY available_quantity ASC, product_name
    `, params);

    // Get out of stock items
    const outOfStockWhere = agent_id ? 'WHERE available_quantity = 0 AND agent_id = ?' : 'WHERE available_quantity = 0';
    const outOfStockParams = agent_id ? [agent_id] : [];
    
    const [outOfStockItems] = await req.db.query(`
      SELECT 
        product_id,
        product_name,
        agent_id,
        agent_name,
        location,
        total_quantity,
        distributed_quantity
      FROM product_inventory 
      ${outOfStockWhere}
      ORDER BY product_name
    `, outOfStockParams);

    res.json({
      threshold,
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      summary: {
        low_stock_count: lowStockItems.length,
        out_of_stock_count: outOfStockItems.length,
        total_affected_products: lowStockItems.length + outOfStockItems.length
      }
    });
  } catch (err) {
    console.error('Error fetching low stock items:', err);
    res.status(500).json({ message: 'Error fetching low stock items', error: err.message });
  }
});

module.exports = router;