import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../api/client";
import AutocompleteInput from "../components/AutocompleteInput";
import { indianStations } from "../data/indiaLocations";
import { formatINR } from "../utils/formatters";

const classOptions = ["All", "Sleeper", "ChairCar", "3A", "2A", "1A"];

const HomePage = () => {
  const [query, setQuery] = useState({
    from: "New Delhi (NDLS)",
    to: "Mumbai Central (MMCT)",
    date: dayjs().add(1, "day").format("YYYY-MM-DD"),
    travelClass: "Sleeper",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/trains/search", { params: query });
      setResults(data.trains || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch trains");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resultMeta = useMemo(() => {
    if (!results.length) {
      return "Search Indian routes to view train availability.";
    }
    return `${results.length} trains found`;
  }, [results]);

  return (
    <section className="home-grid">
      <article className="hero-card">
        <h1>Indian Railway Ticket Booking</h1>
        <p>
          Search routes, lock your seats through queue-backed booking, and track each ticket status with
          instant updates.
        </p>
        <form onSubmit={search} className="search-form">
          <AutocompleteInput
            label="From Station"
            name="from"
            required
            value={query.from}
            options={indianStations}
            placeholder="Type station name"
            onChange={(value) => setQuery((p) => ({ ...p, from: value }))}
          />
          <AutocompleteInput
            label="To Station"
            name="to"
            required
            value={query.to}
            options={indianStations}
            placeholder="Type station name"
            onChange={(value) => setQuery((p) => ({ ...p, to: value }))}
          />
          <label>
            Date
            <input
              required
              type="date"
              value={query.date}
              onChange={(e) => setQuery((p) => ({ ...p, date: e.target.value }))}
            />
          </label>
          <label>
            Class
            <select
              value={query.travelClass}
              onChange={(e) => setQuery((p) => ({ ...p, travelClass: e.target.value }))}
            >
              {classOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? "Searching..." : "Search Trains"}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </article>

      <article className="results-card">
        <div className="result-head">
          <h2>Live Results</h2>
          <span>{resultMeta}</span>
        </div>

        <div className="train-list">
          {results.map((train) => (
            <div className="train-row" key={`${train.trainId}-${train.departureTime}`}>
              <div>
                <h3>
                  {train.trainNumber} - {train.trainName}
                </h3>
                <p>
                  {train.from} to {train.to}
                </p>
              </div>
              <div>
                <strong>
                  {train.departureTime} to {train.arrivalTime} IST
                </strong>
                <p>{train.duration}</p>
              </div>
              <div>
                <strong className={`seat-pill ${String(train.availability?.status || "AVAILABLE").toLowerCase()}`}>
                  {(train.availability?.status || "AVAILABLE").replace("_", " ")}
                </strong>
                <p>
                  Avl {train.availability?.available ?? train.availableSeats} | RAC {train.availability?.rac ?? 0}
                  {" "}| WL {train.availability?.waiting ?? 0}
                </p>
              </div>
              <div>
                <strong>{formatINR(train.fare)}</strong>
                <p>{train.source}</p>
              </div>
              <div className="row-actions">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    navigate(`/enquiry/${train.trainId}?date=${query.date}&travelClass=${query.travelClass}`)
                  }
                >
                  Enquiry
                </button>
                <button
                  className="primary-btn"
                  onClick={() => navigate("/book", { state: { train, travelDate: query.date } })}
                  disabled={train.availability?.status === "REGRET"}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
          {!results.length && <p className="muted-line">No results to display.</p>}
        </div>
      </article>
    </section>
  );
};

export default HomePage;
