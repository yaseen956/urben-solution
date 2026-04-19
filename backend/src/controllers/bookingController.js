import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { dispatchBooking } from '../services/dispatchService.js';

export const createBooking = async (req, res) => {
  const { serviceId, scheduledDate, timeSlot, address, paymentMethod, lat, lng } = req.body;
  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ message: 'Service not found' });

  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const normalizedAddress = typeof address === 'string' ? address.trim() : '';
  if (!normalizedAddress) return res.status(400).json({ message: 'Valid address is required' });
  if (!hasCoordinates) return res.status(400).json({ message: 'Valid latitude and longitude are required' });

  const booking = await Booking.create({
    user: req.user._id,
    userId: req.user._id,
    service: service._id,
    serviceName: service.title,
    scheduledDate,
    timeSlot,
    address: normalizedAddress,
    location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
    paymentMethod,
    price: service.price,
    status: 'pending'
  });

  const io = req.app.get('io');
  let notifiedTechnicians = 0;
  if (hasCoordinates) {
    const dispatch = await dispatchBooking({ booking, service, io });
    notifiedTechnicians = dispatch.technicians.length;
  }
  const populated = await booking.populate(['service', 'technician', 'user', 'broadcastedTo']);

  res.status(201).json({ booking: populated, notifiedTechnicians });
};

export const getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('service')
    .populate('technician', 'name phone rating skills location address')
    .sort({ createdAt: -1 });
  res.json({ bookings });
};

export const getUserBookingById = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
    .populate('service')
    .populate('technician', 'name phone rating skills location address');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json({ booking });
};

export const getTechnicianBookings = async (req, res) => {
  const bookings = await Booking.find({
    $or: [
      { technician: req.technician._id },
      { technicianId: req.technician._id },
      { broadcastedTo: req.technician._id, status: 'broadcasted' }
    ]
  })
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

export const updateBookingStatus = async (req, res) => {
  const allowed = ['accepted', 'assigned', 'in_progress', 'completed', 'cancelled'];
  const { status } = req.body;
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const booking = await Booking.findOne({
    _id: req.params.id,
    $or: [{ technician: req.technician._id }, { technicianId: req.technician._id }]
  }).populate('service user technician');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.status = status;
  if (status === 'assigned' && !booking.assignedAt) booking.assignedAt = new Date();
  if (status === 'in_progress' && !booking.startedAt) booking.startedAt = new Date();
  if (status === 'completed' && !booking.completedAt) booking.completedAt = new Date();
  await booking.save();

  const io = req.app.get('io');
  io.to(`user:${booking.user._id}`).emit('status-update', booking);
  io.to(`booking:${booking._id}`).emit('status-update', booking);
  res.json({ booking });
};
