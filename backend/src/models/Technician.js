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
    location: { type: String, trim: true },
    profilePhoto: String,
    idProof: String,
    isApproved: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
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

export default mongoose.model('Technician', technicianSchema);
