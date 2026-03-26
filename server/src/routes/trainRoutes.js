const express = require("express");
const { search, enquiry } = require("../controllers/trainController");

const router = express.Router();

router.get("/search", search);
router.get("/enquiry/:trainId", enquiry);

module.exports = router;
