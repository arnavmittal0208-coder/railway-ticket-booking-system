import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { formatINR, formatIndianDate } from "../utils/formatters";

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load booking");
      }
    };

    load();
  }, [bookingId]);

  if (error) {
    return (
      <section className="panel">
        <p className="error-msg">{error}</p>
      </section>
    );
  }

  if (!booking) {
    return <div className="screen-loader">Loading ticket...</div>;
  }

  return (
    <section className="panel confirmation-card">
      <h1>Booking Confirmed</h1>
      <p className="sub">Your e-ticket is generated successfully.</p>

      <div className="ticket-grid">
        <p>
          <strong>PNR:</strong> {booking.pnr}
        </p>
        <p>
          <strong>Train:</strong> {booking.trainName}
        </p>
        <p>
          <strong>Route:</strong> {booking.from} to {booking.to}
        </p>
        <p>
          <strong>Date:</strong> {formatIndianDate(booking.travelDate)}
        </p>
        <p>
          <strong>Class:</strong> {booking.travelClass}
        </p>
        <p>
          <strong>Status:</strong> {booking.bookingStatus}
        </p>
        <p>
          <strong>Seat Status:</strong> {String(booking.seatStatus || "confirmed").replace("_", " ")}
        </p>
        <p>
          <strong>Meal:</strong> {booking.mealOption || "No Meal"}
        </p>
        <p>
          <strong>Paid:</strong> {formatINR(booking.amountPaid)}
        </p>
      </div>

      <Link className="primary-btn inline" to="/history">
        View Booking History
      </Link>
    </section>
  );
};

export default ConfirmationPage;
