import { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service';

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    next(err);
  }
};

export default { login };
