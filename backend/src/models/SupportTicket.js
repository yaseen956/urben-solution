import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['support', 'chat', 'issue', 'emergency'], default: 'support' },
    status: { type: String, enum: ['open', 'in_review', 'closed'], default: 'open' }
  },
  { timestamps: true }
);

export default mongoose.model('SupportTicket', supportTicketSchema);
