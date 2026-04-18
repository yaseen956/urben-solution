import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role
});

export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, phone, password });
  res.status(201).json({
    user: userPayload(user),
    token: signToken({ id: user._id, type: 'user', role: user.role })
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({
    user: userPayload(user),
    token: signToken({ id: user._id, type: 'user', role: user.role })
  });
};

export const me = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};
