import { NextFunction, Request, Response } from 'express';
import { login as authLogin } from '../services/auth';

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      return;
    }

    const result = await authLogin(username, password);
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
