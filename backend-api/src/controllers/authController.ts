import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db';
import { supabase } from '../config/supabase';

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

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({ error: 'Email, username and password are required.' });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format.' });
    return;
  }

  // Username validation: alphanumeric, between 3 and 32 characters
  const usernameRegex = /^[0-9a-zA-Z]{3,32}$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({ error: 'Username must be alphanumeric and between 3 and 32 characters.' });
    return;
  }

  if (password.length < 3) {
    res.status(400).json({ error: 'Password must be at least 3 characters.' });
    return;
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      res.status(409).json({ error: 'Username is already taken.' });
      return;
    }

    // Register user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      res.status(400).json({ error: authError.message });
      return;
    }

    // Hash MD5: username + 16 null bytes + password
    const nulls = "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0";
    const inputStr = username + nulls + password;
    const md5Hex = crypto.createHash('md5').update(inputStr, 'utf-8').digest('hex');
    const md5Bytes = Buffer.from(md5Hex, 'hex');

    // Master Blowfish key
    const cipherKey = '27501fd04e6b82c831024dac5c6305221974deb9388a21901d576cbbe2f377ef23d75486010f37819afe6c321a0146d21544ec365bf7289a';
    const keyBytes = Buffer.from(cipherKey, 'hex');

    // Blowfish ECB encryption
    const cipher = crypto.createCipheriv('bf-ecb', keyBytes, null);
    cipher.setAutoPadding(false);
    let encrypted = cipher.update(md5Bytes);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const hash = encrypted.toString('hex');

    // Insert user into fiveserver database (users table)
    const serial = 'AAAAAAAAAAAAAAAAAAA';
    const insertQuery = `
      INSERT INTO users (username, serial, hash, reset_nonce, updated_on)
      VALUES ($1, $2, $3, NULL, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const userResult = await pool.query(insertQuery, [username, serial, hash]);
    const newUserId = userResult.rows[0].id;

    // Insert profile into fiveserver database (profiles table)
    const insertProfileQuery = `
      INSERT INTO profiles (user_id, name, updated_on)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;
    await pool.query(insertProfileQuery, [newUserId, username]);

    res.status(201).json({ message: 'User registered successfully!', user: authData.user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

