const express = require('express');
const router = express.Router();
/**
 * @swagger
 * /api/admin/users/export:
 *   get:
 *     summary: Export all users data
 *     description: Get users data in various formats (json, csv)
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         required: false
 *         description: Export format (defaults to json)
 *     responses:
 *       200:
 *         description: Users data in requested format
 *       500:
 *         description: Server error
 */

router.get('/users/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const [users] = await req.db.query('SELECT * FROM users');
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      // Create CSV header
      let csv = 'ID,Name,Email,Location,Created At,Updated At\n';
      
      // Add data rows
      users.forEach(user => {
        csv += `${user.id},${user.name},${user.email},${user.location},${user.created_at},${user.updated_at}\n`;
      });
      
      return res.send(csv);
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/admin/results/export:
 *   get:
 *     summary: Export all spin results data
 *     description: Get spin results data in various formats (json, csv)
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         required: false
 *         description: Export format (defaults to json)
 *     responses:
 *       200:
 *         description: Spin results data in requested format
 *       500:
 *         description: Server error
 */
router.get('/results/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const [results] = await req.db.query('SELECT * FROM spin_results ORDER BY date DESC');
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=spin-results.csv');
      
      // Create CSV header - match the table column order
      let csv = 'ID,Name,Email,Location,Agent Name,Prize,Result,Date\n';
      
      // Add data rows with proper CSV escaping
      results.forEach(result => {
        const escapeCsvValue = (value) => {
          if (value === null || value === undefined) return 'N/A';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        };

        const row = [
          result.id,
          escapeCsvValue(result.name),
          escapeCsvValue(result.email),
          escapeCsvValue(result.location),
          escapeCsvValue(result.agent_name),
          escapeCsvValue(result.prize),
          result.is_win ? 'Win' : 'Loss',
          new Date(result.date).toLocaleString()
        ];
        
        csv += row.join(',') + '\n';
      });
      
      return res.send(csv);
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/admin/agent-prizes/export:
 *   get:
 *     summary: Export agent prize distribution data
 *     description: Get agent prize distribution data in various formats (json, csv)
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         required: false
 *         description: Export format (defaults to json)
 *     responses:
 *       200:
 *         description: Agent prize distribution data in requested format
 *       500:
 *         description: Server error
 */
router.get('/agent-prizes/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    
    // Get detailed agent prize data
    const [agentPrizeData] = await req.db.query(`
      SELECT 
        COALESCE(agent_name, 'N/A') as agent_name,
        prize,
        COUNT(*) as total_given,
        SUM(CASE WHEN is_win = true THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN is_win = false THEN 1 ELSE 0 END) as losses
      FROM spin_results 
      GROUP BY COALESCE(agent_name, 'N/A'), prize
      ORDER BY agent_name, total_given DESC
    `);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=agent-prize-distribution.csv');
      
      // Create CSV header
      let csv = 'Agent Name,Prize,Total Given,Wins,Losses,Win Rate %\n';
      
      // Add data rows with proper CSV escaping
      agentPrizeData.forEach(item => {
        const escapeCsvValue = (value) => {
          if (value === null || value === undefined) return 'N/A';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        };

        const winRate = item.total_given > 0 ? ((item.wins / item.total_given) * 100).toFixed(1) : '0';

        const row = [
          escapeCsvValue(item.agent_name),
          escapeCsvValue(item.prize),
          item.total_given,
          item.wins,
          item.losses,
          winRate + '%'
        ];
        
        csv += row.join(',') + '\n';
      });
      
      return res.send(csv);
    }
    
    res.json(agentPrizeData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
