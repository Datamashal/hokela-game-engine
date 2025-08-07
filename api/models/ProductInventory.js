const mongoose = require('mongoose');


/**
 * @swagger
 * components:
 *   schemas:
 *     ProductInventory:
 *       type: object
 *       required:
 *         - productId
 *         - productName
 *         - totalQuantity
 *         - availableQuantity
 *         - agentId
 *       properties:
 *         productId:
 *           type: string
 *           description: Product identifier
 *         productName:
 *           type: string
 *           description: Product name/label
 *         totalQuantity:
 *           type: number
 *           description: Total quantity assigned
 *         availableQuantity:
 *           type: number
 *           description: Current available quantity
 *         distributedQuantity:
 *           type: number
 *           description: Quantity already distributed
 *         agentId:
 *           type: string
 *           description: Agent managing this inventory
 *         agentName:
 *           type: string
 *           description: Agent name
 *         location:
 *           type: string
 *           description: Location of inventory
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         productId: "key_holders"
 *         productName: "KEY HOLDERS"
 *         totalQuantity: 50
 *         availableQuantity: 45
 *         distributedQuantity: 5
 *         agentId: "agent_001"
 *         agentName: "John Doe"
 *         location: "Nairobi"
 */
const productInventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  distributedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  agentId: {
    type: String,
    required: true,
    trim: true
  },
  agentName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
productInventorySchema.index({ agentId: 1, productId: 1 });
productInventorySchema.index({ productId: 1 });
productInventorySchema.index({ availableQuantity: 1 });

// Update lastUpdated on save
productInventorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('ProductInventory', productInventorySchema);
