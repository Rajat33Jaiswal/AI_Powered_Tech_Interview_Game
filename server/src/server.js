import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import sequelize from './db/connection.js';
import initGameSocket from './socket/gameSocket.js';
import config from './config.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST']
  }
});

// Initialize real-time game socket events
initGameSocket(io);

// Sync database and start server
async function startServer() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Syncing database schema (creating tables if they do not exist)...');
    // Safety check: only run schema alteration outside production
    await sequelize.sync({ alter: config.nodeEnv !== 'production' });
    console.log('Database sync complete.');

    server.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 AI-Powered Tech Interview Game server running!`);
      console.log(`🎧 Listening on port: ${PORT}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('CRITICAL: Server initialization failed:', error);
    process.exit(1);
  }
}

startServer();
