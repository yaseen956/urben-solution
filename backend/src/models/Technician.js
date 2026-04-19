import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const technicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    skills: [{ type: String, trim: true }],
    experience: { type: Number, default: 0 },
    address: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    profilePhoto: String,
    idProof: String,
    documents: {
      dl: { type: String },
      idProof: { type: String },
      others: { type: [String], default: [] }
    },
    vehicleInfo: {
      type: String,
      number: String
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String
    },
    isApproved: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    lastActiveAt: Date,
    earnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

technicianSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

technicianSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

technicianSchema.index({ location: '2dsphere' });

export default mongoose.model('Technician', technicianSchema);
