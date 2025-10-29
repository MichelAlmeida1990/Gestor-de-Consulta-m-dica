import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '../../database/clinica.db');

class Database {
  private db: sqlite3.Database | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar com o banco de dados:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado ao banco de dados SQLite');
          resolve();
        }
      });
    });
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }

    try {
      // Ler e executar schema
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await this.exec(schema);
      console.log('✅ Schema do banco de dados criado');

      // Verificar se já existem dados
      const userCount = await this.get('SELECT COUNT(*) as count FROM usuarios');
      
      if (userCount.count === 0) {
        // Ler e executar seed
        const seedPath = path.join(__dirname, '../../database/seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        
        await this.exec(seed);
        console.log('✅ Dados iniciais inseridos');
      } else {
        console.log('ℹ️ Dados já existem no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }

    return new Promise((resolve, reject) => {
      this.db!.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Conexão com banco de dados fechada');
          resolve();
        }
      });
    });
  }
}

// Instância singleton
const database = new Database();

export default database;
