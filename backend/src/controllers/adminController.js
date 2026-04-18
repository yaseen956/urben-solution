import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Technician from '../models/Technician.js';
import User from '../models/User.js';

export const stats = async (_req, res) => {
  const [users, technicians, services, bookings, pendingTechnicians, completedBookings] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Technician.countDocuments(),
    Service.countDocuments(),
    Booking.countDocuments(),
    Technician.countDocuments({ isApproved: false }),
    Booking.find({ status: 'Completed' })
  ]);

  res.json({
    users,
    technicians,
    services,
    bookings,
    pendingTechnicians,
    revenue: completedBookings.reduce((sum, booking) => sum + booking.price, 0)
  });
};

export const listUsers = async (_req, res) => {
  res.json({ users: await User.find().select('-password').sort({ createdAt: -1 }) });
};

export const listTechnicians = async (_req, res) => {
  res.json({ technicians: await Technician.find().select('-password').sort({ createdAt: -1 }) });
};

export const approveTechnician = async (req, res) => {
  const technician = await Technician.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).select('-password');
  if (!technician) return res.status(404).json({ message: 'Technician not found' });
  res.json({ technician });
};

export const listBookings = async (_req, res) => {
  const bookings = await Booking.find()
    .populate('service')
    .populate('user', 'name phone email')
    .populate('technician', 'name phone email')
    .sort({ createdAt: -1 });
  res.json({ bookings });
};
