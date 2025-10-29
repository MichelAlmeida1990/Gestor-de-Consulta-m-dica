const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'clinica.db');

console.log('🔍 Verificando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    return;
  }
  console.log('✅ Conectado ao banco de dados');
});

// Verificar usuários
db.all('SELECT id, nome, email, tipo FROM usuarios', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro ao buscar usuários:', err.message);
    return;
  }
  
  console.log('👥 Usuários encontrados:', rows.length);
  rows.forEach(row => {
    console.log(`  - ID: ${row.id}, Nome: ${row.nome}, Email: ${row.email}, Tipo: ${row.tipo}`);
  });
  
  db.close();
});

