const Booking = require("../models/Booking");
const QueueJob = require("../models/QueueJob");
const Transaction = require("../models/Transaction");
const TrainMeta = require("../models/TrainMeta");
const User = require("../models/User");
const { hashPassword } = require("../utils/crypto");

const getDashboard = async (req, res) => {
  const [totalUsers, totalBookings, queuedCount, totalRevenue] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Booking.countDocuments({}),
    QueueJob.countDocuments({ status: { $in: ["queued", "processing"] } }),
    Transaction.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    totalUsers,
    totalBookings,
    queuedCount,
    totalRevenue: totalRevenue?.[0]?.total || 0,
  });
};

const getAllBookings = async (req, res) => {
  const bookings = await Booking.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(bookings);
};

const getQueue = async (req, res) => {
  const queue = await QueueJob.find({}).populate("user", "name email").sort({ createdAt: -1 });
  res.json(queue);
};

const listTrainMeta = async (req, res) => {
  const rows = await TrainMeta.find({}).sort({ updatedAt: -1 });
  res.json(rows);
};

const upsertTrainMeta = async (req, res) => {
  const { trainId, label, status, fareMultiplier, notes } = req.body;
  if (!trainId || !label) {
    return res.status(400).json({ message: "trainId and label are required" });
  }

  const row = await TrainMeta.findOneAndUpdate(
    { trainId },
    {
      trainId,
      label,
      status: status || "active",
      fareMultiplier: fareMultiplier || 1,
      notes: notes || "",
    },
    { upsert: true, returnDocument: "after" }
  );

  res.json(row);
};

const ensureDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return;
  }

  await User.create({
    name: "System Admin",
    email,
    password: await hashPassword(password),
    role: "admin",
  });

  console.log(`Default admin created: ${email}`);
};

module.exports = {
  getDashboard,
  getAllBookings,
  getQueue,
  listTrainMeta,
  upsertTrainMeta,
  ensureDefaultAdmin,
};
