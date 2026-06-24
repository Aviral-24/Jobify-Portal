import { StatusCodes } from 'http-status-codes';
import { comparePassword, hashPassword } from '../utils/passwordUtils.js';
import { UnauthenticatedError } from '../errors/customErrors.js';
import { createJWT } from '../utils/tokenUtils.js';
import { query, execute } from '../db.js';

export const register = async (req, res) => {
  const [{ count }] = await query('SELECT COUNT(*) AS count FROM users');
  const role = count === 0 ? 'admin' : 'user';
  const hashedPassword = await hashPassword(req.body.password);
  await execute(
    'INSERT INTO users (name, email, password, location, lastName, role) VALUES (?, ?, ?, ?, ?, ?)',
    [
      req.body.name,
      req.body.email,
      hashedPassword,
      req.body.location,
      req.body.lastName,
      role,
    ]
  );
  res.status(StatusCodes.CREATED).json({ msg: 'user created' });
};
export const login = async (req, res) => {
  const users = await query('SELECT * FROM users WHERE email = ?', [req.body.email]);
  const user = users[0];

  const isValidUser =
    user && (await comparePassword(req.body.password, user.password));

  if (!isValidUser) throw new UnauthenticatedError('invalid credentials');

  const token = createJWT({ userId: user.id, role: user.role });

  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged in' });
};

export const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};
