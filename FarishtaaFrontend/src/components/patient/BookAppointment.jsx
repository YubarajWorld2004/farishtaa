import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineCalendar, HiOutlineClock, HiOutlineArrowLeft } from "react-icons/hi";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/hotToast.jsx";

const todayISO = () => new Date().toISOString().split("T")[0];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatINR = (value) => {
  const amount = Number(value || 0);
  const minimumFractionDigits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token, userType, firstName } = useSelector((state) => state.auth);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [doctor, setDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(todayISO());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [meetingType, setMeetingType] = useState("online");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isDoctorBookable = useMemo(() => {
    if (!doctor) return false;
    if (typeof doctor.canBookAppointment === "boolean") return doctor.canBookAppointment;
    if (typeof doctor._isUserDoctor === "boolean") return doctor._isUserDoctor;
    return Array.isArray(doctor.availability);
  }, [doctor]);

  const canBook = useMemo(
    () => isDoctorBookable && !!selectedSlot && !!appointmentDate && !submitting,
    [isDoctorBookable, selectedSlot, appointmentDate, submitting]
  );

  const consultationFee = useMemo(() => {
    const fee = Number(doctor?.fee || 0);
    if (!Number.isFinite(fee) || fee <= 0) return 0;
    return Number(fee.toFixed(2));
  }, [doctor]);

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
          `${apiBaseUrl}/api/doctor/view-profile/${doctorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          const message = data.message || data.error || "Failed to load doctor";
          setError(message);
          notifyError("Doctor load failed", message);
          return;
        }

        setDoctor(data.doctor);
      } catch (err) {
        console.error(err);
        setError("Failed to load doctor");
        notifyError("Doctor load failed", "Failed to load doctor");
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [doctorId, navigate, token, userType, apiBaseUrl]);

  useEffect(() => {
    if (!doctor || !appointmentDate || !token) return;

    if (!isDoctorBookable) {
      setAvailableSlots([]);
      setSelectedSlot("");
      const message = "Online appointment booking is not available for this doctor profile.";
      setError(message);
      notifyInfo("Booking unavailable", message);
      return;
    }

    const loadSlots = async () => {
      try {
        setError("");
        const res = await fetch(
          `${apiBaseUrl}/api/patient/appointments/doctor/${doctorId}/slots?date=${encodeURIComponent(
            appointmentDate
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAvailableSlots([]);
          setSelectedSlot("");
          const message = data.message || data.error || "Unable to fetch slots";
          setError(message);
          notifyError("Slots unavailable", message);
          return;
        }

        setAvailableSlots(data.availableSlots || []);
        setSelectedSlot("");
      } catch (err) {
        console.error(err);
        setAvailableSlots([]);
        setSelectedSlot("");
        setError("Unable to fetch slots");
        notifyError("Slots unavailable", "Unable to fetch slots");
      }
    };

    loadSlots();
  }, [doctor, doctorId, appointmentDate, token, isDoctorBookable, apiBaseUrl]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!canBook) return;

    try {
      setSubmitting(true);
      setError("");

      if (consultationFee > 0) {
        const orderRes = await fetch(`${apiBaseUrl}/api/patient/appointments/payment/order`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctorId,
            appointmentDate,
            slotTime: selectedSlot,
          }),
        });

        const orderData = await orderRes.json().catch(() => ({}));
        if (!orderRes.ok) {
          const message = orderData.message || orderData.error || "Unable to create payment order";
          setError(message);
          notifyError("Payment order failed", message, { push: true });
          return;
        }

        notifyInfo("Payment started", "Opening secure Razorpay checkout.", { push: true });

        const razorpayLoaded = await loadRazorpayScript();
        if (!razorpayLoaded || !window.Razorpay) {
          setError("Unable to load payment gateway. Please try again.");
          notifyError("Gateway unavailable", "Unable to load payment gateway. Please try again.", { push: true });
          return;
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.orderId,
            name: "Farishtaa",
            description: `Appointment with ${doctorName}`,
            prefill: {
              name: firstName || "",
            },
            notes: {
              doctorId,
              appointmentDate,
              slotTime: selectedSlot,
            },
            theme: {
              color: "#dc2626",
            },
            handler: (response) => resolve(response),
            modal: {
              ondismiss: () => reject(new Error("Payment was cancelled")),
            },
          });

          razorpay.on("payment.failed", (response) => {
            reject(new Error(response?.error?.description || "Payment failed"));
          });

          razorpay.open();
        });

        const verifyRes = await fetch(`${apiBaseUrl}/api/patient/appointments/payment/verify-and-book`, {
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
            razorpayOrderId: paymentResult.razorpay_order_id,
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            razorpaySignature: paymentResult.razorpay_signature,
          }),
        });

        const verifyData = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok) {
          const message = verifyData.message || verifyData.error || "Payment verification failed";
          setError(message);
          notifyError("Verification failed", message, { push: true });
          return;
        }

        notifySuccess("Payment successful", "Your payment is verified and appointment request is submitted.", {
          push: true,
        });

        navigate("/appointments", {
          state: {
            successMessage: "Payment successful. Appointment request sent. You will see confirmation once doctor accepts.",
          },
        });
        return;
      }

      const res = await fetch(`${apiBaseUrl}/api/patient/appointments/book`, {
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.message || data.error || "Failed to book appointment";
        setError(message);
        notifyError("Booking failed", message, { push: true });
        return;
      }

      notifySuccess("Appointment requested", "Your appointment request was submitted.", { push: true });

      navigate("/appointments", {
        state: {
          successMessage: "Appointment request sent. You will see confirmation once doctor accepts.",
        },
      });
    } catch (err) {
      console.error(err);
      const message = err?.message || "Failed to book appointment";
      setError(message);
      if (message === "Payment was cancelled") {
        notifyInfo("Payment cancelled", "You cancelled the payment popup.", { push: true });
      } else {
        notifyError("Booking failed", message, { push: true });
      }
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
        {consultationFee > 0 && (
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            Consultation Fee: ₹{formatINR(consultationFee)}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      <form
        onSubmit={handleBook}
        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 space-y-5"
      >
        {!isDoctorBookable && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 p-3 text-sm">
            This doctor profile is not connected for online appointment booking yet.
          </div>
        )}

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
          {submitting
            ? consultationFee > 0
              ? "Processing Payment..."
              : "Booking..."
            : consultationFee > 0
              ? `Pay ₹${formatINR(consultationFee)} & Confirm Appointment`
              : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
