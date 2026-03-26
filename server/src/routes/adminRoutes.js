const express = require("express");
const {
  getDashboard,
  getAllBookings,
  getQueue,
  listTrainMeta,
  upsertTrainMeta,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/bookings", getAllBookings);
router.get("/queue", getQueue);
router.get("/trains", listTrainMeta);
router.post("/trains", upsertTrainMeta);

module.exports = router;
