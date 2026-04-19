import Technician from '../models/Technician.js';
import Booking from '../models/Booking.js';
import SupportTicket from '../models/SupportTicket.js';
import { signToken } from '../utils/token.js';

const technicianPayload = (technician) => ({
  id: technician._id,
  name: technician.name,
  email: technician.email,
  phone: technician.phone,
  skills: technician.skills,
  experience: technician.experience,
  address: technician.address,
  location: technician.location,
  profilePhoto: technician.profilePhoto,
  idProof: technician.idProof,
  documents: technician.documents,
  vehicleInfo: technician.vehicleInfo,
  bankDetails: technician.bankDetails,
  isApproved: technician.isApproved,
  isOnline: technician.isOnline,
  isAvailable: technician.isAvailable,
  lastActiveAt: technician.lastActiveAt,
  earnings: technician.earnings,
  rating: technician.rating
});

export const registerTechnician = async (req, res) => {
  const { name, email, phone, password, skills, experience, address, location, lat, lng } = req.body;
  const exists = await Technician.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const files = req.files || {};
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const normalizedAddress = typeof address === 'string' ? address.trim() : typeof location === 'string' ? location.trim() : '';
  if (!normalizedAddress) return res.status(400).json({ message: 'Invalid address' });
  if (!hasCoordinates) return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  const normalizedSkills = typeof skills === 'string' ? skills.split(',').map((skill) => skill.trim()).filter(Boolean) : skills;
  if (!Array.isArray(normalizedSkills) || normalizedSkills.length === 0) {
    return res.status(400).json({ message: 'Select at least one skill' });
  }

  const technician = await Technician.create({
    name,
    email,
    phone,
    password,
    skills: normalizedSkills,
    experience,
    address: normalizedAddress,
    location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
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
  const nextAvailable = req.body.isAvailable ?? req.body.isOnline;
  const technician = await Technician.findByIdAndUpdate(
    req.technician._id,
    {
      isOnline: Boolean(nextAvailable),
      isAvailable: Boolean(nextAvailable),
      lastActiveAt: new Date()
    },
    { new: true }
  ).select('-password');
  res.json({ technician: technicianPayload(technician) });
};

export const updateJobStatus = async (req, res) => {
  const { bookingId, status } = req.body;
  const normalized = {
    Accepted: 'accepted',
    accepted: 'accepted',
    assigned: 'assigned',
    Rejected: 'cancelled',
    Pending: 'pending',
    'In Progress': 'in_progress',
    in_progress: 'in_progress',
    Completed: 'completed',
    completed: 'completed',
    cancelled: 'cancelled'
  }[status];
  const allowed = ['accepted', 'assigned', 'cancelled', 'pending', 'in_progress', 'completed'];
  if (!allowed.includes(normalized)) return res.status(400).json({ message: 'Invalid status' });

  const booking = await Booking.findOne({
    _id: bookingId,
    $or: [{ technician: req.technician._id }, { technicianId: req.technician._id }]
  }).populate('service user');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.status = normalized;
  booking.technicianId = req.technician._id;
  if (normalized === 'accepted' && !booking.acceptedAt) booking.acceptedAt = new Date();
  if (normalized === 'assigned' && !booking.assignedAt) booking.assignedAt = new Date();
  if (normalized === 'in_progress' && !booking.startedAt) booking.startedAt = new Date();
  if (normalized === 'completed' && !booking.completedAt) booking.completedAt = new Date();
  if (normalized === 'completed' && booking.paymentStatus !== 'paid') {
    booking.paymentStatus = 'paid';
    await Technician.findByIdAndUpdate(req.technician._id, { $inc: { earnings: booking.price } });
  }
  await booking.save();

  const io = req.app.get('io');
  io.to(`user:${booking.user._id}`).emit('status-update', booking);
  io.to(`booking:${booking._id}`).emit('status-update', booking);
  io.to(`user:${booking.user._id}`).emit('booking-updated', booking);
  res.json({ booking });
};

export const earnings = async (req, res) => {
  const { range = 'monthly' } = req.query;
  const start = new Date();
  if (range === 'daily') start.setHours(0, 0, 0, 0);
  else if (range === 'weekly') start.setDate(start.getDate() - 7);
  else start.setMonth(start.getMonth() - 1);

  const completed = await Booking.find({
    technician: req.technician._id,
    status: { $in: ['Completed', 'completed'] },
    completedAt: { $gte: start }
  }).populate('service');
  const total = completed.reduce((sum, booking) => sum + booking.price, 0);
  const incentive = Math.round(total * 0.08);
  res.json({
    total,
    incentive,
    averagePerOrder: completed.length ? Math.round(total / completed.length) : 0,
    completedJobs: completed.length,
    jobs: completed
  });
};

export const profile = async (req, res) => {
  res.json({ technician: technicianPayload(req.technician) });
};

export const updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'skills', 'experience', 'address', 'vehicleInfo', 'bankDetails'];
  allowed.forEach((field) => {
    if (req.body[field] === undefined) return;
    if (field === 'skills' && typeof req.body.skills === 'string') {
      req.technician.skills = req.body.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    } else if (field === 'address') {
      const normalizedAddress = typeof req.body.address === 'string' ? req.body.address.trim() : '';
      if (normalizedAddress) req.technician.address = normalizedAddress;
    } else if (['vehicleInfo', 'bankDetails'].includes(field) && typeof req.body[field] === 'string') {
      req.technician[field] = JSON.parse(req.body[field]);
    } else {
      req.technician[field] = req.body[field];
    }
  });

  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    req.technician.location = { type: 'Point', coordinates: [lng, lat] };
  }
  if (!req.technician.address || typeof req.technician.address !== 'string') {
    return res.status(400).json({ message: 'Invalid address' });
  }
  if (!req.technician.skills?.length) {
    return res.status(400).json({ message: 'Select at least one skill' });
  }
  if (!req.technician.location?.coordinates?.every(Number.isFinite)) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  }

  const files = req.files || {};
  req.technician.documents = req.technician.documents || { others: [] };
  if (files.dl?.[0]) req.technician.documents.dl = `/uploads/${files.dl[0].filename}`;
  if (files.idProof?.[0]) req.technician.documents.idProof = `/uploads/${files.idProof[0].filename}`;
  if (files.others?.length) req.technician.documents.others = files.others.map((file) => `/uploads/${file.filename}`);

  await req.technician.save();
  res.json({ technician: technicianPayload(req.technician) });
};

export const performance = async (req, res) => {
  const received = await Booking.countDocuments({ broadcastedTo: req.technician._id });
  const accepted = await Booking.find({
    $or: [{ technician: req.technician._id }, { technicianId: req.technician._id }]
  });
  const cancelled = accepted.filter((booking) => booking.status === 'cancelled').length;
  const reviewed = accepted.filter((booking) => booking.review?.rating);
  const completed = accepted.filter((booking) => booking.status === 'completed' && booking.startedAt && booking.completedAt);
  const totalCompletionMs = completed.reduce((sum, booking) => sum + (booking.completedAt - booking.startedAt), 0);

  res.json({
    avgRating: reviewed.length ? Number((reviewed.reduce((sum, booking) => sum + booking.review.rating, 0) / reviewed.length).toFixed(1)) : 0,
    acceptanceRate: received ? Math.round((accepted.length / received) * 100) : 0,
    cancellationRate: accepted.length ? Math.round((cancelled / accepted.length) * 100) : 0,
    avgCompletionTime: completed.length ? Math.round(totalCompletionMs / completed.length / 60000) : 0,
    receivedJobs: received,
    acceptedJobs: accepted.length
  });
};

export const createSupportTicket = async (req, res) => {
  const { bookingId, message, type = 'support' } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

  const ticket = await SupportTicket.create({
    booking: bookingId || undefined,
    technician: req.technician._id,
    message,
    type
  });

  req.app.get('io').emit('system-alert', {
    type: 'support-ticket',
    ticketId: ticket._id,
    technicianId: req.technician._id
  });
  res.status(201).json({ ticket });
};
