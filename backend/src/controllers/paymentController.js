import crypto from 'crypto';
import Razorpay from 'razorpay';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { dispatchBooking } from '../services/dispatchService.js';

let razorpayClient;

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured');
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayClient;
};

const validateBookingPayload = ({ serviceId, scheduledDate, timeSlot, address }) => {
  if (!serviceId || !scheduledDate || !timeSlot || typeof address !== 'string' || !address.trim()) {
    return 'Service, date, time slot and address are required';
  }
  return null;
};

export const createOrder = async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  const order = await getRazorpay().orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `urben_${Date.now()}`
  });

  res.status(201).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID
  });
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    booking: bookingPayload = {}
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification fields are required' });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: 'Razorpay secret is not configured' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const existing = await Booking.findOne({ orderId: razorpay_order_id });
  if (existing) {
    return res.status(409).json({ message: 'Booking already created for this order', booking: existing });
  }

  const validationError = validateBookingPayload(bookingPayload);
  if (validationError) return res.status(400).json({ message: validationError });

  const service = await Service.findById(bookingPayload.serviceId);
  if (!service) return res.status(404).json({ message: 'Service not found' });

  const lat = Number(bookingPayload.lat);
  const lng = Number(bookingPayload.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasCoordinates) return res.status(400).json({ message: 'Valid latitude and longitude are required for dispatch' });
  const normalizedAddress = bookingPayload.address.trim();

  const booking = await Booking.create({
    user: req.user._id,
    userId: req.user._id,
    service: service._id,
    serviceName: service.title,
    scheduledDate: bookingPayload.scheduledDate,
    timeSlot: bookingPayload.timeSlot,
    address: normalizedAddress,
    location: { type: 'Point', coordinates: [lng, lat] },
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    price: service.price,
    status: 'paid'
  });

  const io = req.app.get('io');
  const { technicians } = await dispatchBooking({ booking, service, io });
  const populated = await booking.populate(['service', 'technician', 'technicianId', 'user', 'broadcastedTo']);

  res.status(201).json({ booking: populated, notifiedTechnicians: technicians.length });
};
