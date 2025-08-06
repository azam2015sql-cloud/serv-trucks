const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');

// تهيئة التطبيق
const app = express();
const server = http.createServer(app);

// تحسينات Socket.IO
const io = socketIo(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cors: {
    origin: process.env.PUBLIC_URL || "*",
    methods: ["GET", "POST"]
  }
});

// تحديد المسار المطلق للملفات الثابتة
const clientPath = path.resolve(__dirname, '../client');

// Middlewares
app.use(compression());
app.use(express.static(clientPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// حل مشكلة Cannot GET /
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// تخزين البيانات (لإدارة الوحدات)
const workshopData = {
  units: {},
  connectedUsers: 0
};

// أحداث Socket.IO
io.on('connection', (socket) => {
  // تحديث عدد المستخدمين
  workshopData.connectedUsers++;
  io.emit('userCount', workshopData.connectedUsers);

  // إرسال البيانات الأولية
  socket.emit('initialData', workshopData.units);

  // معالجة نقل الوحدة
  socket.on('moveUnit', (data) => {
    const { unitNumber, newSection, engineer, time } = data;
    
    workshopData.units[unitNumber] = { 
      section: newSection, 
      engineer, 
      time 
    };
    
    io.emit('unitMoved', data);
  });

  // معالجة قطع الاتصال
  socket.on('disconnect', () => {
    workshopData.connectedUsers--;
    io.emit('userCount', workshopData.connectedUsers);
  });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).send('حدث خطأ في الخادم');
});

// بدء التشغيل
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  🚀 Server running on: http://localhost:${PORT}
  📂 Serving files from: ${clientPath}
  🌍 Public URL: ${process.env.PUBLIC_URL || 'Not configured'}
  `);
});
