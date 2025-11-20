// Declarações de tipos para módulos sem tipos
declare module 'express';
declare module 'cors';
declare module 'bcryptjs';
declare module 'jsonwebtoken';

// Estender tipos do Express
import { Usuario } from './services/AuthService';

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

