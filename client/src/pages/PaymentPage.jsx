import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { formatINR } from "../utils/formatters";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.bookingDraft;

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [queueMeta, setQueueMeta] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
  });

  const queueLabel = useMemo(() => {
    if (!queueMeta) {
      return "";
    }
    if (queueMeta.status === "queued") {
      return `Queued at position ${queueMeta.position || "..."}`;
    }
    if (queueMeta.status === "processing") {
      return "Processing booking...";
    }
    return queueMeta.status;
  }, [queueMeta]);

  useEffect(() => {
    let timer;

    const poll = async () => {
      if (!queueMeta?.queueJobId || !processing) {
        return;
      }

      try {
        const { data } = await api.get(`/bookings/queue/${queueMeta.queueJobId}`);
        setQueueMeta((prev) => ({ ...prev, ...data }));

        if (data.status === "completed" && data.resultBooking?._id) {
          navigate(`/confirmation/${data.resultBooking._id}`, { replace: true });
          return;
        }

        if (data.status === "failed") {
          setProcessing(false);
          setError(data.failureReason || "Booking failed in queue");
          return;
        }
      } catch {
        setProcessing(false);
        setError("Unable to fetch queue status");
        return;
      }

      timer = setTimeout(poll, 2000);
    };

    poll();
    return () => clearTimeout(timer);
  }, [queueMeta?.queueJobId, processing, navigate]);

  if (!draft) {
    return <Navigate to="/" replace />;
  }

  const submitPayment = async (e) => {
    e.preventDefault();
    setError("");

    if (paymentMethod === "UPI") {
      const upiPattern = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
      if (!upiPattern.test(upiId.trim())) {
        setError("Enter a valid UPI ID (example: name@upi)");
        return;
      }
    }

    if (paymentMethod === "Card") {
      const cardNumber = cardDetails.cardNumber.replace(/\s/g, "");
      if (!/^\d{16}$/.test(cardNumber)) {
        setError("Enter a valid 16-digit card number");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry)) {
        setError("Enter expiry as MM/YY");
        return;
      }
      if (!/^\d{3}$/.test(cardDetails.cvv)) {
        setError("Enter a valid 3-digit CVV");
        return;
      }
      if (!cardDetails.cardHolder.trim()) {
        setError("Card holder name is required");
        return;
      }
    }

    setProcessing(true);

    try {
      const payload = {
        trainId: draft.trainId,
        trainName: draft.trainName,
        from: draft.from,
        to: draft.to,
        travelDate: draft.travelDate,
        departureTime: draft.departureTime,
        arrivalTime: draft.arrivalTime,
        duration: draft.duration,
        travelClass: draft.travelClass,
        passengers: draft.passengers,
        mealOption: draft.mealOption || "No Meal",
        mealCharge: draft.mealCharge || 0,
        paymentMethod,
        totalAmount: draft.totalAmount,
      };

      const { data } = await api.post("/bookings", payload);
      setQueueMeta(data);
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.message || "Payment simulation failed");
    }
  };

  return (
    <section className="panel payment-grid">
      <div>
        <h1>Payment</h1>
        <p className="sub">Simulated secure payment with queue-based booking processing.</p>
        <div className="summary-row">
          <span>Base Fare</span>
          <strong>{formatINR(draft.totalAmount - (draft.mealCharge || 0))}</strong>
        </div>
        <div className="summary-row">
          <span>Meal ({draft.mealOption || "No Meal"})</span>
          <strong>{formatINR(draft.mealCharge || 0)}</strong>
        </div>
        <div className="summary-row">
          <span>Amount Payable</span>
          <strong>{formatINR(draft.totalAmount)}</strong>
        </div>
        {processing && <p className="queue-info">{queueLabel}</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>

      <form className="stack-form" onSubmit={submitPayment}>
        <label>
          Payment Mode
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>UPI</option>
            <option>Card</option>
          </select>
        </label>

        {paymentMethod === "UPI" && (
          <label>
            UPI ID
            <input
              required
              placeholder="name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </label>
        )}

        {paymentMethod === "Card" && (
          <>
            <label>
              Card Number
              <input
                required
                placeholder="4111 1111 1111 1111"
                value={cardDetails.cardNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const grouped = raw.replace(/(.{4})/g, "$1 ").trim();
                  setCardDetails((prev) => ({ ...prev, cardNumber: grouped }));
                }}
              />
            </label>
            <label>
              Card Holder
              <input
                required
                placeholder="Passenger Name"
                value={cardDetails.cardHolder}
                onChange={(e) => setCardDetails((prev) => ({ ...prev, cardHolder: e.target.value }))}
              />
            </label>
            <div className="two-col">
              <label>
                Expiry
                <input
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardDetails.expiry}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d/]/g, "").slice(0, 5);
                    if (value.length === 2 && !value.includes("/")) {
                      setCardDetails((prev) => ({ ...prev, expiry: `${value}/` }));
                      return;
                    }
                    setCardDetails((prev) => ({ ...prev, expiry: value }));
                  }}
                />
              </label>
              <label>
                CVV
                <input
                  required
                  type="password"
                  maxLength={3}
                  value={cardDetails.cvv}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                    setCardDetails((prev) => ({ ...prev, cvv: digits }));
                  }}
                />
              </label>
            </div>
          </>
        )}

        <button type="submit" className="primary-btn" disabled={processing}>
          {processing ? "Processing in Queue..." : "Pay & Confirm"}
        </button>
      </form>
    </section>
  );
};

export default PaymentPage;
