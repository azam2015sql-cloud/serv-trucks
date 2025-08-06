const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware لخدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// جميع الطلبات ترجع index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// تخزين حالة الوحدات على السيرفر
let workshopUnits = {};

// أحداث Socket.io
io.on('connection', (socket) => {
  console.log('مستخدم جديد متصل');
  
  // إرسال البيانات الأولية عند الاتصال
  socket.emit('initialData', workshopUnits);
  
  // استقبال تحديثات الوحدات
  socket.on('updateUnit', (unitData) => {
    workshopUnits[unitData.unitNumber] = {
      section: unitData.section,
      lastMoveTime: unitData.lastMoveTime,
      engineer: unitData.engineer
    };
    io.emit('unitUpdated', unitData);
  });
  
  // طلب البيانات الحالية
  socket.on('requestData', () => {
    socket.emit('initialData', workshopUnits);
  });
  
  socket.on('disconnect', () => {
    console.log('مستخدم قطع الاتصال');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
