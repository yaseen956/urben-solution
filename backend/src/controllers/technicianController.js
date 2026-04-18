import Technician from '../models/Technician.js';
import Booking from '../models/Booking.js';
import { signToken } from '../utils/token.js';

const technicianPayload = (technician) => ({
  id: technician._id,
  name: technician.name,
  email: technician.email,
  phone: technician.phone,
  skills: technician.skills,
  experience: technician.experience,
  location: technician.location,
  profilePhoto: technician.profilePhoto,
  idProof: technician.idProof,
  isApproved: technician.isApproved,
  isOnline: technician.isOnline,
  earnings: technician.earnings,
  rating: technician.rating
});

export const registerTechnician = async (req, res) => {
  const { name, email, phone, password, skills, experience, location } = req.body;
  const exists = await Technician.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const files = req.files || {};
  const technician = await Technician.create({
    name,
    email,
    phone,
    password,
    skills: typeof skills === 'string' ? skills.split(',').map((skill) => skill.trim()) : skills,
    experience,
    location,
    profilePhoto: files.profilePhoto?.[0] ? `/uploads/${files.profilePhoto[0].filename}` : undefined,
    idProof: files.idProof?.[0] ? `/uploads/${files.idProof[0].filename}` : undefined
  });

  res.status(201).json({
    technician: technicianPayload(technician),
    token: signToken({ id: technician._id, type: 'technician' })
  });
};

export const loginTechnician = async (req, res) => {
  const { email, password } = req.body;
  const technician = await Technician.findOne({ email });
  if (!technician || !(await technician.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({
    technician: technicianPayload(technician),
    token: signToken({ id: technician._id, type: 'technician' })
  });
};

export const me = async (req, res) => {
  res.json({ technician: technicianPayload(req.technician) });
};

export const updateAvailability = async (req, res) => {
  req.technician.isOnline = Boolean(req.body.isOnline);
  await req.technician.save();
  res.json({ technician: technicianPayload(req.technician) });
};

export const updateJobStatus = async (req, res) => {
  const { bookingId, status } = req.body;
  const allowed = ['Accepted', 'Rejected', 'Pending', 'In Progress', 'Completed'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const booking = await Booking.findOne({ _id: bookingId, technician: req.technician._id }).populate('service user');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.status = status;
  if (status === 'Completed' && booking.paymentStatus !== 'paid') {
    booking.paymentStatus = 'paid';
    req.technician.earnings += booking.price;
    await req.technician.save();
  }
  await booking.save();

  req.app.get('io').to(`user:${booking.user._id}`).emit('booking-updated', booking);
  res.json({ booking });
};

export const earnings = async (req, res) => {
  const completed = await Booking.find({ technician: req.technician._id, status: 'Completed' }).populate('service');
  res.json({
    total: completed.reduce((sum, booking) => sum + booking.price, 0),
    completedJobs: completed.length,
    jobs: completed
  });
};
