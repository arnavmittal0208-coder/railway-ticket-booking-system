const axios = require("axios");
const TrainMeta = require("../models/TrainMeta");
const { toHHmm, formatDuration } = require("../utils/helpers");
const { getAvailabilitySnapshot } = require("./availabilityService");
const { getIndianTrainsForRoute, getTrainByNumber } = require("../data/indianRailData");

const IRailClient = axios.create({
  baseURL: process.env.TRAIN_API_BASE_URL || "https://api.irail.be",
  timeout: 10000,
});

const getStationCode = (station) => {
  const match = String(station || "").match(/\(([A-Za-z0-9]+)\)\s*$/);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }
  return String(station || "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 4)
    .toUpperCase();
};

const toRapidApiDate = (dateISO) => {
  const date = new Date(dateISO);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
};

const fetchRapidApiTrains = async ({ from, to, date, travelClass }) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;
  if (!apiKey || !apiHost) {
    console.warn("RapidAPI credentials missing");
    return [];
  }

  const endpoint = process.env.RAPIDAPI_SEARCH_PATH || "/api/v3/trainBetweenStations";

  const fromCode = getStationCode(from);
  const toCode = getStationCode(to);
  const dateOfJourney = toRapidApiDate(date);

  console.log(`[RapidAPI] Fetching trains from ${fromCode} to ${toCode} on ${dateOfJourney}`);

  try {
    const { data } = await axios.get(`https://${apiHost}${endpoint}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      params: {
        fromStationCode: fromCode,
        toStationCode: toCode,
        dateOfJourney,
      },
      timeout: 10000,
    });

    const messageStatus = data && data.message ? data.message : "Success";
    const dataRowCount = (data && data.data && data.data.length) || (data && data.trains && data.trains.length) || 0;
    console.log(`[RapidAPI] Response status: ${messageStatus}, rows: ${dataRowCount}`);
    const rows = Array.isArray(data && data.data) ? data.data : Array.isArray(data && data.trains) ? data.trains : [];

    const trains = [];
    for (const row of rows.slice(0, 15)) {
      const trainNumber = String(row.train_number || row.trainNo || row.number || "").trim();
      if (!trainNumber) {
        continue;
      }

      const trainName = row.train_name || row.name || `Train ${trainNumber}`;
      const departureTime = row.from_std || row.departure_time || addMinutesToNowHHmm(40 + trains.length * 25);
      const arrivalTime = row.to_std || row.arrival_time || addMinutesToNowHHmm(130 + trains.length * 25);
      const duration = row.duration || row.travel_time || "--";

      const baseFare = Math.max(220, Number(row.fare || 0) || 350);
      const multiplier = classFareMultiplier[travelClass] || 1;
      const snapshot = await getAvailabilitySnapshot(trainNumber, date, travelClass);

      trains.push({
        trainId: trainNumber,
        trainNumber,
        trainName,
        from: row.from_station_name || from,
        to: row.to_station_name || to,
        departureTime,
        arrivalTime,
        duration,
        availableSeats: snapshot.available,
        availability: {
          status: snapshot.status,
          available: snapshot.available,
          rac: snapshot.racAvailable,
          waiting: snapshot.waitingAvailable,
        },
        travelClass,
        fare: Math.round(baseFare * multiplier),
        live: true,
        source: "RapidAPI",
      });
    }

    console.log(`[RapidAPI] Successfully parsed ${trains.length} trains`);
    return trains;
  } catch (err) {
    console.error("[RapidAPI] Error fetching trains:", err.message);
    if (err.response && err.response.status === 429) {
      console.error("[RapidAPI] Rate limited (429) - API quota exceeded. Will use fallback data.");
    } else if (err.code === "ENOTFOUND") { 
      console.error("[RapidAPI] Network error - could not reach API");
    } else if (err.response && err.response.status === 403) {
      console.error("[RapidAPI] Forbidden (403) - Invalid API credentials");
    }
    return [];
  }
};

const classFareMultiplier = {
  Sleeper: 1,
  ChairCar: 1.2,
  "3A": 1.45,
  "2A": 1.75,
  "1A": 2.2,
};

const addMinutesToNowHHmm = (minsToAdd) => {
  const date = new Date(Date.now() + minsToAdd * 60 * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const buildFallbackConnections = ({ from, to }) => {
  const now = Date.now();
  const segments = [50, 95, 140, 185, 230, 275];

  return segments.map((mins, index) => {
    const departureDate = new Date(now + mins * 60 * 1000);
    const durationSeconds = (70 + index * 10) * 60;
    const arrivalDate = new Date(departureDate.getTime() + durationSeconds * 1000);

    return {
      departure: {
        vehicle: `LOCAL-${from.slice(0, 3).toUpperCase()}-${to.slice(0, 3).toUpperCase()}-${index + 1}`,
        vehicleinfo: { shortname: `${from} ${to} Express ${index + 1}` },
        time: Math.floor(departureDate.getTime() / 1000),
      },
      arrival: {
        time: Math.floor(arrivalDate.getTime() / 1000),
      },
      duration: durationSeconds,
      _fallback: true,
    };
  });
};

const toDateDigits = (dateISO) => {
  const date = new Date(dateISO);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}${mm}${yyyy}`;
};

const searchTrains = async ({ from, to, date, travelClass }) => {
  // Handle "All" class by showing Sleeper class as default
  const cls = travelClass === "All" ? "Sleeper" : travelClass;
  
  const indianResults = getIndianTrainsForRoute({ from, to, travelClass: cls });
  const trains = [];
  const seen = new Set();

  try {
    const rapidTrains = await fetchRapidApiTrains({ from, to, date, travelClass: cls });
    for (const row of rapidTrains) {
      const key = `${row.trainId}:${row.departureTime}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      trains.push(row);
    }
  } catch (error) {
    console.warn("RapidAPI train fetch unavailable:", error.message);
  }

  for (const [index, train] of indianResults.entries()) {
    const departureTime = addMinutesToNowHHmm(35 + index * 45);
    const arrivalTime = addMinutesToNowHHmm(35 + index * 45 + train.durationMinutes);
    const snapshot = await getAvailabilitySnapshot(train.trainId, date, cls);

    const key = `${train.trainId}:${departureTime}`;
    seen.add(key);
    trains.push({
      trainId: train.trainId,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      from: train.from,
      to: train.to,
      departureTime,
      arrivalTime,
      duration: formatDuration(train.durationMinutes * 60),
      availableSeats: snapshot.available,
      availability: {
        status: snapshot.status,
        available: snapshot.available,
        rac: snapshot.racAvailable,
        waiting: snapshot.waitingAvailable,
      },
      route: train.route,
      travelClass: cls,
      fare: train.fare,
      live: false,
      source: train.source,
    });
  }

  const irailDate = toDateDigits(date);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  let rawConnections = [];

  try {
    const { data } = await IRailClient.get("/connections", {
      params: {
        from,
        to,
        date: irailDate,
        time: `${hh}${mm}`,
        timesel: "departure",
        format: "json",
        lang: "en",
      },
    });

    rawConnections = Array.isArray(data?.connection)
      ? data.connection
      : data?.connection
        ? [data.connection]
        : [];
  } catch (error) {
    console.warn("Live train API unavailable:", error.message);
    rawConnections = buildFallbackConnections({ from, to });
  }

  if (rawConnections.length === 0) {
    rawConnections = buildFallbackConnections({ from, to });
  }

  const metas = await TrainMeta.find({});
  const metaMap = new Map(metas.map((m) => [m.trainId, m]));

  for (const item of rawConnections.slice(0, 12)) {
    const rawId = item?.departure?.vehicle || "TRAIN-UNKNOWN";
    const trainId = String(rawId).replace(/\s+/g, "-").toUpperCase();
    const trainName = item?.departure?.vehicleinfo?.shortname || rawId;
    const departureTime = toHHmm(item?.departure?.time);
    const arrivalTime = toHHmm(item?.arrival?.time);
    const duration = formatDuration(item?.duration);

    const baseFare = Math.max(200, Math.floor((Number(item?.duration || 3600) / 60) * 3.2));
    const multiplier = classFareMultiplier[cls] || 1;
    const meta = metaMap.get(trainId);

    if (meta?.status === "paused") {
      continue;
    }

    const snapshot = await getAvailabilitySnapshot(trainId, date, cls);

    const dedupeKey = `${trainId}:${departureTime}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    trains.push({
      trainId,
      trainNumber: trainId.replace(/[^0-9]/g, "").slice(0, 5) || "00000",
      trainName: meta?.label || trainName,
      from,
      to,
      departureTime,
      arrivalTime,
      duration,
      availableSeats: snapshot.available,
      availability: {
        status: snapshot.status,
        available: snapshot.available,
        rac: snapshot.racAvailable,
        waiting: snapshot.waitingAvailable,
      },
      travelClass: cls,
      fare: Math.round(baseFare * multiplier * (meta?.fareMultiplier || 1)),
      live: !item?._fallback,
      source: item?._fallback ? "Fallback" : "iRail",
    });
  }

  return trains.slice(0, 20);
};

const getTrainEnquiry = async ({ trainId, date, travelClass }) => {
  const row = getTrainByNumber(trainId);
  if (!row) {
    return null;
  }

  const cls = travelClass === "All" || !travelClass ? "Sleeper" : travelClass;
  const snapshot = await getAvailabilitySnapshot(row.number, date, cls);

  const stops = row.route.map((station, index) => {
    const base = 45 + index * Math.floor(row.durationMin / Math.max(1, row.route.length - 1));
    return {
      station,
      arrival: index === 0 ? "Source" : addMinutesToNowHHmm(base),
      departure: index === row.route.length - 1 ? "Destination" : addMinutesToNowHHmm(base + 7),
      halt: index === 0 || index === row.route.length - 1 ? "-" : "7m",
    };
  });

  return {
    trainId: row.number,
    trainNumber: row.number,
    trainName: row.name,
    from: row.from,
    to: row.to,
    date,
    travelClass: cls,
    duration: formatDuration(row.durationMin * 60),
    availability: {
      status: snapshot.status,
      available: snapshot.available,
      rac: snapshot.racAvailable,
      waiting: snapshot.waitingAvailable,
    },
    stops,
  };
};

module.exports = {
  searchTrains,
  getTrainEnquiry,
};
