
# Ilara Spin Wheel Game - Backend

This is the backend API for the Faulu Spin Wheel Game application. It provides endpoints to manage user data and spin results.

## Setup

1. Install MongoDB on your system if not already installed
2. Install dependencies:
   ```
   cd backend
   npm install
   ```

3. Create a `.env` file (or use the existing one) with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/faulu-spin-wheel
   ```

4. Start the server:
   ```
   npm run dev
   ```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:
http://localhost:5000/api-docs

## Available Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user by ID
- `POST /api/users` - Create a new user

### Spin Results
- `GET /api/spin-results` - Get all spin results
- `GET /api/spin-results/stats` - Get statistics about spin results
- `POST /api/spin-results` - Record a new spin result

## Database Schema

### User
- name: String (required)
- email: String (required, unique)
- location: String (required)
- timestamps: Created and updated timestamps

### SpinResult
- name: String (required)
- email: String (required)
- location: String (required)
- prize: String (required)
- isWin: Boolean (required)
- date: Date (default: current date)
- timestamps: Created and updated timestamps
