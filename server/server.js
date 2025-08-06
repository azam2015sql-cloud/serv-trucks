const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// مسار الملفات الثابتة
const clientPath = path.join(__dirname, '../client');

// Middleware لخدمة الملفات الثابتة
app.use(express.static(clientPath));

// جميع الطلبات ترجع index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// أحداث Socket.io
io.on('connection', (socket) => {
  console.log('مستخدم جديد متصل');
  
  socket.on('disconnect', () => {
    console.log('مستخدم قطع الاتصال');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
