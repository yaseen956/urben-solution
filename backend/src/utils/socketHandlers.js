import Booking from '../models/Booking.js';
import Technician from '../models/Technician.js';
import { buildCustomerJobPayload } from '../services/dispatchService.js';
import { calculateEtaMinutes } from '../services/etaService.js';

export const registerSocketHandlers = (io, technicianSockets) => {
  const safe = (handler) => async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(`Socket handler error: ${error.message}`);
    }
  };

  io.on('connection', (socket) => {
    socket.on('join-user', safe(async (userId) => socket.join(`user:${userId}`)));
    socket.on('join-booking', safe(async (bookingId) => socket.join(`booking:${bookingId}`)));
    socket.on(
      'join-technician',
      safe(async (technicianId) => {
        technicianSockets.set(String(technicianId), socket.id);
        socket.join(`technician:${technicianId}`);
      })
    );

    socket.on(
      'accept-job',
      safe(async ({ bookingId, technicianId }) => {
        if (!bookingId || !technicianId) return;
        const booking = await Booking.findOneAndUpdate(
          { _id: bookingId, status: 'pending', broadcastedTo: technicianId },
          { status: 'accepted', technician: technicianId, technicianId, acceptedAt: new Date(), assignedAt: new Date() },
          { new: true }
        ).populate(['service', 'technician', 'user', 'broadcastedTo']);

        if (booking) {
          const assignedTechnician = await Technician.findById(technicianId).select('-password');
          const customerPayload = await buildCustomerJobPayload({ booking, technician: assignedTechnician });
          booking.etaMinutes = customerPayload.etaMinutes;
          await booking.save();

          io.to(`user:${booking.user._id}`).emit('job-assigned', customerPayload);
          io.to(`booking:${booking._id}`).emit('job-assigned', customerPayload);
          io.to(`technician:${technicianId}`).emit('job-accepted', { bookingId, status: 'accepted' });
          io.to(`technician:${technicianId}`).emit('acceptBooking', { bookingId, status: 'accepted' });

          booking.broadcastedTo
            .filter((technician) => String(technician._id) !== String(technicianId))
            .forEach((technician) => {
              io.to(`technician:${technician._id}`).emit('job-locked', { bookingId, message: 'Job already taken' });
              io.to(`technician:${technician._id}`).emit('acceptBooking', { bookingId, message: 'Job already taken' });
            });
        } else {
          socket.emit('job-locked', { bookingId, message: 'Job already taken' });
          socket.emit('acceptBooking', { bookingId, message: 'Job already taken' });
        }
      })
    );

    const handleTechnicianLocation = safe(async ({ bookingId, technicianId, lat, lng }) => {
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
        io.to(`user:${booking.user}`).emit('locationUpdate', locationPayload);
        io.to(`booking:${bookingId}`).emit('locationUpdate', locationPayload);
      }
    });

    socket.on('location-update', handleTechnicianLocation);
    socket.on('technician-location-update', handleTechnicianLocation);

    socket.on(
      'cancelBooking',
      safe(async ({ bookingId, cancelledBy }) => {
        socket.to(`booking:${bookingId}`).emit('cancelBooking', { bookingId, cancelledBy });
      })
    );

    socket.on(
      'disconnect',
      safe(async () => {
        for (const [technicianId, socketId] of technicianSockets.entries()) {
          if (socketId === socket.id) technicianSockets.delete(technicianId);
        }
      })
    );
  });
};
