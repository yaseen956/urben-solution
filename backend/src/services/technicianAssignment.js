import { findMatchingTechnicians } from './dispatchService.js';

export const findNearestTechnician = async ({ service, lat, lng }) => {
  const technicians = await findMatchingTechnicians({ service, lat, lng, maxDistance: 5000 });
  return technicians[0] || null;
};
