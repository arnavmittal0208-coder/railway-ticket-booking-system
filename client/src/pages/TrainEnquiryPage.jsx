import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../api/client";

const classOptions = ["All", "Sleeper", "ChairCar", "3A", "2A", "1A"];

const TrainEnquiryPage = () => {
  const { trainId: routeTrainId } = useParams();
  const [searchParams] = useSearchParams();
  const [trainId, setTrainId] = useState(routeTrainId || "12951");
  const [travelClass, setTravelClass] = useState(searchParams.get("travelClass") || "Sleeper");
  const [date, setDate] = useState(searchParams.get("date") || new Date().toISOString().slice(0, 10));
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEnquiry = async (id = trainId) => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/trains/enquiry/${id}`, {
        params: {
          date,
          travelClass,
        },
      });
      setDetails(data);
    } catch (err) {
      setDetails(null);
      setError(err.response?.data?.message || "Unable to fetch train enquiry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiry(routeTrainId || trainId);
  }, [routeTrainId]);

  return (
    <section className="panel">
      <h1>Train Enquiry</h1>
      <p className="sub">Check route, stops, timing and current seat status without booking.</p>

      <form
        className="search-form enquiry-form"
        onSubmit={(e) => {
          e.preventDefault();
          fetchEnquiry(trainId);
        }}
      >
        <label>
          Train Number
          <input value={trainId} onChange={(e) => setTrainId(e.target.value.replace(/\D/g, "").slice(0, 5))} required />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Class
          <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)}>
            {classOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="primary-btn" disabled={loading}>
          {loading ? "Checking..." : "Check Enquiry"}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      {details && (
        <div className="train-list">
          <article className="panel inset-panel">
            <h3>
              {details.trainNumber} - {details.trainName}
            </h3>
            <p>
              {details.from} to {details.to} | {details.duration}
            </p>
            <p>
              Status: {details.availability.status.replace("_", " ")} | Avl {details.availability.available} | RAC {details.availability.rac} | WL {details.availability.waiting}
            </p>
          </article>

          <article className="panel inset-panel">
            <h3>Route & Stops</h3>
            <div className="train-list compact">
              {details.stops.map((stop, idx) => (
                <div className="train-row" key={`${stop.station}-${idx}`}>
                  <div>
                    <strong>{stop.station}</strong>
                  </div>
                  <div>
                    <p>Arr: {stop.arrival}</p>
                  </div>
                  <div>
                    <p>Dep: {stop.departure}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

export default TrainEnquiryPage;
