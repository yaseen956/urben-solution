import Booking from '../models/Booking.js';
import Technician from '../models/Technician.js';
import { calculateEtaMinutes } from './etaService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const skillMatchersFor = (service) => {
  const title = service.title || '';
  const canonical = [];

  if (/\bAC\b/i.test(title)) canonical.push('AC Repair', 'AC');
  if (/RO|Water Purifier/i.test(title)) canonical.push('RO Repair', 'RO', 'Water Purifier');
  if (/Cleaning/i.test(title)) canonical.push('Cleaning', 'Deep Cleaning');
  if (/Pest/i.test(title)) canonical.push('Pest Control');
  if (/Electrician/i.test(title)) canonical.push('Electrician');
  if (/Plumber|Plumbing/i.test(title)) canonical.push('Plumbing', 'Plumber');
  if (/Carpenter/i.test(title)) canonical.push('Carpenter');
  if (/Painting/i.test(title)) canonical.push('Painting');
  if (/Salon|Spa|Massage|Makeup/i.test(title)) canonical.push('Salon');

  return [...new Set([title, ...canonical])]
    .filter(Boolean)
    .map((term) => new RegExp(escapeRegex(term), 'i'));
};

export const findMatchingTechnicians = async ({ service, lat, lng, maxDistance = 10000 }) => {
  const coordinates = [Number(lng), Number(lat)];
  if (!coordinates.every(Number.isFinite)) return [];

  return Technician.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distanceMeters',
        maxDistance: maxDistance,
        spherical: true,
        query: {
          isApproved: true,
          isOnline: true,
          isAvailable: true,
          skills: { $in: skillMatchersFor(service) }
        }
      }
    },
    {
      $project: {
        password: 0
      }
    }
  ]);
};

export const buildCustomerJobPayload = async ({ booking, technician }) => {
  const customerCoordinates = booking.location?.coordinates || [];
  const technicianCoordinates = technician?.location?.coordinates || [];
  const eta = await calculateEtaMinutes({
    technicianLocation:
      technicianCoordinates.length === 2
        ? { lng: technicianCoordinates[0], lat: technicianCoordinates[1] }
        : null,
    customerLocation:
      customerCoordinates.length === 2
        ? { lng: customerCoordinates[0], lat: customerCoordinates[1] }
        : null
  });

  return {
    bookingId: booking._id,
    status: booking.status,
    serviceName: booking.serviceName || booking.service?.title,
    address: booking.address,
    lat: customerCoordinates[1],
    lng: customerCoordinates[0],
    etaMinutes: eta,
    technician: technician
      ? {
          id: technician._id,
          name: technician.name,
          skills: technician.skills,
          phone: technician.phone,
          address: technician.address,
          currentLocation:
            technicianCoordinates.length === 2
              ? { lng: technicianCoordinates[0], lat: technicianCoordinates[1] }
              : null
        }
      : null
  };
};

export const dispatchBooking = async ({ booking, service, io }) => {
  const coordinates = booking.location?.coordinates || [];
  let technicians = await findMatchingTechnicians({
    service,
    lng: coordinates[0],
    lat: coordinates[1]
  });
  let radiusKm = 10;
  if (technicians.length === 0) {
    technicians = await findMatchingTechnicians({
      service,
      lng: coordinates[0],
      lat: coordinates[1],
      maxDistance: 20000
    });
    radiusKm = 20;
  }

  booking.broadcastedTo = technicians.map((technician) => technician._id);
  booking.status = 'pending';
  booking.serviceName = booking.serviceName || service.title;
  await booking.save();

  const jobPayload = {
    bookingId: booking._id,
    serviceName: service.title,
    address: booking.address,
    lat: coordinates[1],
    lng: coordinates[0],
    price: booking.price,
    scheduledDate: booking.scheduledDate,
    timeSlot: booking.timeSlot,
    notifiedTechnicians: technicians.length,
    searchRadiusKm: radiusKm
  };

  technicians.forEach((technician) => {
    io.to(`technician:${technician._id}`).emit('new-job', jobPayload);
    io.to(`technician:${technician._id}`).emit('newBooking', jobPayload);
  });

  io.to(`user:${booking.user}`).emit('booking-broadcasted', {
    bookingId: booking._id,
    status: booking.status,
    notifiedTechnicians: technicians.length
  });
  io.to(`booking:${booking._id}`).emit('booking-broadcasted', {
    bookingId: booking._id,
    status: booking.status,
    notifiedTechnicians: technicians.length
  });

  return { booking, technicians };
};
