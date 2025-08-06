const express = require('express');
const path = require('path');
const app = express();

// الحل الجذري للمسارات
const clientPath = path.join(__dirname, '..', 'client');

// Middleware لخدمة الملفات الثابتة
app.use(express.static(clientPath));

// حل نهائي لجميع المسارات
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'), (err) => {
    if (err) {
      console.error('Failed to send file:', err);
      res.status(404).send('File not found');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client path: ${clientPath}`);
  console.log(`Try: http://localhost:${PORT}/index.html`);
});
