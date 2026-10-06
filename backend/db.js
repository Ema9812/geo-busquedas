const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const dbFile = path.join(__dirname, 'comercios.json');

let db;

async function initDB() {
  db = await JSONFilePreset(dbFile, { comercios: [], lastId: 0 });
  console.log('✅ Base de datos lista');
  return db;
}

function getDB() {
  if (!db) throw new Error('DB no inicializada');
  return db.data;
}

function saveDB() {
  return db.write();
}

module.exports = { initDB, getDB, saveDB };