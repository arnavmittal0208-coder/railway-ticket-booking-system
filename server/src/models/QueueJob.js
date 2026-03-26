const mongoose = require("mongoose");

const queueJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payload: { type: Object, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    position: { type: Number, default: 0 },
    processingStartedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String },
    resultBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueJob", queueJobSchema);
