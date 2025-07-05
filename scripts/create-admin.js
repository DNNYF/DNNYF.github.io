// Jalankan di Node.js REPL atau file js
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10, (err, hash) => { console.log(hash); });