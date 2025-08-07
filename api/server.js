const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['https://wafcon-spin-wheel.vercel.app', 'https://wafcon-spin-win-game.vercel.app', process.env.FRONTEND_URL || '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(morgan('dev')); // Logging

// Log connection parameters (sensitive information masked in production)
console.log('Attempting to connect to database with the following parameters:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Connection limit: 10`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// MySQL connection pool with improved error handling and SSL disabled
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  ssl: false, // Disable SSL since the server doesn't support it
  connectTimeout: 60000, // 60 seconds
  debug: process.env.NODE_ENV !== 'production'
});

// Test database connection on startup with detailed diagnostics
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database!');
    
    // Test query
    const [result] = await connection.query('SELECT 1 AS connected');
    if (result[0].connected === 1) {
      console.log('✅ Database query test successful');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('SQL state:', error.sqlState);
    console.error('SQL message:', error.sqlMessage);
    console.error('Please check:');
    console.error('1. Database credentials in .env file');
    console.error('2. Database server is running and accessible from this server IP');
    console.error('3. Firewall allows connections from this server to the database server');
    console.error('4. Database user has proper permissions');
  }
})();

// Add pool to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Database initialization
const initDb = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(100) NOT NULL,
        agent_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create spin_results table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS spin_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        agent_name VARCHAR(100),
        prize VARCHAR(50) NOT NULL,
        is_win BOOLEAN NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agents table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20),
        location VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create products table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create product_assignments table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id VARCHAR(50) NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_agent_id (agent_id),
        INDEX idx_product_id (product_id)
      )
    `);
    
    // Add agent_name column to users table if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100)
      `);
      console.log('Added agent_name column to users table (if it didn\'t exist)');
    } catch (err) {
      // Handle the case where ADD COLUMN IF NOT EXISTS isn't supported
      if (err.code !== 'ER_PARSE_ERROR') {
        throw err;
      }
      
      // Check if column exists
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM users LIKE 'agent_name'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN agent_name VARCHAR(100)
        `);
        console.log('Added agent_name column to users table');
      } else {
        console.log('agent_name column already exists in users table');
      }
    }

    // Add agent_name column to spin_results table if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE spin_results 
        ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100)
      `);
      console.log('Added agent_name column to spin_results table (if it didn\'t exist)');
    } catch (err) {
      // Handle the case where ADD COLUMN IF NOT EXISTS isn't supported
      if (err.code !== 'ER_PARSE_ERROR') {
        throw err;
      }
      
      // Check if column exists
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM spin_results LIKE 'agent_name'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE spin_results 
          ADD COLUMN agent_name VARCHAR(100)
        `);
        console.log('Added agent_name column to spin_results table');
      } else {
        console.log('agent_name column already exists in spin_results table');
      }
    }

    // Add location column to agents table if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE agents 
        ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT ''
      `);
      console.log('Added location column to agents table (if it didn\'t exist)');
    } catch (err) {
      // Handle the case where ADD COLUMN IF NOT EXISTS isn't supported
      if (err.code !== 'ER_PARSE_ERROR') {
        throw err;
      }
      
      // Check if column exists
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM agents LIKE 'location'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE agents 
          ADD COLUMN location VARCHAR(100) DEFAULT ''
        `);
        console.log('Added location column to agents table');
      } else {
        console.log('location column already exists in agents table');
      }
    }

    // Add phone column to agents table if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE agents 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
      `);
      console.log('Added phone column to agents table (if it didn\'t exist)');
    } catch (err) {
      // Handle the case where ADD COLUMN IF NOT EXISTS isn't supported
      if (err.code !== 'ER_PARSE_ERROR') {
        throw err;
      }
      
      // Check if column exists
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM agents LIKE 'phone'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE agents 
          ADD COLUMN phone VARCHAR(20)
        `);
        console.log('Added phone column to agents table');
      } else {
        console.log('phone column already exists in agents table');
      }
    }
    
    connection.release();
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Check database username and password.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if database server is running and accessible.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Check database name.');
    }
  }
};

// Initialize the database
initDb();

// Import routes
const userRoutes = require('./routes/users');
const spinResultRoutes = require('./routes/spinResults');
const adminRoutes = require('./routes/admin');
const agentRoutes = require('./routes/agents');
const productRoutes = require('./routes/products');
const productAssignmentRoutes = require('./routes/productAssignments');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wafcon Spin Wheel API',
      version: '1.0.0',
      description: 'API documentation for Wafcon Spin Wheel Game',
    },
    servers: [
    {
      url: 'https://wafcon-win-spin-game.onrender.com',
      description: 'Production API Server',
    }
  ],
},
  apis: ['./server.js', './routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Configure Swagger UI with improved options for better accessibility
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Wafcon Spin Wheel API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    syntaxHighlight: {
      activate: true,
      theme: "agate"
    }
  }
}));

// Expose the Swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date(), 
    env: process.env.NODE_ENV,
    dbConnected: !!pool
  });
});

// CORS preflight for all routes
app.options('*', cors());

// API welcome endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Wafcon Spin Wheel API', 
    version: '1.0.0',
    endpoints: [
      '/users',
      '/spin-results',
      '/admin',
      '/agents',
      '/products',
      '/product-assignments',
      '/health'
    ]
  });
});

// Routes - Mount without /api prefix
app.use('/users', userRoutes);
app.use('/spin-results', spinResultRoutes);
app.use('/admin', adminRoutes);
app.use('/agents', agentRoutes);
app.use('/products', productRoutes);
app.use('/product-assignments', productAssignmentRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Check if API is running
 *     description: Returns a welcome message if the API is running
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Wafcon Spin Wheel API',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date(),
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
