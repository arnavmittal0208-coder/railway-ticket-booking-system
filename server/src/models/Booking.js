const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    seatPreference: { type: String, enum: ["Window", "Aisle", "No Preference"], default: "No Preference" },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainId: { type: String, required: true, index: true },
    trainName: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    travelDate: { type: String, required: true, index: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: String, required: true },
    travelClass: { type: String, required: true },
    passengers: { type: [passengerSchema], required: true },
    passengerCount: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    mealOption: {
      type: String,
      enum: ["Veg", "Non-Veg", "No Meal"],
      default: "No Meal",
    },
    mealCharge: { type: Number, default: 0 },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "failed", "cancelled"],
      default: "confirmed",
      index: true,
    },
    seatStatus: {
      type: String,
      enum: ["confirmed", "rac", "waiting_list", "cancelled"],
      default: "confirmed",
      index: true,
    },
    pnr: { type: String, required: true, unique: true },
    queueJobId: { type: mongoose.Schema.Types.ObjectId, ref: "QueueJob" },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ trainId: 1, travelDate: 1, travelClass: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
