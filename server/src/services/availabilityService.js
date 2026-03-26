const Booking = require("../models/Booking");
const { seededRandomInt } = require("../utils/helpers");

const CLASS_CAPACITY_RANGE = {
  Sleeper: [80, 140],
  "3A": [40, 72],
  "2A": [24, 54],
  "1A": [12, 24],
  ChairCar: [50, 100],
};

const RAC_RATIO = 0.2;
const WAITING_RATIO = 0.35;

const getTotalCapacity = (trainId, travelDate, travelClass) => {
  const [min, max] = CLASS_CAPACITY_RANGE[travelClass] || [40, 90];
  return seededRandomInt(`${trainId}:${travelDate}:${travelClass}`, min, max);
};

const getAvailableSeats = async (trainId, travelDate, travelClass) => {
  const snapshot = await getAvailabilitySnapshot(trainId, travelDate, travelClass);
  return snapshot.available;
};

const getAvailabilitySnapshot = async (trainId, travelDate, travelClass) => {
  const capacity = getTotalCapacity(trainId, travelDate, travelClass);

  const buckets = await Booking.aggregate([
    {
      $match: {
        trainId,
        travelDate,
        travelClass,
        bookingStatus: "confirmed",
      },
    },
    {
      $project: {
        passengerCount: 1,
        seatBucket: {
          $ifNull: ["$seatStatus", "confirmed"],
        },
      },
    },
    {
      $group: {
        _id: "$seatBucket",
        seatsBooked: { $sum: "$passengerCount" },
      },
    },
  ]);

  const asMap = Object.fromEntries(buckets.map((row) => [row._id, row.seatsBooked]));
  const confirmedBooked = asMap.confirmed || 0;
  const racBooked = asMap.rac || 0;
  const waitingBooked = asMap.waiting_list || 0;

  const racLimit = Math.max(2, Math.round(capacity * RAC_RATIO));
  const waitingLimit = Math.max(5, Math.round(capacity * WAITING_RATIO));
  const available = Math.max(0, capacity - confirmedBooked);
  const racAvailable = Math.max(0, racLimit - racBooked);
  const waitingAvailable = Math.max(0, waitingLimit - waitingBooked);

  let status = "REGRET";
  if (available > 0) {
    status = "AVAILABLE";
  } else if (racAvailable > 0) {
    status = "RAC";
  } else if (waitingAvailable > 0) {
    status = "WAITING_LIST";
  }

  return {
    capacity,
    available,
    racAvailable,
    waitingAvailable,
    status,
  };
};

const allotSeatStatus = (snapshot, passengerCount) => {
  if (snapshot.available >= passengerCount) {
    return "confirmed";
  }
  if (snapshot.racAvailable >= passengerCount) {
    return "rac";
  }
  if (snapshot.waitingAvailable >= passengerCount) {
    return "waiting_list";
  }
  return null;
};

module.exports = {
  getAvailableSeats,
  getAvailabilitySnapshot,
  allotSeatStatus,
};
