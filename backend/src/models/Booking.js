import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  },
  { _id: false, timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    scheduledDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'razorpay'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    status: {
      type: String,
      enum: ['Requested', 'Accepted', 'Rejected', 'Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Requested'
    },
    price: { type: Number, required: true },
    review: reviewSchema
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
