import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineCalendar, HiOutlineClock, HiOutlineArrowLeft } from "react-icons/hi";

const todayISO = () => new Date().toISOString().split("T")[0];

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token, userType } = useSelector((state) => state.auth);

  const [doctor, setDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(todayISO());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [meetingType, setMeetingType] = useState("online");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canBook = useMemo(
    () => !!doctor && !!selectedSlot && !!appointmentDate && !submitting,
    [doctor, selectedSlot, appointmentDate, submitting]
  );

  useEffect(() => {
    if (!token || userType !== "Patient") {
      navigate("/login");
      return;
    }

    const loadDoctor = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/doctor/view-profile/${doctorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || data.message || "Failed to load doctor");
          return;
        }

        setDoctor(data.doctor);
      } catch (err) {
        console.error(err);
        setError("Failed to load doctor");
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [doctorId, navigate, token, userType]);

  useEffect(() => {
    if (!doctor || !appointmentDate || !token) return;

    const loadSlots = async () => {
      try {
        setError("");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/patient/appointments/doctor/${doctorId}/slots?date=${appointmentDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          setAvailableSlots([]);
          setSelectedSlot("");
          setError(data.message || "Unable to fetch slots");
          return;
        }

        setAvailableSlots(data.availableSlots || []);
        setSelectedSlot("");
      } catch (err) {
        console.error(err);
        setAvailableSlots([]);
        setSelectedSlot("");
        setError("Unable to fetch slots");
      }
    };

    loadSlots();
  }, [doctor, doctorId, appointmentDate, token]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!canBook) return;

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/patient/appointments/book`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId,
          appointmentDate,
          slotTime: selectedSlot,
          reason,
          meetingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to book appointment");
        return;
      }

      navigate("/appointments", {
        state: {
          successMessage: "Appointment request sent. You will see confirmation once doctor accepts.",
        },
      });
    } catch (err) {
      console.error(err);
      setError("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">{error || "Doctor not found"}</div>
      </div>
    );
  }

  const doctorName = doctor.name || `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600"
      >
        <HiOutlineArrowLeft size={16} /> Back
      </button>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Book Online Appointment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {doctorName} {doctor.specialist ? `• ${doctor.specialist}` : ""}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      <form
        onSubmit={handleBook}
        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
              <HiOutlineCalendar size={14} /> Appointment Date
            </span>
            <input
              type="date"
              value={appointmentDate}
              min={todayISO()}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Meeting Type</span>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="online">Online (Telemedicine)</option>
              <option value="in-person">In-person Visit</option>
            </select>
          </label>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
            <HiOutlineClock size={14} /> Available Time Slots
          </p>
          {availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              No available slots for this date yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${
                    selectedSlot === slot
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reason / Symptoms (Optional)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Briefly describe your concern"
          />
        </div>

        <button
          type="submit"
          disabled={!canBook}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
