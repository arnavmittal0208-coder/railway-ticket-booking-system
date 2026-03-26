import { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../api/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [queue, setQueue] = useState([]);
  const [trainForm, setTrainForm] = useState({
    trainId: "",
    label: "",
    status: "active",
    fareMultiplier: 1,
    notes: "",
  });
  const [trainMeta, setTrainMeta] = useState([]);

  const loadAll = async () => {
    const [statsRes, bookingsRes, queueRes, trainRes] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/bookings"),
      api.get("/admin/queue"),
      api.get("/admin/trains"),
    ]);

    setStats(statsRes.data);
    setBookings(bookingsRes.data);
    setQueue(queueRes.data);
    setTrainMeta(trainRes.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveTrainMeta = async (e) => {
    e.preventDefault();
    await api.post("/admin/trains", {
      ...trainForm,
      fareMultiplier: Number(trainForm.fareMultiplier),
    });

    setTrainForm({
      trainId: "",
      label: "",
      status: "active",
      fareMultiplier: 1,
      notes: "",
    });
    loadAll();
  };

  return (
    <section className="admin-grid">
      <article className="panel">
        <h1>Admin Dashboard</h1>
        <p className="sub">Monitor bookings, queue load, and train level controls.</p>
        {stats && (
          <div className="kpi-grid">
            <div>
              <h3>{stats.totalUsers}</h3>
              <p>Users</p>
            </div>
            <div>
              <h3>{stats.totalBookings}</h3>
              <p>Bookings</p>
            </div>
            <div>
              <h3>{stats.queuedCount}</h3>
              <p>Queue Active</p>
            </div>
            <div>
              <h3>INR {stats.totalRevenue}</h3>
              <p>Revenue</p>
            </div>
          </div>
        )}
      </article>

      <article className="panel">
        <h2>Manage Train Data</h2>
        <form className="grid-form" onSubmit={saveTrainMeta}>
          <label>
            Train ID
            <input required value={trainForm.trainId} onChange={(e) => setTrainForm((p) => ({ ...p, trainId: e.target.value }))} />
          </label>
          <label>
            Label
            <input required value={trainForm.label} onChange={(e) => setTrainForm((p) => ({ ...p, label: e.target.value }))} />
          </label>
          <label>
            Status
            <select value={trainForm.status} onChange={(e) => setTrainForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="active">active</option>
              <option value="paused">paused</option>
            </select>
          </label>
          <label>
            Fare Multiplier
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="3"
              value={trainForm.fareMultiplier}
              onChange={(e) => setTrainForm((p) => ({ ...p, fareMultiplier: e.target.value }))}
            />
          </label>
          <label>
            Notes
            <input value={trainForm.notes} onChange={(e) => setTrainForm((p) => ({ ...p, notes: e.target.value }))} />
          </label>
          <button className="primary-btn" type="submit">Save</button>
        </form>

        <div className="train-list compact">
          {trainMeta.map((row) => (
            <div className="train-row" key={row._id}>
              <div>
                <h3>{row.label}</h3>
                <p>{row.trainId}</p>
              </div>
              <div>
                <strong>{row.status}</strong>
                <p>x{row.fareMultiplier}</p>
              </div>
              <div>
                <p>{row.notes || "No notes"}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Queue Monitor</h2>
        <div className="train-list compact">
          {queue.map((job) => (
            <div className="train-row" key={job._id}>
              <div>
                <h3>{job.user?.name || "User"}</h3>
                <p>{job.user?.email}</p>
              </div>
              <div>
                <strong>{job.status}</strong>
                <p>Pos: {job.position}</p>
              </div>
              <div>
                <p>{dayjs(job.createdAt).format("DD MMM, hh:mm A")}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>All Bookings</h2>
        <div className="train-list compact">
          {bookings.map((booking) => (
            <div className="train-row" key={booking._id}>
              <div>
                <h3>{booking.trainName}</h3>
                <p>
                  {booking.from} to {booking.to}
                </p>
              </div>
              <div>
                <strong>{booking.user?.name}</strong>
                <p>{booking.user?.email}</p>
              </div>
              <div>
                <strong>{booking.bookingStatus}</strong>
                <p>{dayjs(booking.createdAt).format("DD MMM YYYY, hh:mm A")}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default AdminDashboard;
