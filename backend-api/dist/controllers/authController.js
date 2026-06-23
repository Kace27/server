"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
    }
    const expectedUser = process.env.ADMIN_DEFAULT_USER || 'admin';
    const expectedPass = process.env.ADMIN_DEFAULT_PASS || 'admin12345';
    if (username === expectedUser && password === expectedPass) {
        const token = jsonwebtoken_1.default.sign({ username, role: 'admin' }, process.env.JWT_SECRET || 'super_secret_pes6_jwt_key_2026', { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') });
        res.json({ token, username });
        return;
    }
    res.status(401).json({ error: 'Invalid credentials.' });
};
exports.login = login;
const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
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
        const userCheck = await db_1.default.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            res.status(409).json({ error: 'Username is already taken.' });
            return;
        }
        // Hash MD5: username + 16 null bytes + password
        const nulls = "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0";
        const inputStr = username + nulls + password;
        const md5Hex = crypto_1.default.createHash('md5').update(inputStr, 'utf-8').digest('hex');
        const md5Bytes = Buffer.from(md5Hex, 'hex');
        // Master Blowfish key
        const cipherKey = '27501fd04e6b82c831024dac5c6305221974deb9388a21901d576cbbe2f377ef23d75486010f37819afe6c321a0146d21544ec365bf7289a';
        const keyBytes = Buffer.from(cipherKey, 'hex');
        // Blowfish ECB encryption
        const cipher = crypto_1.default.createCipheriv('bf-ecb', keyBytes, null);
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
        await db_1.default.query(insertQuery, [username, serial, hash]);
        res.status(201).json({ message: 'User registered successfully!' });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.register = register;
