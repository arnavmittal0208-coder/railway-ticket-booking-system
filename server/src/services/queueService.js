const QueueJob = require("../models/QueueJob");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const { getAvailabilitySnapshot, allotSeatStatus } = require("./availabilityService");
const { buildPNR } = require("../utils/helpers");

let workerStarted = false;

const enqueueBooking = async (userId, payload) => {
  const queuedCount = await QueueJob.countDocuments({ status: "queued" });
  const queueJob = await QueueJob.create({
    user: userId,
    payload,
    status: "queued",
    position: queuedCount + 1,
  });

  return queueJob;
};

const normalizeQueuePositions = async () => {
  const queuedJobs = await QueueJob.find({ status: "queued" }).sort({ createdAt: 1 });
  await Promise.all(
    queuedJobs.map((job, index) => {
      if (job.position !== index + 1) {
        job.position = index + 1;
        return job.save();
      }
      return null;
    })
  );
};

const processOneQueueJob = async () => {
  const nextJob = await QueueJob.findOneAndUpdate(
    { status: "queued" },
    { status: "processing", processingStartedAt: new Date(), position: 0 },
    { sort: { createdAt: 1 }, returnDocument: "after" }
  );

  if (!nextJob) {
    return;
  }

  const { payload, user } = nextJob;

  try {
    const snapshot = await getAvailabilitySnapshot(payload.trainId, payload.travelDate, payload.travelClass);
    const seatStatus = allotSeatStatus(snapshot, payload.passengers.length);

    if (!seatStatus) {
      nextJob.status = "failed";
      nextJob.failureReason = "No seats available in Available/RAC/Waiting quota";
      nextJob.completedAt = new Date();
      await nextJob.save();
      await normalizeQueuePositions();
      return;
    }

    const booking = await Booking.create({
      user,
      trainId: payload.trainId,
      trainName: payload.trainName,
      from: payload.from,
      to: payload.to,
      travelDate: payload.travelDate,
      departureTime: payload.departureTime,
      arrivalTime: payload.arrivalTime,
      duration: payload.duration,
      travelClass: payload.travelClass,
      passengers: payload.passengers,
      passengerCount: payload.passengers.length,
      amountPaid: payload.totalAmount,
      paymentMethod: payload.paymentMethod,
      mealOption: payload.mealOption || "No Meal",
      mealCharge: payload.mealCharge || 0,
      seatStatus,
      queueJobId: nextJob._id,
      pnr: buildPNR(),
      bookingStatus: "confirmed",
    });

    await Transaction.create({
      user,
      booking: booking._id,
      amount: payload.totalAmount,
      paymentMethod: payload.paymentMethod,
      paymentStatus: "success",
      gatewayReference: `TXN-${Date.now()}`,
    });

    nextJob.status = "completed";
    nextJob.completedAt = new Date();
    nextJob.resultBooking = booking._id;
    await nextJob.save();
  } catch (error) {
    nextJob.status = "failed";
    nextJob.completedAt = new Date();
    nextJob.failureReason = error.message;
    await nextJob.save();
  }

  await normalizeQueuePositions();
};

const startQueueWorker = () => {
  if (workerStarted) {
    return;
  }

  workerStarted = true;
  const intervalMs = Number(process.env.QUEUE_PROCESS_INTERVAL_MS || 3000);
  setInterval(() => {
    processOneQueueJob().catch((error) => {
      console.error("Queue worker error:", error.message);
    });
  }, intervalMs);
};

module.exports = {
  enqueueBooking,
  startQueueWorker,
};
