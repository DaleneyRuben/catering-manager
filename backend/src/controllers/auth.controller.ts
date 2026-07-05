import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth';

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password, req.get('user-agent'));
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
