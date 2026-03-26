const { searchTrains, getTrainEnquiry } = require("../services/trainApiService");

const search = async (req, res) => {
  const { from, to, date, travelClass } = req.query;
  if (!from || !to || !date || !travelClass) {
    return res.status(400).json({ message: "from, to, date and travelClass are required" });
  }

  const trains = await searchTrains({ from, to, date, travelClass });
  return res.json({
    count: trains.length,
    trains,
  });
};

const enquiry = async (req, res) => {
  const { trainId } = req.params;
  const { date, travelClass } = req.query;

  if (!trainId) {
    return res.status(400).json({ message: "trainId is required" });
  }

  const data = await getTrainEnquiry({
    trainId,
    date: date || new Date().toISOString().slice(0, 10),
    travelClass: travelClass || "Sleeper",
  });

  if (!data) {
    return res.status(404).json({ message: "Train not found in enquiry dataset" });
  }

  return res.json(data);
};

module.exports = {
  search,
  enquiry,
};
