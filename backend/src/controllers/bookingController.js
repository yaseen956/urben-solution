import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Technician from '../models/Technician.js';

export const createBooking = async (req, res) => {
  const { serviceId, scheduledDate, timeSlot, address, paymentMethod } = req.body;
  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ message: 'Service not found' });

  const technician = await Technician.findOne({
    isApproved: true,
    isOnline: true,
    skills: { $in: [service.category, ...service.tags] }
  }).sort({ rating: -1, createdAt: 1 });

  const booking = await Booking.create({
    user: req.user._id,
    technician: technician?._id,
    service: service._id,
    scheduledDate,
    timeSlot,
    address,
    paymentMethod,
    price: service.price,
    status: technician ? 'Pending' : 'Requested'
  });

  const populated = await booking.populate(['service', 'technician', 'user']);
  const io = req.app.get('io');
  if (technician) io.to(`technician:${technician._id}`).emit('new-booking', populated);

  res.status(201).json({ booking: populated });
};

export const getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('service')
    .populate('technician', 'name phone rating')
    .sort({ createdAt: -1 });
  res.json({ bookings });
};

export const getTechnicianBookings = async (req, res) => {
  const bookings = await Booking.find({ technician: req.technician._id })
    .populate('service')
    .populate('user', 'name phone email')
    .sort({ scheduledDate: 1 });
  res.json({ bookings });
};

export const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status !== 'Completed') return res.status(400).json({ message: 'Only completed bookings can be reviewed' });

  booking.review = { rating, comment };
  await booking.save();
  res.json({ booking });
};
