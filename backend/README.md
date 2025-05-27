
# LogFlow Backend API

A comprehensive REST API for real-time log monitoring and analytics with MongoDB integration, WebSocket streaming, and automated metrics processing.

## Features

- **Real-time Log Streaming**: WebSocket-based live log broadcasting
- **Comprehensive Analytics**: Request volume, processing time, error rates, and service breakdowns
- **Automated Metrics Processing**: Background processing of hourly metrics and summaries
- **Flexible Filtering**: Advanced filtering and search capabilities
- **Swagger Documentation**: Interactive API documentation at `/api-docs`
- **Performance Optimized**: MongoDB indexes and aggregation pipelines for efficient queries
- **Scalable Architecture**: Designed for high-volume log ingestion

## Quick Start

### Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Installation

1. Clone and navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000` and Swagger UI at `http://localhost:5000/api-docs`.

## API Endpoints

### Logs
- `POST /api/logs` - Create new log entry
- `GET /api/logs` - Get logs with filtering and pagination
- `GET /api/logs/stats` - Get log statistics
- `DELETE /api/logs` - Bulk delete logs with filters

### Analytics
- `GET /api/analytics` - Get comprehensive analytics data
- `GET /api/analytics/realtime` - Get real-time metrics

### System
- `GET /health` - Health check endpoint
- `GET /api-docs` - Swagger UI documentation

## Real-time Features

### WebSocket Events

**Client → Server:**
- `join-service` - Join service-specific room for filtered logs
- `leave-service` - Leave service room
- `join-level` - Join log level room
- `leave-level` - Leave log level room

**Server → Client:**
- `connected` - Connection confirmation
- `newLog` - New log entry (all clients)
- `serviceLog` - Service-specific log (filtered clients)
- `levelLog` - Level-specific log (filtered clients)
- `metricsUpdate` - Real-time metrics update (every 30s)

## Data Models

### Log Schema
```javascript
{
  timestamp: Date,
  level: String, // info, warn, error, success, debug
  message: String,
  service: String,
  endpoint: String,
  statusCode: Number,
  processingTime: Number,
  userId: String,
  requestId: String,
  metadata: Object,
  ipAddress: String,
  userAgent: String
}
```

### Metrics Schema
```javascript
{
  date: Date,
  hour: Number,
  service: String,
  endpoint: String,
  totalRequests: Number,
  totalProcessingTime: Number,
  avgProcessingTime: Number,
  errorCount: Number,
  successCount: Number,
  statusCodes: Map,
  logLevels: Object
}
```

## Example Usage

### Creating a Log Entry
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "message": "User login successful",
    "service": "auth-service",
    "endpoint": "/api/login",
    "statusCode": 200,
    "processingTime": 150,
    "userId": "user123"
  }'
```

### Fetching Logs with Filters
```bash
curl "http://localhost:5000/api/logs?level=error&service=payment-service&page=1&limit=20"
```

### Getting Analytics Data
```bash
curl "http://localhost:5000/api/analytics?startDate=2024-01-01&endDate=2024-01-31"
```

## Background Processing

The system includes automated background processes:

1. **Hourly Metrics Processing** (every 5 minutes):
   - Aggregates logs from the previous hour
   - Calculates service and endpoint metrics
   - Stores processed data for efficient analytics queries

2. **Real-time Metrics Broadcasting** (every 30 seconds):
   - Sends live metrics to connected WebSocket clients
   - Includes recent activity summaries

3. **Optional Cleanup Process**:
   - Configurable retention policies for old logs and metrics

## Performance Considerations

- **Indexes**: Optimized MongoDB indexes for common query patterns
- **Aggregation Pipelines**: Efficient data processing for analytics
- **Rate Limiting**: Built-in request rate limiting
- **Connection Pooling**: MongoDB connection optimization
- **Compression**: Response compression for large datasets

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Joi-based request validation
- **Error Handling**: Secure error responses

## Monitoring & Health

- Health check endpoint for load balancer integration
- Structured logging for operational monitoring
- Graceful shutdown handling
- Connection status monitoring

## Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables
See `.env.example` for all available configuration options.

## Contributing

1. Follow existing code structure and naming conventions
2. Add appropriate error handling and validation
3. Update documentation for new endpoints
4. Include unit tests for new functionality
5. Ensure proper logging for debugging

## License

MIT License - see LICENSE file for details.
