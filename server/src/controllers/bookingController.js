const QueueJob = require("../models/QueueJob");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const { enqueueBooking } = require("../services/queueService");

const validateBookingPayload = (payload) => {
  const required = [
    "trainId",
    "trainName",
    "from",
    "to",
    "travelDate",
    "departureTime",
    "arrivalTime",
    "duration",
    "travelClass",
    "paymentMethod",
    "totalAmount",
  ];

  for (const key of required) {
    if (!payload[key]) {
      return `${key} is required`;
    }
  }

  if (!Array.isArray(payload.passengers) || payload.passengers.length === 0) {
    return "At least one passenger is required";
  }

  return null;
};

const calculateRefund = (amountPaid) => {
  const cancellationFee = Math.max(60, Math.round(Number(amountPaid || 0) * 0.1));
  return Math.max(0, Number(amountPaid || 0) - cancellationFee);
};

const createBooking = async (req, res) => {
  const error = validateBookingPayload(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const queueJob = await enqueueBooking(req.user.userId, req.body);

  return res.status(202).json({
    message: "Booking request accepted and added to queue",
    queueJobId: queueJob._id,
    queuePosition: queueJob.position,
    status: queueJob.status,
  });
};

const queueStatus = async (req, res) => {
  const { id } = req.params;
  const queueJob = await QueueJob.findOne({ _id: id, user: req.user.userId }).populate("resultBooking");

  if (!queueJob) {
    return res.status(404).json({ message: "Queue job not found" });
  }

  return res.json(queueJob);
};

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.userId }).sort({ createdAt: -1 });
  return res.json(bookings);
};

const getBookingById = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user.userId });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.json(booking);
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const booking = await Booking.findOne({ _id: id, user: req.user.userId });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  booking.bookingStatus = "cancelled";
  booking.seatStatus = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason || "Cancelled by user";
  await booking.save();

  const refundAmount = calculateRefund(booking.amountPaid);
  const transaction = await Transaction.findOne({ booking: booking._id });
  if (transaction) {
    transaction.paymentStatus = "refunded";
    transaction.refundAmount = refundAmount;
    transaction.refundedAt = new Date();
    await transaction.save();
  }

  return res.json({
    message: "Booking cancelled successfully",
    booking,
    refundAmount,
  });
};

module.exports = {
  createBooking,
  queueStatus,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
