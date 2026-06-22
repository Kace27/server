import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const expectedUser = process.env.ADMIN_DEFAULT_USER || 'admin';
  const expectedPass = process.env.ADMIN_DEFAULT_PASS || 'admin12345';

  if (username === expectedUser && password === expectedPass) {
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'super_secret_pes6_jwt_key_2026',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    res.json({ token, username });
    return;
  }

  res.status(401).json({ error: 'Invalid credentials.' });
};
