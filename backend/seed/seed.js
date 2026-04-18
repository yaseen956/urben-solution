import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Technician from '../src/models/Technician.js';
import Service from '../src/models/Service.js';
import Booking from '../src/models/Booking.js';

dotenv.config();

const categories = [
  'Home Cleaning & Pest Control',
  'Appliance Repair & Services',
  'Electrician, Plumber & Carpenter',
  'Home Improvement & Construction',
  'Beauty & Personal Care',
  'Other Specialized Services'
];

const images = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=900&q=80'
];

const services = [
  ['Full Home Deep Cleaning', categories[0], 'Complete dusting, scrubbing, bathroom and kitchen sanitization.', 2499, ['deep cleaning', 'home']],
  ['Kitchen Cleaning', categories[0], 'Degreasing, sink cleaning, cabinets exterior and appliance surface care.', 999, ['kitchen', 'cleaning']],
  ['Bathroom Cleaning', categories[0], 'Tiles, fittings, floor, mirror and hard-stain cleaning.', 699, ['bathroom', 'cleaning']],
  ['Sofa & Carpet Cleaning', categories[0], 'Vacuuming, shampooing and stain treatment for fabric surfaces.', 1299, ['sofa', 'carpet']],
  ['Pest Control', categories[0], 'Treatment for cockroaches, termites, mosquitoes and common pests.', 1499, ['pest', 'termites', 'cockroaches']],
  ['AC Repair & Gas Refill', categories[1], 'Diagnosis, service, installation and gas refill support.', 899, ['ac', 'repair']],
  ['Washing Machine Repair', categories[1], 'Top-load and front-load repair, drainage and motor issues.', 799, ['washing machine', 'repair']],
  ['Refrigerator Repair', categories[1], 'Cooling, compressor and thermostat issue inspection.', 899, ['refrigerator', 'repair']],
  ['Microwave Repair', categories[1], 'Heating, plate rotation and wiring checks.', 699, ['microwave', 'repair']],
  ['RO / Water Purifier Service', categories[1], 'Filter replacement, leakage fix and water quality check.', 649, ['ro', 'water purifier']],
  ['Chimney & Hob Repair', categories[1], 'Deep cleaning, suction issue repair and burner maintenance.', 1099, ['chimney', 'hob']],
  ['Electrician Visit', categories[2], 'Fan, switch, wiring, inverter and fixture support.', 299, ['electrician', 'wiring']],
  ['Plumber Visit', categories[2], 'Leakage, pipe fitting, drainage and tap repair.', 299, ['plumbing', 'tap']],
  ['Carpenter Visit', categories[2], 'Furniture repair, door locks, hinges and modular work.', 349, ['carpenter', 'furniture']],
  ['House Painting', categories[3], 'Interior and exterior painting with surface preparation.', 4999, ['painting', 'home improvement']],
  ['Interior Design', categories[3], 'Layout planning, material suggestions and room styling consultation.', 2999, ['interior', 'design']],
  ['Modular Kitchen Setup', categories[3], 'Design, installation coordination and finish selection.', 8999, ['modular kitchen']],
  ['False Ceiling & POP Work', categories[3], 'POP, gypsum ceiling, light channels and finishing.', 5999, ['false ceiling', 'pop']],
  ['Flooring & Tiling', categories[3], 'Tile installation, repair, grouting and floor finishing.', 3999, ['flooring', 'tiling']],
  ['Salon for Women', categories[4], 'Facial, waxing, cleanup and grooming services at home.', 999, ['salon', 'women']],
  ['Salon for Men', categories[4], 'Haircut, beard grooming and cleanup at home.', 499, ['salon', 'men']],
  ['Bridal Makeup', categories[4], 'Event-ready bridal makeup and hairstyling.', 7999, ['bridal', 'makeup']],
  ['Spa & Massage Therapy', categories[4], 'Relaxing therapy sessions with trained professionals.', 1499, ['spa', 'massage']],
  ['Packers & Movers', categories[5], 'Packing, loading and moving assistance for local shifts.', 3499, ['packers', 'movers']],
  ['Home Tutors', categories[5], 'Verified tutors for school subjects and skill learning.', 799, ['tutor', 'education']],
  ['Fitness Trainers', categories[5], 'Personal training, yoga and home workout programs.', 999, ['fitness', 'trainer']],
  ['Event Photographers', categories[5], 'Photography for events, birthdays and weddings.', 4999, ['photographer', 'wedding']]
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urben_solution');
  await Promise.all([User.deleteMany(), Technician.deleteMany(), Service.deleteMany(), Booking.deleteMany()]);

  const [admin, user] = await User.create([
    { name: 'Admin', email: 'admin@urbensolution.com', phone: '9000000001', password: 'Admin@123', role: 'admin' },
    { name: 'Demo User', email: 'user@urbensolution.com', phone: '9000000002', password: 'User@123' }
  ]);

  const technician = await Technician.create({
    name: 'Aarav Sharma',
    email: 'tech@urbensolution.com',
    phone: '9000000003',
    password: 'Tech@123',
    skills: [categories[0], categories[1], 'deep cleaning', 'ac', 'repair'],
    experience: 5,
    location: 'Delhi NCR',
    isApproved: true,
    isOnline: true,
    rating: 4.8
  });

  const docs = await Service.create(
    services.map(([title, category, description, price, tags]) => ({
      title,
      category,
      description,
      price,
      tags,
      image: images[categories.indexOf(category)],
      duration: price > 3000 ? '1-2 days' : '60-120 min'
    }))
  );

  await Booking.create({
    user: user._id,
    technician: technician._id,
    service: docs[0]._id,
    scheduledDate: new Date(Date.now() + 86400000),
    timeSlot: '10:00 AM - 12:00 PM',
    address: '221B, Green Avenue, Delhi',
    price: docs[0].price,
    status: 'Pending'
  });

  console.log(`Seeded ${docs.length} services, admin ${admin.email}, user ${user.email}, technician ${technician.email}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
