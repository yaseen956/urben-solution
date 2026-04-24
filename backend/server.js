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
import locationRoutes from './src/routes/locationRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js';
import { registerSocketHandlers } from './src/utils/socketHandlers.js';

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

registerSocketHandlers(io, technicianSockets);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Urben Solution API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/book', bookingRoutes);
app.use('/api', paymentRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Urben Solution API running on port ${port}`);
});
