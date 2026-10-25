import { Request, Response } from 'express';

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  return res.json({
    success: true,
    data: {
      token: 'sample-jwt-token-mediconnect-' + Date.now(),
      user: {
        id: 'u1',
        name: 'Alex Johnson',
        email,
        role: 'patient',
      },
    },
  });
};

export const register = (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  return res.status(201).json({
    success: true,
    data: {
      token: 'sample-jwt-token-mediconnect-' + Date.now(),
      user: {
        id: `u-${Date.now()}`,
        name,
        email,
        role: 'patient',
      },
    },
  });
};

export const getMe = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      id: 'u1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      role: 'patient',
    },
  });
};
