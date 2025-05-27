
let io;

/**
 * Initialize Socket.IO instance
 */
const init = (socketIo) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to LogFlow stream',
      timestamp: new Date().toISOString()
    });
    
    // Handle client joining specific rooms for filtering
    socket.on('join-service', (serviceName) => {
      socket.join(`service:${serviceName}`);
      console.log(`Client ${socket.id} joined service room: ${serviceName}`);
    });
    
    socket.on('leave-service', (serviceName) => {
      socket.leave(`service:${serviceName}`);
      console.log(`Client ${socket.id} left service room: ${serviceName}`);
    });
    
    socket.on('join-level', (level) => {
      socket.join(`level:${level}`);
      console.log(`Client ${socket.id} joined level room: ${level}`);
    });
    
    socket.on('leave-level', (level) => {
      socket.leave(`level:${level}`);
      console.log(`Client ${socket.id} left level room: ${level}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  
  console.log('Stream service initialized');
};

/**
 * Broadcast new log to all connected clients
 */
const broadcastLog = (log) => {
  if (io) {
    // Broadcast to all clients
    io.emit('newLog', log);
    
    // Broadcast to service-specific rooms
    io.to(`service:${log.service}`).emit('serviceLog', log);
    
    // Broadcast to level-specific rooms
    io.to(`level:${log.level}`).emit('levelLog', log);
    
    console.log(`Log broadcasted: ${log.level} - ${log.service} - ${log.message.substring(0, 50)}...`);
  }
};

/**
 * Broadcast metrics update
 */
const broadcastMetrics = (metrics) => {
  if (io) {
    io.emit('metricsUpdate', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get connected clients count
 */
const getConnectedClientsCount = () => {
  return io ? io.engine.clientsCount : 0;
};

module.exports = {
  init,
  broadcastLog,
  broadcastMetrics,
  getConnectedClientsCount
};
