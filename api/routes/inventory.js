const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       required:
 *         - product_id
 *         - product_name
 *         - total_quantity
 *         - available_quantity
 *         - agent_id
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique ID
 *         product_id:
 *           type: string
 *           description: Product identifier
 *         product_name:
 *           type: string
 *           description: Product name/label
 *         total_quantity:
 *           type: integer
 *           description: Total quantity assigned
 *         available_quantity:
 *           type: integer
 *           description: Current available quantity
 *         distributed_quantity:
 *           type: integer
 *           description: Quantity already distributed
 *         agent_id:
 *           type: string
 *           description: Agent managing this inventory
 *         agent_name:
 *           type: string
 *           description: Agent name
 *         location:
 *           type: string
 *           description: Location of inventory
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: available_only
 *         schema:
 *           type: boolean
 *         description: Show only items with available quantity > 0
 *     responses:
 *       200:
 *         description: List of inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 */
router.get('/', async (req, res) => {
  try {
    const { agent_id, product_id, available_only } = req.query;
    
    let query = `
      SELECT id, product_id, product_name, total_quantity, available_quantity, 
             distributed_quantity, agent_id, agent_name, location, created_at, updated_at
      FROM product_inventory 
      WHERE 1=1
    `;
    const params = [];

    if (agent_id) {
      query += ` AND agent_id = ?`;
      params.push(agent_id);
    }

    if (product_id) {
      query += ` AND product_id = ?`;
      params.push(product_id);
    }

    if (available_only === 'true') {
      query += ` AND available_quantity > 0`;
    }

    query += ` ORDER BY created_at DESC`;

    const [inventory] = await req.db.query(query, params);
    res.json(inventory);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ message: 'Error fetching inventory', error: err.message });
  }
});

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create new inventory item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - product_name
 *               - total_quantity
 *               - agent_id
 *               - agent_name
 *               - location
 *             properties:
 *               product_id:
 *                 type: string
 *               product_name:
 *                 type: string
 *               total_quantity:
 *                 type: integer
 *               agent_id:
 *                 type: string
 *               agent_name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { product_id, product_name, total_quantity, agent_id, agent_name, location } = req.body;

    if (!product_id || !product_name || !total_quantity || !agent_id || !agent_name || !location) {
      return res.status(400).json({ 
        message: 'All fields are required: product_id, product_name, total_quantity, agent_id, agent_name, location' 
      });
    }

    // Check if inventory item already exists for this agent and product
    const [existing] = await req.db.query(
      'SELECT * FROM product_inventory WHERE agent_id = ? AND product_id = ?',
      [agent_id, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        message: 'Inventory item already exists for this agent and product. Use PUT to update.' 
      });
    }

    const [result] = await req.db.query(
      `INSERT INTO product_inventory 
       (product_id, product_name, total_quantity, available_quantity, distributed_quantity, 
        agent_id, agent_name, location) 
       VALUES (?, ?, ?, ?, 0)`,
      [product_id, product_name, total_quantity, total_quantity, agent_id, agent_name, location]
    );

    const [newItem] = await req.db.query(
      'SELECT * FROM product_inventory WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newItem[0]);
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ message: 'Error creating inventory item', error: err.message });
  }
});

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update inventory item
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
 *               total_quantity:
 *                 type: integer
 *               available_quantity:
 *                 type: integer
 *               agent_name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total_quantity, available_quantity, agent_name, location } = req.body;

    const [existing] = await req.db.query(
      'SELECT * FROM product_inventory WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (total_quantity !== undefined) {
      updateFields.push('total_quantity = ?');
      updateValues.push(total_quantity);
    }

    if (available_quantity !== undefined) {
      updateFields.push('available_quantity = ?');
      updateValues.push(available_quantity);
      
      // Update distributed quantity
      const newDistributed = (total_quantity || existing[0].total_quantity) - available_quantity;
      updateFields.push('distributed_quantity = ?');
      updateValues.push(newDistributed);
    }

    if (agent_name) {
      updateFields.push('agent_name = ?');
      updateValues.push(agent_name);
    }

    if (location) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await req.db.query(
      `UPDATE product_inventory SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await req.db.query(
      'SELECT * FROM product_inventory WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ message: 'Error updating inventory item', error: err.message });
  }
});

/**
 * @swagger
 * /inventory/check-stock:
 *   post:
 *     summary: Check if product is available in stock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - agent_id
 *             properties:
 *               product_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 quantity:
 *                   type: integer
 *                 product_name:
 *                   type: string
 */
router.post('/check-stock', async (req, res) => {
  try {
    const { product_id, agent_id } = req.body;

    if (!product_id || !agent_id) {
      return res.status(400).json({ message: 'product_id and agent_id are required' });
    }

    const [inventory] = await req.db.query(
      'SELECT * FROM product_inventory WHERE product_id = ? AND agent_id = ? AND available_quantity > 0',
      [product_id, agent_id]
    );

    if (inventory.length === 0) {
      return res.json({
        available: false,
        quantity: 0,
        product_name: null
      });
    }

    res.json({
      available: true,
      quantity: inventory[0].available_quantity,
      product_name: inventory[0].product_name
    });
  } catch (err) {
    console.error('Error checking stock:', err);
    res.status(500).json({ message: 'Error checking stock', error: err.message });
  }
});

/**
 * @swagger
 * /inventory/distribute:
 *   post:
 *     summary: Distribute a product (decrease inventory)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - agent_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Product distributed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 remaining_quantity:
 *                   type: integer
 *                 distributed_quantity:
 *                   type: integer
 */
router.post('/distribute', async (req, res) => {
  try {
    const { product_id, agent_id, quantity = 1 } = req.body;

    if (!product_id || !agent_id) {
      return res.status(400).json({ message: 'product_id and agent_id are required' });
    }

    // Get current inventory
    const [inventory] = await req.db.query(
      'SELECT * FROM product_inventory WHERE product_id = ? AND agent_id = ?',
      [product_id, agent_id]
    );

    if (inventory.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const item = inventory[0];
    
    if (item.available_quantity < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: item.available_quantity,
        requested: quantity
      });
    }

    // Update inventory
    const newAvailable = item.available_quantity - quantity;
    const newDistributed = item.distributed_quantity + quantity;

    await req.db.query(
      `UPDATE product_inventory 
       SET available_quantity = ?, distributed_quantity = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newAvailable, newDistributed, item.id]
    );

    res.json({
      success: true,
      remaining_quantity: newAvailable,
      distributed_quantity: newDistributed,
      product_name: item.product_name
    });
  } catch (err) {
    console.error('Error distributing product:', err);
    res.status(500).json({ message: 'Error distributing product', error: err.message });
  }
});

/**
 * @swagger
 * /inventory/restock:
 *   post:
 *     summary: Restock a product (increase inventory)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - agent_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product restocked successfully
 */
router.post('/restock', async (req, res) => {
  try {
    const { product_id, agent_id, quantity } = req.body;

    if (!product_id || !agent_id || !quantity) {
      return res.status(400).json({ message: 'product_id, agent_id, and quantity are required' });
    }

    // Get current inventory
    const [inventory] = await req.db.query(
      'SELECT * FROM product_inventory WHERE product_id = ? AND agent_id = ?',
      [product_id, agent_id]
    );

    if (inventory.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const item = inventory[0];
    const newAvailable = item.available_quantity + quantity;
    const newTotal = item.total_quantity + quantity;

    await req.db.query(
      `UPDATE product_inventory 
       SET available_quantity = ?, total_quantity = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newAvailable, newTotal, item.id]
    );

    res.json({
      success: true,
      new_available: newAvailable,
      new_total: newTotal,
      restocked_quantity: quantity
    });
  } catch (err) {
    console.error('Error restocking product:', err);
    res.status(500).json({ message: 'Error restocking product', error: err.message });
  }
});

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Get inventory summary statistics
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *     responses:
 *       200:
 *         description: Inventory summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_products:
 *                   type: integer
 *                 total_quantity:
 *                   type: integer
 *                 available_quantity:
 *                   type: integer
 *                 distributed_quantity:
 *                   type: integer
 *                 out_of_stock_products:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/summary', async (req, res) => {
  try {
    const { agent_id } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (agent_id) {
      whereClause = 'WHERE agent_id = ?';
      params.push(agent_id);
    }

    // Get summary statistics
    const [summary] = await req.db.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(total_quantity) as total_quantity,
        SUM(available_quantity) as available_quantity,
        SUM(distributed_quantity) as distributed_quantity,
        SUM(CASE WHEN available_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products
      FROM product_inventory ${whereClause}
    `, params);

    // Get product breakdown
    const [products] = await req.db.query(`
      SELECT product_id, product_name, 
             SUM(total_quantity) as total_quantity,
             SUM(available_quantity) as available_quantity,
             SUM(distributed_quantity) as distributed_quantity,
             COUNT(*) as locations
      FROM product_inventory ${whereClause}
      GROUP BY product_id, product_name
      ORDER BY product_name
    `, params);

    res.json({
      ...summary[0],
      products
    });
  } catch (err) {
    console.error('Error getting inventory summary:', err);
    res.status(500).json({ message: 'Error getting inventory summary', error: err.message });
  }
});

module.exports = router;