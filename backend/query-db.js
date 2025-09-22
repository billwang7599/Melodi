const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== USERS TABLE ===');
db.all('SELECT * FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Total users:', rows.length);
    rows.forEach((row) => {
      console.log(`ID: ${row.id}, Email: ${row.email}, Username: ${row.username}, Created: ${row.created_at}`);
    });
  }
  db.close();
});
