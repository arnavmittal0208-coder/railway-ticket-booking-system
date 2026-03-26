const express = require("express");
const {
  createBooking,
  queueStatus,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/queue/:id", protect, queueStatus);
router.get("/mine", protect, getMyBookings);
router.patch("/:id/cancel", protect, cancelBooking);
router.get("/:id", protect, getBookingById);

module.exports = router;
