import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, default: '60-90 min' },
    image: String,
    tags: [{ type: String, trim: true }],
    rating: { type: Number, default: 4.7 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

serviceSchema.index({ title: 'text', category: 'text', tags: 'text' });

export default mongoose.model('Service', serviceSchema);
