import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AutocompleteInput from "../components/AutocompleteInput";
import { indianCities, indianStates } from "../data/indiaLocations";
import { formatINR, formatIndianDate } from "../utils/formatters";

const emptyPassenger = {
  fullName: "",
  age: "",
  gender: "Male",
  seatPreference: "No Preference",
};

const mealPrices = {
  "No Meal": 0,
  Veg: 120,
  "Non-Veg": 180,
};

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const train = location.state?.train;
  const travelDate = location.state?.travelDate;

  const [passengers, setPassengers] = useState([{ ...emptyPassenger }]);
  const [contact, setContact] = useState({ email: "", phone: "", city: "", state: "" });
  const [mealOption, setMealOption] = useState("No Meal");

  const mealCharge = useMemo(() => mealPrices[mealOption] * passengers.length, [mealOption, passengers.length]);
  const amount = useMemo(() => (train?.fare || 0) * passengers.length + mealCharge, [train?.fare, passengers.length, mealCharge]);

  if (!train || !travelDate) {
    return <Navigate to="/" replace />;
  }

  const updatePassenger = (index, key, value) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addPassenger = () => {
    setPassengers((prev) => [...prev, { ...emptyPassenger }]);
  };

  const proceedToPayment = (e) => {
    e.preventDefault();
    navigate("/payment", {
      state: {
        bookingDraft: {
          ...train,
          travelDate,
          passengers: passengers.map((p) => ({ ...p, age: Number(p.age) })),
          contact,
          mealOption,
          mealCharge,
          totalAmount: amount,
        },
      },
    });
  };

  return (
    <section className="panel">
      <h1>Passenger Details</h1>
      <p className="sub">
        {train.trainName} | {train.from} to {train.to} | {formatIndianDate(travelDate)} | {train.departureTime} IST
      </p>

      <form onSubmit={proceedToPayment} className="stack-form">
        {passengers.map((passenger, index) => (
          <div className="passenger-block" key={`passenger-${index}`}>
            <h3>Passenger {index + 1}</h3>
            <label>
              Full Name
              <input
                required
                value={passenger.fullName}
                onChange={(e) => updatePassenger(index, "fullName", e.target.value)}
              />
            </label>
            <label>
              Age
              <input
                required
                type="number"
                min={1}
                value={passenger.age}
                onChange={(e) => updatePassenger(index, "age", e.target.value)}
              />
            </label>
            <label>
              Gender
              <select
                value={passenger.gender}
                onChange={(e) => updatePassenger(index, "gender", e.target.value)}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Seat Preference
              <select
                value={passenger.seatPreference}
                onChange={(e) => updatePassenger(index, "seatPreference", e.target.value)}
              >
                <option>Window</option>
                <option>Aisle</option>
                <option>No Preference</option>
              </select>
            </label>
          </div>
        ))}

        <button type="button" className="secondary-btn" onClick={addPassenger}>
          + Add Passenger
        </button>

        <div className="passenger-block">
          <h3>Contact</h3>
          <label>
            Email
            <input
              type="email"
              required
              value={contact.email}
              onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
            />
          </label>
          <label>
            Phone
            <input
              required
              minLength={10}
              maxLength={10}
              value={contact.phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                setContact((p) => ({ ...p, phone: digitsOnly }));
              }}
            />
          </label>
          <AutocompleteInput
            label="City"
            name="city"
            required
            value={contact.city}
            options={indianCities}
            placeholder="Type city name"
            onChange={(value) => setContact((p) => ({ ...p, city: value }))}
          />
          <AutocompleteInput
            label="State"
            name="state"
            required
            value={contact.state}
            options={indianStates}
            placeholder="Type state name"
            onChange={(value) => setContact((p) => ({ ...p, state: value }))}
          />
          <label>
            Meal Preference
            <select value={mealOption} onChange={(e) => setMealOption(e.target.value)}>
              <option>No Meal</option>
              <option>Veg</option>
              <option>Non-Veg</option>
            </select>
          </label>
        </div>

        <div className="summary-row">
          <span>Base Fare</span>
          <strong>{formatINR((train?.fare || 0) * passengers.length)}</strong>
        </div>
        <div className="summary-row">
          <span>Meal Charge</span>
          <strong>{formatINR(mealCharge)}</strong>
        </div>
        <div className="summary-row">
          <span>Total Fare</span>
          <strong>{formatINR(amount)}</strong>
        </div>

        <button className="primary-btn" type="submit">
          Continue to Payment
        </button>
      </form>
    </section>
  );
};

export default BookingPage;
