// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const compression = require('compression');

// Initialize app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with optimizations
const io = socketIo(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable Gzip compression
app.use(compression());

// Serve static files with caching
app.use(express.static(path.join(__dirname, '../client'), {
  maxAge: '1d'
}));

// In-memory data store (simplified)
const workshopData = {
  units: {},
  connectedUsers: 0
};

// Socket.IO events
io.on('connection', (socket) => {
  // Update user count
  workshopData.connectedUsers++;
  io.emit('userCount', workshopData.connectedUsers);
  
  // Send initial data
  socket.emit('initialData', { units: workshopData.units });

  // Handle unit movement
  socket.on('moveUnit', (data) => {
    const { unitNumber, newSection, engineer, time } = data;
    
    // Update unit data
    workshopData.units[unitNumber] = { 
      section: newSection, 
      engineer, 
      time 
    };
    
    // Broadcast update
    io.emit('unitMoved', { unitNumber, newSection, engineer, time });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    workshopData.connectedUsers--;
    io.emit('userCount', workshopData.connectedUsers);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
});