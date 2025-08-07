
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     SpinResult:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - location
 *         - prize
 *         - isWin
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         location:
 *           type: string
 *           description: User's location or city
 *         prize:
 *           type: string
 *           description: Prize label or description
 *         isWin:
 *           type: boolean
 *           description: Whether the spin resulted in a win
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the spin
 *       example:
 *         name: John Doe
 *         email: john.doe@example.com
 *         location: Nairobi
 *         prize: NOTEBOOK 📒
 *         isWin: true
 *         date: 2023-05-20T12:30:45.000Z
 */
const spinResultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  prize: {
    type: String,
    required: true
  },
  isWin: {
    type: Boolean,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

//exporting the results

module.exports = mongoose.model('SpinResult', spinResultSchema);
