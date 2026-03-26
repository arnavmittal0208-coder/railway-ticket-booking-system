const mongoose = require("mongoose");

const trainMetaSchema = new mongoose.Schema(
  {
    trainId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    fareMultiplier: { type: Number, default: 1, min: 0.5, max: 3 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainMeta", trainMetaSchema);
