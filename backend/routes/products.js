
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', async (req, res) => {
  try {
    // Ensure product_stock table exists so we can join stock info
    await req.db.query(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id INT PRIMARY KEY,
        total_quantity INT NOT NULL DEFAULT 0,
        available_quantity INT NOT NULL DEFAULT 0,
        distributed_quantity INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [products] = await req.db.query(`
      SELECT 
        p.id, p.name, p.description, p.created_at, p.updated_at,
        COALESCE(ps.total_quantity, 0) + IFNULL(SUM(pi.total_quantity), 0) AS total_quantity,
        COALESCE(ps.available_quantity, 0) + IFNULL(SUM(pi.available_quantity), 0) AS available_quantity,
        COALESCE(ps.distributed_quantity, 0) + IFNULL(SUM(pi.distributed_quantity), 0) AS distributed_quantity
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      LEFT JOIN product_inventory pi ON pi.product_id = p.id
      GROUP BY p.id, p.name, p.description, p.created_at, p.updated_at, ps.total_quantity, ps.available_quantity, ps.distributed_quantity
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, quantity } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const [result] = await req.db.query(
      `INSERT INTO products (name, description) VALUES (?, ?)`,
      [name, description]
    );

    const [newProduct] = await req.db.query(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    // If initial quantity provided, create/update global stock without assigning to an agent
    if (quantity !== undefined && quantity !== null && !isNaN(parseInt(quantity))) {
      const initialQty = Math.max(0, parseInt(quantity));

      // Ensure product_stock table exists
      await req.db.query(`
        CREATE TABLE IF NOT EXISTS product_stock (
          product_id INT PRIMARY KEY,
          total_quantity INT NOT NULL DEFAULT 0,
          available_quantity INT NOT NULL DEFAULT 0,
          distributed_quantity INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Upsert stock
      await req.db.query(
        `INSERT INTO product_stock (product_id, total_quantity, available_quantity, distributed_quantity)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           total_quantity = VALUES(total_quantity),
           available_quantity = VALUES(available_quantity)`,
        [result.insertId, initialQty, initialQty]
      );
    }

    res.status(201).json(newProduct[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
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
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const [existingProduct] = await req.db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await req.db.query(
      `UPDATE products SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, description, id]
    );

    const [updatedProduct] = await req.db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    res.json(updatedProduct[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existingProduct] = await req.db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await req.db.query('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

module.exports = router;
