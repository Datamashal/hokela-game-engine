
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductAssignment:
 *       type: object
 *       required:
 *         - agent_id
 *         - product_id
 *         - quantity
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique ID
 *         agent_id:
 *           type: string
 *           description: Agent identifier
 *         product_id:
 *           type: integer
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           description: Quantity assigned
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /product-assignments:
 *   get:
 *     summary: Get all product assignments
 *     responses:
 *       200:
 *         description: List of product assignments with agent and product details
 */
router.get('/', async (req, res) => {
  try {
    const [assignments] = await req.db.query(`
      SELECT 
        pa.id,
        pa.agent_id,
        a.name as agent_name,
        pa.product_id,
        p.name as product_name,
        pa.quantity,
        pa.created_at,
        pa.updated_at
      FROM product_assignments pa
      LEFT JOIN agents a ON pa.agent_id = a.agent_id
      LEFT JOIN products p ON pa.product_id = p.id
      ORDER BY pa.created_at DESC
    `);
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching product assignments:', err);
    res.status(500).json({ message: 'Error fetching product assignments', error: err.message });
  }
});

/**
 * @swagger
 * /product-assignments:
 *   post:
 *     summary: Create a new product assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - product_id
 *               - quantity
 *             properties:
 *               agent_id:
 *                 type: string
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product assignment created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { agent_id, product_id, quantity } = req.body;

    if (!agent_id || !product_id || !quantity) {
      return res.status(400).json({ message: 'Agent ID, product ID, and quantity are required' });
    }

    // Check if agent exists
    const [agent] = await req.db.query(
      'SELECT agent_id FROM agents WHERE agent_id = ?',
      [agent_id]
    );

    if (agent.length === 0) {
      return res.status(400).json({ message: 'Agent not found' });
    }

    // Check if product exists
    const [product] = await req.db.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (product.length === 0) {
      return res.status(400).json({ message: 'Product not found' });
    }

    const [result] = await req.db.query(
      `INSERT INTO product_assignments (agent_id, product_id, quantity) VALUES (?, ?, ?)`,
      [agent_id, product_id, quantity]
    );

    const [newAssignment] = await req.db.query(`
      SELECT 
        pa.id,
        pa.agent_id,
        a.name as agent_name,
        pa.product_id,
        p.name as product_name,
        pa.quantity,
        pa.created_at,
        pa.updated_at
      FROM product_assignments pa
      LEFT JOIN agents a ON pa.agent_id = a.agent_id
      LEFT JOIN products p ON pa.product_id = p.id
      WHERE pa.id = ?
    `, [result.insertId]);

    res.status(201).json(newAssignment[0]);
  } catch (err) {
    console.error('Error creating product assignment:', err);
    res.status(500).json({ message: 'Error creating product assignment', error: err.message });
  }
});

/**
 * @swagger
 * /product-assignments/{id}:
 *   put:
 *     summary: Update a product assignment
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
 *             required:
 *               - agent_id
 *               - product_id
 *               - quantity
 *             properties:
 *               agent_id:
 *                 type: string
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product assignment updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { agent_id, product_id, quantity } = req.body;

    if (!agent_id || !product_id || !quantity) {
      return res.status(400).json({ message: 'Agent ID, product ID, and quantity are required' });
    }

    const [existingAssignment] = await req.db.query(
      'SELECT * FROM product_assignments WHERE id = ?',
      [id]
    );

    if (existingAssignment.length === 0) {
      return res.status(404).json({ message: 'Product assignment not found' });
    }

    // Check if agent exists
    const [agent] = await req.db.query(
      'SELECT agent_id FROM agents WHERE agent_id = ?',
      [agent_id]
    );

    if (agent.length === 0) {
      return res.status(400).json({ message: 'Agent not found' });
    }

    // Check if product exists
    const [product] = await req.db.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (product.length === 0) {
      return res.status(400).json({ message: 'Product not found' });
    }

    await req.db.query(
      `UPDATE product_assignments SET agent_id = ?, product_id = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [agent_id, product_id, quantity, id]
    );

    const [updatedAssignment] = await req.db.query(`
      SELECT 
        pa.id,
        pa.agent_id,
        a.name as agent_name,
        pa.product_id,
        p.name as product_name,
        pa.quantity,
        pa.created_at,
        pa.updated_at
      FROM product_assignments pa
      LEFT JOIN agents a ON pa.agent_id = a.agent_id
      LEFT JOIN products p ON pa.product_id = p.id
      WHERE pa.id = ?
    `, [id]);

    res.json(updatedAssignment[0]);
  } catch (err) {
    console.error('Error updating product assignment:', err);
    res.status(500).json({ message: 'Error updating product assignment', error: err.message });
  }
});

/**
 * @swagger
 * /product-assignments/{id}:
 *   delete:
 *     summary: Delete a product assignment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product assignment deleted successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existingAssignment] = await req.db.query(
      'SELECT * FROM product_assignments WHERE id = ?',
      [id]
    );

    if (existingAssignment.length === 0) {
      return res.status(404).json({ message: 'Product assignment not found' });
    }

    await req.db.query('DELETE FROM product_assignments WHERE id = ?', [id]);
    
    res.json({ message: 'Product assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting product assignment:', err);
    res.status(500).json({ message: 'Error deleting product assignment', error: err.message });
  }
});

module.exports = router;
