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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, trim: true },
    scheduledDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined }
    },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'razorpay'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentId: String,
    orderId: { type: String, index: true },
    cancelOtp: String,
    cancelOtpExpiresAt: Date,
    cancelRequestedBy: { type: String, enum: ['user', 'technician'] },
    status: {
      type: String,
      enum: [
        'Requested',
        'Accepted',
        'Rejected',
        'Pending',
        'In Progress',
        'Completed',
        'Cancelled',
        'pending',
        'paid',
        'broadcasted',
        'accepted',
        'assigned',
        'in_progress',
        'completed',
        'on_the_way',
        'cancelled'
      ],
      default: 'Requested'
    },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    broadcastedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technician' }],
    acceptedAt: Date,
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    etaMinutes: Number,
    price: { type: Number, required: true },
    review: reviewSchema
  },
  { timestamps: true }
);

bookingSchema.index({ location: '2dsphere' });

export default mongoose.model('Booking', bookingSchema);
