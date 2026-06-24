import { StatusCodes } from 'http-status-codes';
import cloudinary from 'cloudinary';
import { formatImage } from '../middleware/multerMiddleware.js';
import { query, execute } from '../db.js';

export const getCurrentUser = async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.userId]);
  if (!user) throw new Error('User not found');
  delete user.password;
  res.status(StatusCodes.OK).json({ user });
};
export const getApplicationStats = async (req, res) => {
  const usersResult = await query('SELECT COUNT(*) AS users FROM users');
  const jobsResult = await query('SELECT COUNT(*) AS jobs FROM jobs');
  res
    .status(StatusCodes.OK)
    .json({ users: usersResult[0].users, jobs: jobsResult[0].jobs });
};
export const updateUser = async (req, res) => {
  const newUser = { ...req.body };
  delete newUser.password;
  delete newUser.role;

  if (req.file) {
    const file = formatImage(req.file);
    const response = await cloudinary.v2.uploader.upload(file);
    newUser.avatar = response.secure_url;
    newUser.avatarPublicId = response.public_id;
  }

  const fields = [];
  const params = [];
  Object.entries(newUser).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  params.push(req.user.userId);

  const [existingUser] = await query('SELECT * FROM users WHERE id = ?', [req.user.userId]);

  await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

  if (req.file && existingUser?.avatarPublicId) {
    await cloudinary.v2.uploader.destroy(existingUser.avatarPublicId);
  }

  res.status(StatusCodes.OK).json({ msg: 'update user' });
};
