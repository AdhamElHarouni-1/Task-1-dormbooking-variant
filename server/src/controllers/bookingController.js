import Joi from 'joi';
import { Booking } from '../models/Booking.js';

const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  purpose: Joi.string().allow('').optional(),
  bookedBy: Joi.string().hex().length(24).optional()
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string().allow(''),
  bookedBy: Joi.string().hex().length(24)
});

function publicBooking(b) {
  return {
    id: b._id.toString(),
    roomNumber: b.roomNumber,
    startDate: b.startDate,
    endDate: b.endDate,
    purpose: b.purpose,
    bookedBy: b.bookedBy,
    createdAt: b.createdAt
  };
}

// startDate must be strictly before endDate — Joi can't infer this
// relationship between two independent fields on its own, so it's
// checked by hand after schema validation passes.
function validateDateOrder(startDate, endDate) {
  if (new Date(startDate) >= new Date(endDate)) {
    return 'startDate must be before endDate';
  }
  return null;
}

// Two bookings on the same room conflict if their ranges overlap.
// Ranges [startA, endA] and [startB, endB] overlap iff
// startA < endB AND startB < endA — this queries for any existing
// booking on the same room satisfying that with the proposed range.
// excludeId is passed on update so a booking doesn't conflict with itself.
async function findConflict(roomNumber, startDate, endDate, excludeId) {
  const query = {
    roomNumber,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Booking.findOne(query);
}

// GET /api/bookings
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('bookedBy', 'name email')
      .lean();
    res.json({ bookings: bookings.map(publicBooking) });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}

// POST /api/bookings
// POST /api/bookings
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const dateError = validateDateOrder(value.startDate, value.endDate);
    if (dateError) return res.status(400).json({ message: dateError });

    const conflict = await findConflict(value.roomNumber, value.startDate, value.endDate);
    if (conflict) {
      return res.status(409).json({
        message: 'Booking conflicts with an existing booking for this room',
        conflictingBooking: publicBooking(conflict)
      });
    }

    const booking = await Booking.create(value);
    res.status(201).json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// PATCH /api/bookings/:id
// PATCH /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Booking not found' });

    const roomNumber = value.roomNumber ?? existing.roomNumber;
    const startDate = value.startDate ?? existing.startDate;
    const endDate = value.endDate ?? existing.endDate;

    const dateError = validateDateOrder(startDate, endDate);
    if (dateError) return res.status(400).json({ message: dateError });

    const conflict = await findConflict(roomNumber, startDate, endDate, existing._id);
    if (conflict) {
      return res.status(409).json({
        message: 'Booking conflicts with an existing booking for this room',
        conflictingBooking: publicBooking(conflict)
      });
    }

    const doc = await Booking.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ booking: publicBooking(doc) });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
export async function deleteBooking(req, res, next) {
  try {
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Booking not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}