import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import serviceRoutes from './src/routes/serviceRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import technicianRoutes from './src/routes/technicianRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import supportRoutes from './src/routes/supportRoutes.js';
import Booking from './src/models/Booking.js';
import Technician from './src/models/Technician.js';
import { buildCustomerJobPayload } from './src/services/dispatchService.js';
import { calculateEtaMinutes } from './src/services/etaService.js';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const server = createServer(app);
const technicianSockets = new Map();
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

connectDB();

app.set('io', io);
app.set('technicianSockets', technicianSockets);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250 }));

io.on('connection', (socket) => {
  socket.on('join-user', (userId) => socket.join(`user:${userId}`));
  socket.on('join-booking', (bookingId) => socket.join(`booking:${bookingId}`));
  socket.on('join-technician', (technicianId) => {
    technicianSockets.set(String(technicianId), socket.id);
    socket.join(`technician:${technicianId}`);
  });

  socket.on('accept-job', async ({ bookingId, technicianId }) => {
    if (!bookingId || !technicianId) return;
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'broadcasted', broadcastedTo: technicianId },
      { status: 'assigned', technician: technicianId, technicianId, acceptedAt: new Date(), assignedAt: new Date() },
      { new: true }
    ).populate(['service', 'technician', 'user', 'broadcastedTo']);

    if (booking) {
      const assignedTechnician = await Technician.findById(technicianId).select('-password');
      const customerPayload = await buildCustomerJobPayload({ booking, technician: assignedTechnician });
      booking.etaMinutes = customerPayload.etaMinutes;
      await booking.save();

      io.to(`user:${booking.user._id}`).emit('job-assigned', customerPayload);
      io.to(`booking:${booking._id}`).emit('job-assigned', customerPayload);
      io.to(`technician:${technicianId}`).emit('job-accepted', { bookingId, status: 'assigned' });

      booking.broadcastedTo
        .filter((technician) => String(technician._id) !== String(technicianId))
        .forEach((technician) => {
          io.to(`technician:${technician._id}`).emit('job-locked', { bookingId });
        });
    } else {
      socket.emit('job-locked', { bookingId });
    }
  });

  const handleTechnicianLocation = async ({ bookingId, technicianId, lat, lng }) => {
    if (!technicianId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;
    const payload = { bookingId, technicianId, lat: Number(lat), lng: Number(lng), updatedAt: new Date().toISOString() };
    await Technician.findByIdAndUpdate(technicianId, {
      location: { type: 'Point', coordinates: [payload.lng, payload.lat] },
      lastActiveAt: new Date()
    });

    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, technician: technicianId }).select('user location');
      if (!booking) return;
      const customerCoordinates = booking.location?.coordinates || [];
      const etaMinutes = await calculateEtaMinutes({
        technicianLocation: { lat: payload.lat, lng: payload.lng },
        customerLocation:
          customerCoordinates.length === 2
            ? { lng: customerCoordinates[0], lat: customerCoordinates[1] }
            : null
      });
      const locationPayload = { ...payload, etaMinutes };
      io.to(`user:${booking.user}`).emit('location-update', locationPayload);
      io.to(`booking:${bookingId}`).emit('location-update', locationPayload);
      io.to(`user:${booking.user}`).emit('technician-location', locationPayload);
      io.to(`booking:${bookingId}`).emit('technician-location', locationPayload);
    }
  };

  socket.on('location-update', handleTechnicianLocation);
  socket.on('technician-location-update', handleTechnicianLocation);

  socket.on('disconnect', () => {
    for (const [technicianId, socketId] of technicianSockets.entries()) {
      if (socketId === socket.id) technicianSockets.delete(technicianId);
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Urben Solution API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/book', bookingRoutes);
app.use('/api', paymentRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Urben Solution API running on port ${port}`);
});
