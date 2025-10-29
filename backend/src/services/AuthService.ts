import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import database from '../database/index';

const JWT_SECRET = process.env.JWT_SECRET || 'clinica_med_secret_key_2025';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'medico' | 'paciente';
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    usuario: Usuario;
    expiresIn: string;
  };
  error?: {
    message: string;
    statusCode: number;
  };
  message?: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: 'admin' | 'medico' | 'paciente';
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: string;
}

export class AuthService {
  // Hash da senha
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Verificar senha
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Gerar token JWT
  static generateToken(usuario: Usuario): string {
    const payload = { 
      id: usuario.id, 
      email: usuario.email, 
      tipo: usuario.tipo 
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  // Verificar token JWT
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Login
  static async login(email: string, senha: string): Promise<LoginResponse> {
    try {
      console.log('🔐 AuthService.login chamado com:', { email, senha: '***' });
      
      // Buscar usuário por email
      const usuario = await database.get(
        'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
        [email]
      );

      if (!usuario) {
        return {
          success: false,
          error: {
            message: 'Email ou senha incorretos',
            statusCode: 401
          }
        };
      }

      // Verificar senha
      const senhaValida = await this.verifyPassword(senha, usuario.senha);
      
      if (!senhaValida) {
        return {
          success: false,
          error: {
            message: 'Email ou senha incorretos',
            statusCode: 401
          }
        };
      }

      // Gerar token
      const token = this.generateToken(usuario);

      // Remover senha do objeto de retorno
      const { senha: _, ...usuarioSemSenha } = usuario;

      return {
        success: true,
        data: {
          token,
          usuario: usuarioSemSenha,
          expiresIn: '24h'
        },
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
    }
  }

  // Registro
  static async register(dados: RegisterRequest): Promise<LoginResponse> {
    try {
      // BLOQUEAR registro de médicos através do registro público
      // Médicos só podem ser cadastrados por administradores
      if (dados.tipo === 'medico') {
        return {
          success: false,
          error: {
            message: 'Cadastro de médicos não é permitido através do registro público. Entre em contato com o administrador do sistema.',
            statusCode: 403
          }
        };
      }

      // Verificar se email já existe
      const usuarioExistente = await database.get(
        'SELECT id FROM usuarios WHERE email = ?',
        [dados.email]
      );

      if (usuarioExistente) {
        return {
          success: false,
          error: {
            message: 'Email já cadastrado',
            statusCode: 400
          }
        };
      }

      // Forçar tipo como paciente para segurança extra
      if (dados.tipo !== 'paciente') {
        dados.tipo = 'paciente';
      }

      // Hash da senha
      const senhaHash = await this.hashPassword(dados.senha);

      // Inserir usuário
      const result = await database.run(
        `INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf, data_nascimento, endereco) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.nome,
          dados.email,
          senhaHash,
          dados.tipo,
          dados.telefone || null,
          dados.cpf || null,
          dados.data_nascimento || null,
          dados.endereco || null
        ]
      );

      const usuarioId = result.lastID;

      // Buscar usuário criado
      const novoUsuario = await database.get(
        'SELECT * FROM usuarios WHERE id = ?',
        [usuarioId]
      );

      // Criar registro na tabela pacientes (sempre paciente no registro público)
      await database.run(
        'INSERT INTO pacientes (usuario_id) VALUES (?)',
        [usuarioId]
      );

      // Gerar token
      const token = this.generateToken(novoUsuario);

      // Remover senha do objeto de retorno
      const { senha: _, ...usuarioSemSenha } = novoUsuario;

      return {
        success: true,
        data: {
          token,
          usuario: usuarioSemSenha,
          expiresIn: '24h'
        },
        message: 'Usuário cadastrado com sucesso'
      };

    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
    }
  }

  // Buscar usuário por ID
  static async getUserById(id: number): Promise<Usuario | null> {
    try {
      console.log('🔍 getUserById - Buscando usuário com ID:', id, 'tipo:', typeof id);
      
      // Garantir que id é um número
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (isNaN(userId) || userId <= 0) {
        console.log('❌ getUserById - ID inválido:', id);
        return null;
      }

      const usuario = await database.get(
        'SELECT * FROM usuarios WHERE id = ?',
        [userId]
      );
      
      console.log('🔍 getUserById - Resultado da query:', usuario ? 'Usuário encontrado' : 'Nenhum usuário encontrado');
      
      if (usuario) {
        console.log('🔍 getUserById - Dados do usuário:', {
          id: usuario.id,
          email: usuario.email,
          ativo: usuario.ativo,
          tipo: usuario.tipo,
          ativoType: typeof usuario.ativo
        });
        
        // Verificar se está ativo (pode ser 1, true, ou qualquer valor truthy)
        if (usuario.ativo !== 1 && usuario.ativo !== true && usuario.ativo !== '1') {
          console.log('⚠️ Usuário encontrado mas está inativo (ativo =', usuario.ativo, ')');
          // Mas ainda assim retornar o usuário - deixar a validação de ativo para outros lugares
        }
      } else {
        console.log('❌ getUserById - Nenhum usuário encontrado com ID:', userId);
        // Tentar buscar todos os usuários para debug
        const allUsers = await database.all('SELECT id, email FROM usuarios LIMIT 5');
        console.log('🔍 Usuários disponíveis no banco:', allUsers);
      }

      if (!usuario) {
        return null;
      }

      // Remover senha do objeto de retorno
      const { senha: _, ...usuarioSemSenha } = usuario;
      console.log('✅ getUserById - Retornando usuário sem senha');
      return usuarioSemSenha;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      if (error instanceof Error) {
        console.error('❌ Mensagem de erro:', error.message);
        console.error('❌ Stack trace:', error.stack);
      }
      return null;
    }
  }

  // Middleware de autenticação
  static async authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      console.log('🔐 Auth Header recebido:', authHeader ? 'Bearer ***' : 'Nenhum header');
      
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        console.log('❌ Token não encontrado no header');
        res.status(401).json({
          success: false,
          error: {
            message: 'Token de acesso necessário',
            statusCode: 401
          }
        });
        return;
      }

      console.log('🔑 Token encontrado, validando...');
      console.log('🔑 Token completo (primeiros 50 chars):', token.substring(0, 50) + '...');
      
      let decoded;
      try {
        decoded = this.verifyToken(token);
        console.log('✅ Token válido, decodificado:', { 
          id: decoded.id, 
          email: decoded.email,
          tipo: decoded.tipo,
          idType: typeof decoded.id
        });
      } catch (tokenError) {
        console.error('❌ Erro ao verificar token:', tokenError);
        res.status(401).json({
          success: false,
          error: {
            message: 'Token inválido ou expirado',
            statusCode: 401
          }
        });
        return;
      }
      
      console.log('🔍 Buscando usuário com ID:', decoded.id, 'tipo:', typeof decoded.id);
      
      // Buscar usuário diretamente aqui para garantir que está funcionando
      let usuario;
      try {
        console.log('🔍 Tentando buscar usuário diretamente no database...');
        const usuarioRaw = await database.get(
          'SELECT * FROM usuarios WHERE id = ?',
          [decoded.id]
        );
        
        console.log('🔍 Resultado direto do database:', usuarioRaw ? 'Encontrado' : 'Não encontrado');
        
        if (usuarioRaw) {
          console.log('🔍 Dados do usuário:', {
            id: usuarioRaw.id,
            email: usuarioRaw.email,
            tipo: usuarioRaw.tipo,
            ativo: usuarioRaw.ativo
          });
          
          // Remover senha
          const { senha: _, ...usuarioSemSenha } = usuarioRaw;
          usuario = usuarioSemSenha;
        } else {
          // Se não encontrou, tentar getUserById também
          console.log('⚠️ Não encontrado diretamente, tentando getUserById...');
          usuario = await this.getUserById(decoded.id);
        }
      } catch (dbError) {
        console.error('❌ Erro ao buscar usuário no database:', dbError);
        if (dbError instanceof Error) {
          console.error('❌ Mensagem:', dbError.message);
          console.error('❌ Stack:', dbError.stack);
        }
        usuario = null;
      }
      
      console.log('🔍 Usuário encontrado:', usuario ? 'Sim' : 'Não');

      if (!usuario) {
        console.log('❌ Usuário não encontrado para o token - ID:', decoded.id);
        
        // Debug: listar todos os usuários
        try {
          const allUsers = await database.all('SELECT id, email FROM usuarios LIMIT 10');
          console.log('🔍 Todos os usuários no banco:', allUsers);
        } catch (err) {
          console.error('❌ Erro ao listar usuários:', err);
        }
        
        res.status(401).json({
          success: false,
          error: {
            message: 'Token inválido - usuário não encontrado',
            statusCode: 401
          }
        });
        return;
      }

      console.log('✅ Usuário autenticado:', { id: usuario.id, email: usuario.email, tipo: usuario.tipo });
      req.usuario = usuario;
      next();
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(401).json({
        success: false,
        error: {
          message: 'Token inválido',
          statusCode: 401
        }
      });
    }
  }
}
