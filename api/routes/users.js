
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Get a list of all registered users
 *     responses:
 *       200:
 *         description: A list of users
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res) => {
  try {
    const [users] = await req.db.query('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const [users] = await req.db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid data provided
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, location } = req.body;
    
    if (!name || !email || !location) {
      return res.status(400).json({ message: 'Name, email and location are required' });
    }
    
    const [result] = await req.db.query(
      'INSERT INTO users (name, email, location) VALUES (?, ?, ?)',
      [name, email, location]
    );
    
    if (result.affectedRows) {
      const [newUser] = await req.db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      res.status(201).json(newUser[0]);
    } else {
      throw new Error('Failed to create user');
    }
  } catch (err) {
    // Check for duplicate email error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
