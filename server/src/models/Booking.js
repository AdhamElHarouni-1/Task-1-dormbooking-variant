import mongoose from 'mongoose';

// TODO: define the Booking schema per README.md section 1.

const bookingSchema = new mongoose.Schema(
  {
    // TODO
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
