import database from './src/database/index.js';

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com banco...');
    
    await database.connect();
    await database.initialize();
    
    console.log('✅ Banco conectado e inicializado');
    
    // Testar query
    const usuarios = await database.all('SELECT * FROM usuarios');
    console.log('👥 Usuários encontrados:', usuarios.length);
    
    if (usuarios.length > 0) {
      console.log('📋 Primeiro usuário:', usuarios[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testDatabase();

