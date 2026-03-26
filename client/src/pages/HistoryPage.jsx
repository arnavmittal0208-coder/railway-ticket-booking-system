import { useEffect, useState } from "react";
import api from "../api/client";
import { formatINR, formatIndianDate, formatIndianDateTime } from "../utils/formatters";

const HistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/bookings/mine");
        setBookings(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="screen-loader">Loading booking history...</div>;
  }

  const cancelTicket = async (bookingId) => {
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/cancel`, {
        reason: "Cancelled by user",
      });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, ...data.booking } : b))
      );
      setMessage(`Ticket cancelled. Refund initiated: ${formatINR(data.refundAmount)}`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to cancel ticket");
    }
  };

  return (
    <section className="panel">
      <h1>Booking History</h1>
      <p className="sub">Track ticket status and booking timestamps.</p>
      {message && <p className="queue-info">{message}</p>}
      <div className="train-list">
        {bookings.map((booking) => (
          <article className="train-row" key={booking._id}>
            <div>
              <h3>{booking.trainName}</h3>
              <p>
                {booking.from} to {booking.to}
              </p>
            </div>
            <div>
              <strong>{formatIndianDate(booking.travelDate)}</strong>
              <p>{booking.travelClass}</p>
            </div>
            <div>
              <strong>{booking.bookingStatus}</strong>
              <p>
                PNR: {booking.pnr} | Seat: {String(booking.seatStatus || "confirmed").replace("_", " ")}
              </p>
            </div>
            <div>
              <strong>{formatINR(booking.amountPaid)}</strong>
              <p>{formatIndianDateTime(booking.createdAt)}</p>
            </div>
            <div>
              {booking.bookingStatus !== "cancelled" ? (
                <button className="secondary-btn" onClick={() => cancelTicket(booking._id)}>
                  Cancel Ticket
                </button>
              ) : (
                <span className="seat-pill cancelled">Cancelled</span>
              )}
            </div>
          </article>
        ))}
        {!bookings.length && <p className="muted-line">No bookings available yet.</p>}
      </div>
    </section>
  );
};

export default HistoryPage;
