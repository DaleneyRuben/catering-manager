import { NextFunction, Request, Response } from 'express';
import { login as authenticate, InvalidCredentialsError } from '../domains/auth';

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await authenticate(username, password, req.get('user-agent'));
    res.json(result);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    next(err);
  }
};

export default { login };
